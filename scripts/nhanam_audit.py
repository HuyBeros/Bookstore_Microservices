"""Read-only Nhã Nam metadata audit. No import/update/delete mode is provided."""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import os
import re
import sys
import time
import unicodedata
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlencode, urljoin, urlsplit, urlunsplit

import requests
from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
BASE = "https://nhanam.vn"
AGENT = "BookStoreCatalogAudit/1.0"
NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9",
      "i": "http://www.google.com/schemas/sitemap-image/1.1"}
REVIEW_LABELS = {
    "book_identity_needs_review": "Cần xác minh đúng sách/ấn bản",
    "canonical_url_changed": "URL chuẩn của nguồn đã thay đổi",
    "known_ambiguous_source_author": "Tên tác giả trên nguồn có dấu hiệu thiếu/sai",
    "missing_or_placeholder_author": "Nguồn thiếu tác giả hợp lệ",
    "suspicious_author_value": "Giá trị tác giả đáng ngờ",
    "multiple_author_roles_need_review": "Cần xác minh danh sách và vai trò tác giả",
    "category_conflict": "Nguồn thuộc nhiều nhóm thể loại",
    "no_specific_category_evidence": "Chưa tìm được bằng chứng thể loại cụ thể",
    "category_mapping_requires_review": "Cần kiểm tra ánh xạ thể loại",
    "publisher_requires_verification": "Cần xác minh nhà xuất bản",
    "source_not_found": "Chưa tìm thấy nguồn phù hợp",
    "ambiguous_source_match": "Có nhiều nguồn trùng tên",
    "source_fetch_or_parse_failed": "Không đọc được thông tin nguồn",
    "proposed_change": "Có đề xuất thay đổi",
    "unchanged": "Chưa phát hiện khác biệt ở các trường đối chiếu",
}


def clean(value):
    return re.sub(r"\s+", " ", html.unescape(value or "")).strip()


def normalized(value):
    value = unicodedata.normalize("NFKC", clean(value)).casefold()
    return re.sub(r"[^\w]+", " ", value).strip()


def slug(value):
    value = unicodedata.normalize("NFKD", normalized(value).replace("đ", "d"))
    return re.sub(r"[^a-z0-9]+", "-", "".join(c for c in value if not unicodedata.combining(c))).strip("-")


def public_url(value):
    url = urljoin(BASE + "/", value)
    parts = urlsplit(url)
    if parts.scheme != "https" or parts.netloc != "nhanam.vn" or parts.fragment:
        raise ValueError("Chỉ chấp nhận URL HTTPS công khai thuộc nhanam.vn")
    return url


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


class Robots:
    """Longest matching allow/disallow rule, including Sapo's * and $ patterns."""

    def __init__(self, body):
        groups, agents, rules = [], [], []
        for line in body.splitlines() + ["User-agent: __end__"]:
            line = line.split("#", 1)[0].strip()
            if ":" not in line:
                continue
            key, value = (x.strip() for x in line.split(":", 1))
            if key.lower() == "user-agent":
                if rules:
                    groups.append((agents, rules))
                    agents, rules = [], []
                agents.append(value.lower())
            elif key.lower() in ("allow", "disallow") and agents and value:
                rules.append((key.lower() == "allow", value))
        matching = [(max((len(a) if a != "*" else 0) for a in aa
                         if a == "*" or a in AGENT.lower()), rr)
                    for aa, rr in groups if any(a == "*" or a in AGENT.lower() for a in aa)]
        best = max((length for length, _ in matching), default=-1)
        self.rules = [rule for length, rr in matching if length == best for rule in rr]

    def allowed(self, url):
        parts = urlsplit(url)
        target = parts.path + ("?" + parts.query if parts.query else "")
        matches = []
        for allow, pattern in self.rules:
            expression = re.escape(pattern).replace(r"\*", ".*")
            if pattern.endswith("$"):
                expression = expression[:-2] + "$"
            if re.match(expression, target):
                matches.append((len(pattern.replace("*", "").rstrip("$")), allow))
        return max(matches, default=(0, True))[1]


class Fetcher:
    def __init__(self, cache_dir, delay=1.5, offline=False, refresh=False):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.delay = max(delay, 1.0)
        self.offline = offline
        self.refresh = refresh
        self.last_request = 0.0
        self.session = requests.Session()
        self.session.headers["User-Agent"] = AGENT
        self.robots = None
        self.requests = 0
        self.cache_hits = 0
        self.robots = Robots(self.get(BASE + "/robots.txt").decode("utf-8-sig"))

    def get(self, value):
        url = public_url(value)
        if self.robots is not None and not self.robots.allowed(url):
            raise ValueError("robots.txt không cho phép: " + url)
        stem = self.cache_dir / hashlib.sha256(url.encode()).hexdigest()
        body_path = stem.with_suffix(".body")
        meta_path = stem.with_suffix(".json")
        if not self.refresh and body_path.exists() and meta_path.exists():
            self.cache_hits += 1
            return body_path.read_bytes()
        if self.offline:
            raise FileNotFoundError("Chưa có cache: " + url)
        for attempt in range(3):
            time.sleep(max(0, self.delay - (time.monotonic() - self.last_request)))
            self.last_request = time.monotonic()
            self.requests += 1
            # Never follow a redirect before validating its destination and robots rules.
            response = self.session.get(url, timeout=(10, 30), allow_redirects=False)
            if response.status_code in (301, 302, 303, 307, 308):
                raise ValueError("URL chuyển hướng, cần đối chiếu thủ công: " + url)
            if response.status_code in (429, 503) and attempt < 2:
                retry = response.headers.get("Retry-After", "")
                time.sleep(min(30, max(2 ** (attempt + 1), int(retry) if retry.isdigit() else 0)))
                continue
            response.raise_for_status()
            if len(response.content) > 8 * 1024 * 1024:
                raise ValueError("Trang vượt giới hạn 8 MB: " + url)
            body_path.write_bytes(response.content)
            write_json(meta_path, {"url": url, "fetched_at": datetime.now(timezone.utc).isoformat(),
                                   "sha256": hashlib.sha256(response.content).hexdigest()})
            return response.content
        raise RuntimeError("Không lấy được trang: " + url)

    def metadata(self, url):
        path = self.cache_dir / (hashlib.sha256(url.encode()).hexdigest() + ".json")
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def load_catalog():
    """Use the same credential precedence as Catalog, in a read-only transaction."""
    import psycopg2
    from psycopg2.extras import RealDictCursor

    settings = {}
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8-sig").splitlines():
            match = re.match(r"\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$", line)
            if match:
                settings[match[1]] = match[2].strip().strip("\"'")
    settings.update(os.environ)
    config = {"host": settings.get("DB_HOST", "localhost"), "port": settings.get("DB_PORT", "5432"),
              "dbname": "BookDB", "user": settings.get("CATALOG_DB_USER", settings.get("DB_USERNAME", "postgres")),
              "password": settings.get("CATALOG_DB_PASSWORD", settings.get("DB_PASSWORD", ""))}
    if settings.get("CATALOG_DB_URL"):
        parts = urlsplit(settings["CATALOG_DB_URL"].removeprefix("jdbc:"))
        if parts.scheme != "postgresql" or not parts.hostname or not parts.path.strip("/"):
            raise ValueError("CATALOG_DB_URL phải là URL JDBC PostgreSQL hợp lệ")
        config.update(host=parts.hostname, port=parts.port or 5432, dbname=unquote(parts.path.lstrip("/")))
        if parts.username:
            config["user"] = unquote(parts.username)
        if parts.password:
            config["password"] = unquote(parts.password)
        for key in ("sslmode", "sslrootcert"):
            values = parse_qs(parts.query).get(key)
            if values:
                config[key] = values[0]
    with psycopg2.connect(**config, connect_timeout=5, options="-c default_transaction_read_only=on -c statement_timeout=15000") as connection:
        connection.set_session(readonly=True)
        with connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("""
                SELECT b.id, b.title, b.version, c.id AS category_id, c.name AS category,
                       p.id AS publisher_id, p.name AS publisher,
                       COALESCE((SELECT json_agg(json_build_object('id', a.id, 'name', a.name)
                                              ORDER BY ba.author_order)
                                 FROM books_authors ba JOIN authors a ON a.id=ba.author_id
                                 WHERE ba.book_id=b.id), '[]') AS authors
                FROM books b JOIN categories c ON c.id=b.category_id
                JOIN publishers p ON p.id=b.publisher_id WHERE b.active ORDER BY b.id
            """)
            books = [dict(row) for row in cursor.fetchall()]
    return {"captured_at": datetime.now(timezone.utc).isoformat(), "active_books": books,
            "read_only": True}


def discover(fetcher):
    root = ET.fromstring(fetcher.get(BASE + "/sitemap.xml"))
    product_urls, collection_urls = [], []
    for node in root.findall("s:sitemap", NS):
        loc = node.findtext("s:loc", namespaces=NS)
        if not loc or not re.search(r"/sitemap_(products|collections)_\d+\.xml$", loc):
            continue
        product = "/sitemap_products_" in loc
        data = ET.fromstring(fetcher.get(loc))
        for item in data.findall("s:url", NS):
            url = item.findtext("s:loc", namespaces=NS)
            if not url or url.rstrip("/") == BASE:
                continue
            public_url(url)
            if product:
                product_urls.append({"url": url, "title": clean(item.findtext("i:image/i:title", namespaces=NS))})
            else:
                collection_urls.append(url)
    if not product_urls or not collection_urls:
        raise ValueError("Sitemap không có danh sách sản phẩm/danh mục như mong đợi")
    return list({p["url"]: p for p in product_urls}.values()), sorted(set(collection_urls))


def match_book(book, products):
    title = normalized(book["title"])
    exact = [p for p in products if normalized(p["title"]) == title]
    if len(exact) == 1:
        return {"method": "exact_title", "confidence": "high", "candidates": exact}
    if exact:
        return {"method": "duplicate_title", "confidence": "review", "candidates": exact[:5]}
    same_slug = [p for p in products if urlsplit(p["url"]).path.strip("/") == slug(book["title"])]
    if len(same_slug) == 1:
        return {"method": "exact_slug", "confidence": "review", "candidates": same_slug}
    ranked = sorted(((SequenceMatcher(None, title, normalized(p["title"])).ratio(), p) for p in products),
                    key=lambda pair: pair[0], reverse=True)
    return {"method": "similar_title" if ranked and ranked[0][0] >= .72 else "not_found",
            "confidence": "review", "candidates": [{**p, "similarity": round(score, 4)}
                                                     for score, p in ranked[:3] if score >= .72]}


def select_pilot(books, limit):
    chosen = []

    def add(book):
        if book and book not in chosen and len(chosen) < limit:
            chosen.append(book)

    # Include the two examples already checked with the user, then diverse problem cases.
    for book_id in (499, 500):
        add(next((b for b in books if b["id"] == book_id), None))
    for book in [b for b in books if len(b["authors"]) > 1][:2]:
        add(book)
    suspicious = [b for b in books if any(author_issues(a["name"], []) for a in b["authors"])
                  and all(normalized(a["name"]) != normalized("Nhã Nam tuyển chọn") for a in b["authors"])]
    for book in suspicious[:3]:
        add(book)
    categories = sorted(set(b["category"] for b in books))
    for category in categories:
        add(next((b for b in books if b["category"] == category), None))
    for book in books:
        add(book)
    return chosen


def parse_product(body, url):
    soup = BeautifulSoup(body, "html.parser")
    heading = soup.find("h1")
    if not heading:
        raise ValueError("Không tìm thấy tiêu đề sản phẩm")
    fields = {}
    # Only the labelled bibliographic block; never descriptions or recommended cards.
    for row in soup.select(".book-info-detail li"):
        spans = row.find_all("span", recursive=False)
        if len(spans) >= 2:
            fields[normalized(spans[0].get_text())] = clean(spans[1].get_text(" ", strip=True))
    author = fields.get(normalized("Tác giả"), "")
    canonical = soup.select_one('link[rel="canonical"]')
    canonical_url = public_url(canonical["href"]) if canonical and canonical.get("href") else url
    crumbs = [{"url": public_url(a["href"]), "name": clean(a.get_text(" ", strip=True))}
              for a in soup.select(".breadcrumb a[href]") if a["href"] != "/"]
    identifiers = {}
    for label, value in fields.items():
        if label in ("isbn", "isbn 13", "mã isbn"):
            identifiers["isbn_raw"] = value
    return {"url": url, "canonical_url": canonical_url, "title": clean(heading.get_text(" ", strip=True)),
            "author_raw": author, "translator_raw": fields.get(normalized("Dịch giả"), ""),
            "publisher_raw": fields.get(normalized("Nhà xuất bản"), ""),
            "publication_raw": fields.get(normalized("Ngày phát hành"), ""),
            "breadcrumbs": crumbs, "raw_fields": fields, **identifiers}


def parse_collection(body, url):
    soup = BeautifulSoup(body, "html.parser")
    heading = soup.find("h1")
    # Restrict to product cards; the global menu and recommendations are not memberships.
    members = {public_url(a["href"]) for a in soup.select(".proloop-image a.image-thumb[href]")}
    next_urls = set()
    for a in soup.select('a[href*="page="]'):
        candidate = public_url(urljoin(url, a["href"]))
        if urlsplit(candidate).path == urlsplit(url).path:
            query = parse_qs(urlsplit(candidate).query)
            if set(query) == {"page"} and len(query["page"]) == 1 and query["page"][0].isdigit():
                next_urls.add(candidate)
    # This storefront uses an AJAX 'Xem thêm' button rather than pagination links.
    declared_total = None
    for button in soup.select('[data-page][data-totalpage]'):
        total, start = button.get("data-totalpage", ""), button.get("data-page", "")
        if total.isdigit() and start.isdigit() and 1 < int(start) <= int(total) <= 1000:
            declared_total = max(declared_total or 0, int(total))
            parts = urlsplit(url)
            for page_number in range(int(start), int(total) + 1):
                next_urls.add(urlunsplit((parts.scheme, parts.netloc, parts.path,
                                         urlencode({"page": page_number}), "")))
    return {"name": clean(heading.get_text(" ", strip=True)) if heading else "", "members": members,
            "next_urls": sorted(next_urls, key=lambda u: int(parse_qs(urlsplit(u).query).get("page", [1])[0])),
            "declared_total_pages": declared_total}


def author_issues(value, ambiguous):
    text = normalized(value)
    if text in ("", "đang cập nhật", "nhã nam tuyển chọn", "unknown", "n a"):
        return ["missing_or_placeholder_author"]
    if text in {normalized(a) for a in ambiguous}:
        return ["known_ambiguous_source_author"]
    if text in ("bìa cứng", "bìa mềm", "picture book") or re.search(r"\d|[<>]", value):
        return ["suspicious_author_value"]
    if len(text.split()) > 10 or value.endswith((".", ":")):
        return ["suspicious_author_value"]
    return []


def usable(value):
    return normalized(value) not in ("", "đang cập nhật", "unknown")


def compare(book, match, source, memberships, mapping):
    reasons = []
    identity_ok = match["confidence"] == "high" and normalized(book["title"]) == normalized(source["title"])
    if not identity_ok:
        reasons.append("book_identity_needs_review")
    if source["canonical_url"] != source["url"]:
        reasons.append("canonical_url_changed")
        identity_ok = False
    author_raw = source["author_raw"]
    author_flags = author_issues(author_raw, mapping.get("ambiguous_authors", []))
    proposed_authors = [author_raw] if usable(author_raw) else []
    if any(flag in author_flags for flag in ("missing_or_placeholder_author", "suspicious_author_value")):
        proposed_authors = []
    # A delimiter may separate authors, translators or an organization. Keep raw evidence.
    if re.search(r"\s[-–&]\s|;|\s+và\s+", author_raw, flags=re.IGNORECASE):
        author_flags.append("multiple_author_roles_need_review")
        if proposed_authors:
            proposed_authors = [clean(x) for x in re.split(r"\s[-–&]\s|;|\s+và\s+", author_raw, flags=re.IGNORECASE) if clean(x)]
    reasons.extend(author_flags)
    category_evidence = []
    for member in memberships:
        handle = urlsplit(member["url"]).path.strip("/")
        if handle in mapping["collections"]:
            category_evidence.append({**member, "mapped_category": mapping["collections"][handle]})
    categories = sorted({item["mapped_category"] for item in category_evidence})
    if len(categories) != 1:
        reasons.append("category_conflict" if categories else "no_specific_category_evidence")
    current_authors = [a["name"] for a in book["authors"]]
    changes = {}
    if proposed_authors and [normalized(a) for a in current_authors] != [normalized(a) for a in proposed_authors]:
        changes["authors"] = {"before": current_authors, "proposed": proposed_authors,
                              "confidence": "high" if identity_ok and not author_flags else "review"}
    if len(categories) == 1 and categories[0] != book["category"]:
        changes["category"] = {"before": book["category"], "proposed": categories[0],
                               "confidence": "review"}  # Taxonomy mapping is an editorial choice.
        reasons.append("category_mapping_requires_review")
    publisher = source["publisher_raw"]
    if usable(publisher) and normalized(publisher) != normalized(book["publisher"]):
        changes["publisher"] = {"before": book["publisher"], "proposed": publisher, "confidence": "review"}
        reasons.append("publisher_requires_verification")
    status = "needs_review" if reasons else ("proposed_change" if changes else "unchanged")
    return {"book_id": book["id"], "title": book["title"], "current": book, "match": match,
            "source": source, "category_evidence": category_evidence, "category_candidates": categories,
            "changes": changes, "status": status, "review_reasons": sorted(set(reasons))}


def report(output, snapshot, records, discovery, coverage, fetcher):
    summary = {"generated_at": datetime.now(timezone.utc).isoformat(), "mode": "read_only_dry_run",
               "database_updated": False, "active_books": len(snapshot["active_books"]),
               "placeholder_author_books": sum(any(normalized(a["name"]) == normalized("Nhã Nam tuyển chọn")
                                                    for a in b["authors"]) for b in snapshot["active_books"]),
               "pilot_books": len(records), "source_products": len(discovery),
               "books_with_source_evidence": sum("source" in r for r in records),
               "statuses": dict(Counter(r["status"] for r in records)),
               "field_changes": dict(Counter(field for r in records for field in r.get("changes", {}))),
               "high_confidence_author_changes": sum(r.get("changes", {}).get("authors", {}).get("confidence") == "high" for r in records),
               "http_requests": fetcher.requests, "cache_hits": fetcher.cache_hits,
               "collection_coverage": coverage}
    write_json(output / "report.json", {"summary": summary, "records": records})
    columns = ["book_id", "title", "status", "current_authors", "proposed_authors", "author_confidence",
               "current_category", "proposed_category", "category_candidates", "current_publisher",
               "proposed_publisher", "source_url", "match_method", "review_reasons"]
    with (output / "report.csv").open("w", newline="", encoding="utf-8-sig") as stream:
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        for row in records:
            changes = row.get("changes", {})
            csv_row = {"book_id": row["book_id"], "title": row["title"], "status": row["status"],
                             "current_authors": " | ".join(a["name"] for a in row["current"]["authors"]),
                             "proposed_authors": " | ".join(changes.get("authors", {}).get("proposed", [])),
                             "author_confidence": changes.get("authors", {}).get("confidence", ""),
                             "current_category": row["current"]["category"],
                             "proposed_category": changes.get("category", {}).get("proposed", ""),
                             "category_candidates": " | ".join(row.get("category_candidates", [])),
                             "current_publisher": row["current"]["publisher"],
                             "proposed_publisher": changes.get("publisher", {}).get("proposed", ""),
                             "source_url": row.get("source", {}).get("url", ""), "match_method": row["match"]["method"],
                             "review_reasons": " | ".join(row["review_reasons"])}
            # A title or other imported text must remain plain text when opened in Excel.
            writer.writerow({key: ("'" + value if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@")) else value)
                             for key, value in csv_row.items()})
    def cell(value):
        return str(value).replace("|", " / ").replace("\n", " ")
    lines = ["# Đối chiếu dữ liệu Nhã Nam — chạy thử", "", "Chỉ đọc database; chưa áp dụng thay đổi.", "",
             f"- Sách đang hoạt động: {summary['active_books']}; tác giả mặc định: {summary['placeholder_author_books']}.",
             f"- Mẫu kiểm tra: {len(records)}; thay đổi tác giả có độ tin cậy cao: {summary['high_confidence_author_changes']}.",
             "- Báo cáo JSON giữ thông tin nguồn, danh mục, lý do cần kiểm tra và version hiện tại của sách.",
             "- Đề xuất thể loại và nhà xuất bản luôn cần kiểm tra. Thiếu bằng chứng không có nghĩa là thể loại hiện tại đúng.",
             f"- Đã giới hạn tối đa {coverage.get('max_pages_per_collection', '?')} trang mỗi danh mục; "
             f"{sum(bool(c.get('truncated')) for c in coverage.get('collections', []))} danh mục còn trang chưa quét.",
             "- Ghép trùng tên chỉ là ứng viên; khi cập nhật cần xác minh thêm ấn bản/ISBN.", "",
             "| ID | Sách | Tác giả hiện tại → đề xuất | Thể loại hiện tại → đề xuất | Cần kiểm tra |", "|---|---|---|---|---|"]
    for row in records:
        changes = row.get("changes", {})
        authors = " / ".join(a["name"] for a in row["current"]["authors"])
        if "authors" in changes:
            authors += " → " + " / ".join(changes["authors"]["proposed"])
        category = row["current"]["category"]
        if "category" in changes:
            category += " → " + changes["category"]["proposed"]
        source_url = row.get("source", {}).get("url")
        title = f"[{cell(row['title'])}]({source_url})" if source_url else cell(row["title"])
        notes = "; ".join(REVIEW_LABELS.get(reason, reason) for reason in row["review_reasons"])
        lines.append(f"| {row['book_id']} | {title} | {cell(authors)} | {cell(category)} | {cell(notes or REVIEW_LABELS.get(row['status'], row['status']))} |")
    (output / "report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--book-ids", help="Danh sách ID phân cách bằng dấu phẩy")
    parser.add_argument("--snapshot", type=Path, help="Dùng snapshot JSON thay vì kết nối database")
    parser.add_argument("--output-dir", type=Path, default=ROOT / ".cache/nhanam-audit/pilot")
    parser.add_argument("--cache-dir", type=Path, default=ROOT / ".cache/nhanam-audit/http")
    parser.add_argument("--mapping", type=Path, default=Path(__file__).with_name("nhanam_category_map.json"))
    parser.add_argument("--delay", type=float, default=1.5)
    parser.add_argument("--max-collection-pages", type=int, default=2)
    parser.add_argument("--offline", action="store_true", help="Chỉ sử dụng HTTP cache, không gửi request")
    parser.add_argument("--refresh-cache", action="store_true", help="Lấy lại nguồn công khai thay vì dùng cache cũ")
    args = parser.parse_args()
    if args.limit < 1 or args.max_collection_pages < 1:
        parser.error("limit và max-collection-pages phải lớn hơn 0")
    if args.offline and not args.snapshot:
        parser.error("--offline cần --snapshot để không phụ thuộc database")
    if args.offline and args.refresh_cache:
        parser.error("--offline không dùng cùng --refresh-cache")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    snapshot = json.loads(args.snapshot.read_text(encoding="utf-8")) if args.snapshot else load_catalog()
    write_json(args.output_dir / "catalog-snapshot.json", snapshot)
    mapping = json.loads(args.mapping.read_text(encoding="utf-8"))
    books = snapshot["active_books"]
    if args.book_ids:
        ids = [int(value) for value in args.book_ids.split(",")]
        by_id = {b["id"]: b for b in books}
        if any(value not in by_id for value in ids):
            raise ValueError("Một số book ID không tồn tại trong snapshot sách đang hoạt động")
        selected = [by_id[value] for value in dict.fromkeys(ids)][:args.limit]
    else:
        selected = select_pilot(books, args.limit)
    fetcher = Fetcher(args.cache_dir, args.delay, args.offline, args.refresh_cache)
    products, collection_urls = discover(fetcher)
    write_json(args.output_dir / "source-index.json", {"products": products, "collections": collection_urls})
    print(f"Catalog: {len(books)} sách; sitemap: {len(products)} sản phẩm; mẫu: {len(selected)}", flush=True)
    matched = {b["id"]: match_book(b, products) for b in selected}
    evidence = defaultdict(list)
    coverage = {"collections": [], "errors": [], "max_pages_per_collection": args.max_collection_pages,
                "note": "Chỉ bằng chứng dương tính; danh mục chưa quét hết không chứng minh sách không thuộc danh mục đó."}
    for url in collection_urls:
        if urlsplit(url).path.strip("/") not in mapping["collections"]:
            continue
        pending, seen = [url], set()
        name, error, declared_total = "", "", None
        while pending and len(seen) < args.max_collection_pages:
            page_url = pending.pop(0)
            if page_url in seen:
                continue
            try:
                page = parse_collection(fetcher.get(page_url), page_url)
                seen.add(page_url)
                name = page["name"]
                if page["declared_total_pages"]:
                    declared_total = max(declared_total or 0, page["declared_total_pages"])
                for member in page["members"]:
                    item = {"url": url, "name": name, "evidence_url": page_url, "evidence_type": "collection_product_card"}
                    if item not in evidence[member]:
                        evidence[member].append(item)
                pending.extend(candidate for candidate in page["next_urls"] if candidate not in seen and candidate not in pending)
            except (requests.RequestException, ValueError, FileNotFoundError, ET.ParseError) as exc:
                error = type(exc).__name__
                coverage["errors"].append({"url": page_url, "error": error})
                break
        coverage["collections"].append({"url": url, "name": name, "pages_scanned": len(seen),
                                         "pending_pages": len(set(pending) - seen), "declared_total_pages": declared_total,
                                         "truncated": bool(set(pending) - seen), "error": error})
        print(f"Danh mục {urlsplit(url).path}: {len(seen)} trang" + (f" ({error})" if error else ""), flush=True)
    records = []
    for book in selected:
        match = matched[book["id"]]
        if not match["candidates"] or match["method"] == "duplicate_title":
            records.append({"book_id": book["id"], "title": book["title"], "current": book,
                            "match": match, "status": "needs_review", "changes": {},
                            "review_reasons": ["source_not_found" if not match["candidates"] else "ambiguous_source_match"]})
            continue
        url = match["candidates"][0]["url"]
        try:
            source = parse_product(fetcher.get(url), url)
            source["fetch_metadata"] = fetcher.metadata(url)
            memberships = list(evidence.get(url, []))
            for crumb in source["breadcrumbs"]:
                if urlsplit(crumb["url"]).path.strip("/") in mapping["collections"]:
                    memberships.append({**crumb, "evidence_url": url, "evidence_type": "product_breadcrumb"})
            records.append(compare(book, match, source, memberships, mapping))
        except (requests.RequestException, ValueError, FileNotFoundError) as exc:
            records.append({"book_id": book["id"], "title": book["title"], "current": book,
                            "match": match, "status": "needs_review", "changes": {},
                            "review_reasons": ["source_fetch_or_parse_failed", type(exc).__name__]})
        print(f"Sách {book['id']}: {records[-1]['status']}", flush=True)
    summary = report(args.output_dir, snapshot, records, products, coverage, fetcher)
    print(json.dumps({key: value for key, value in summary.items() if key != "collection_coverage"}, ensure_ascii=False, indent=2))
    print(f"Báo cáo: {args.output_dir / 'report.md'}")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    try:
        main()
    except KeyboardInterrupt:
        print("Đã dừng; database không thay đổi.", file=sys.stderr)
        sys.exit(130)
    except Exception as exc:
        # Connection exceptions may contain private connection details; do not echo them.
        print(f"Audit thất bại ({type(exc).__name__}). Kiểm tra cấu hình, kết nối và cache; database không thay đổi.", file=sys.stderr)
        sys.exit(1)
