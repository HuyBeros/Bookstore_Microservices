"""Metadata correctness tests; no network or database required."""

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from nhanam_audit import (BASE, Robots, compare, load_catalog, match_book,
                          parse_collection, parse_product, public_url, report)


BOOK = {"id": 5, "title": "Cuốn sách (Bìa cứng)", "version": 0,
        "authors": [{"id": 1, "name": "Nhã Nam tuyển chọn"}],
        "category": "Công nghệ thông tin & Lập trình", "publisher": "Nhã Nam"}
MAPPING = {"collections": {"van-hoc-hien-dai": "Văn học & Tiểu thuyết",
                           "lich-su-1": "Lịch sử & Địa lý"},
           "ambiguous_authors": ["michiel liisa"]}
MATCH = {"method": "exact_title", "confidence": "high", "candidates": []}


def source(**changes):
    return {"title": BOOK["title"], "url": BASE + "/cuon-sach", "canonical_url": BASE + "/cuon-sach",
            "author_raw": "Tác Giả Đúng", "publisher_raw": "Đang cập nhật", **changes}


def membership(handle):
    return {"url": BASE + "/" + handle, "name": handle, "evidence_url": BASE + "/" + handle}


class MetadataAuditTests(unittest.TestCase):
    def test_parser_ignores_recommended_authors_and_translator(self):
        body = '''<h1>Cuốn sách</h1><div>Tác giả: Người Không Đúng</div>
        <ul class="book-info-detail"><li><span>Tác giả</span><span>Người Đúng</span></li>
        <li><span>Dịch giả</span><span>Người Dịch</span></li>
        <li><span>Nhà xuất bản</span><span>Dân Trí</span></li></ul>
        <section>Tác giả Sách Gợi Ý</section>'''
        result = parse_product(body, BASE + "/cuon-sach")
        self.assertEqual(result["author_raw"], "Người Đúng")
        self.assertEqual(result["translator_raw"], "Người Dịch")
        self.assertEqual(result["publisher_raw"], "Dân Trí")

    def test_missing_label_does_not_extract_author_from_description(self):
        result = parse_product('<h1>Sách</h1><p>Tác giả: Một Người</p>', BASE + "/sach")
        self.assertEqual(result["author_raw"], "")

    def test_collection_membership_excludes_menu_recommendations_and_search(self):
        page = parse_collection('''<h1>Văn học</h1><nav><a href="/menu">Menu</a></nav>
          <div class="proloop-image"><a class="image-thumb" href="/sach">Sách</a></div>
          <a href="/van-hoc-hien-dai?page=2">2</a>
          <a href="/search?page=3">Search</a>
          <a href="/van-hoc-hien-dai?page=2&amp;sortBy=price">Sort</a>''', BASE + '/van-hoc-hien-dai')
        self.assertEqual(page["members"], {BASE + "/sach"})
        self.assertEqual(page["next_urls"], [BASE + "/van-hoc-hien-dai?page=2"])

    def test_ajax_loadmore_and_relative_pagination_are_detected(self):
        page = parse_collection('''<h1>Văn học</h1>
          <a href="?page=2">2</a>
          <a class="btn-loadmore" data-page="2" data-totalpage="4" href="javascript:void(0)">Xem thêm</a>''',
          BASE + "/van-hoc-hien-dai")
        self.assertEqual(page["declared_total_pages"], 4)
        self.assertEqual(page["next_urls"], [BASE + f"/van-hoc-hien-dai?page={i}" for i in (2, 3, 4)])

    def test_editions_remain_distinct(self):
        products = [{"title": "Cuốn sách (Bìa mềm)", "url": BASE + "/bia-mem"}]
        self.assertNotEqual(match_book(BOOK, products)["confidence"], "high")

    def test_duplicate_exact_titles_are_not_chosen_arbitrarily(self):
        products = [{"title": BOOK["title"], "url": BASE + "/a"},
                    {"title": BOOK["title"], "url": BASE + "/b"}]
        self.assertEqual(match_book(BOOK, products)["method"], "duplicate_title")

    def test_fuzzy_match_never_produces_high_confidence_author_change(self):
        fuzzy = {**MATCH, "confidence": "review", "method": "similar_title"}
        result = compare(BOOK, fuzzy, source(), [membership("van-hoc-hien-dai")], MAPPING)
        self.assertEqual(result["changes"]["authors"]["confidence"], "review")
        self.assertIn("book_identity_needs_review", result["review_reasons"])

    def test_missing_and_ambiguous_source_authors_are_flagged(self):
        for author in ["", "Đang cập nhật", "michiel liisa"]:
            with self.subTest(author=author):
                result = compare(BOOK, MATCH, source(author_raw=author), [], MAPPING)
                self.assertEqual(result["status"], "needs_review")
                self.assertNotEqual(result["changes"].get("authors", {}).get("confidence"), "high")

    def test_placeholder_source_does_not_become_a_replacement_author(self):
        result = compare({**BOOK, "authors": [{"id": 2, "name": "Tên Hợp Lệ"}]}, MATCH,
                         source(author_raw="Nhã Nam tuyển chọn"), [], MAPPING)
        self.assertNotIn("authors", result["changes"])

    def test_hyphenated_name_is_not_split_into_multiple_authors(self):
        result = compare(BOOK, MATCH, source(author_raw="Jean-Paul Sartre"), [], MAPPING)
        self.assertEqual(result["changes"]["authors"]["proposed"], ["Jean-Paul Sartre"])
        self.assertNotIn("multiple_author_roles_need_review", result["review_reasons"])

    def test_multi_author_delimiter_requires_review_and_preserves_raw(self):
        result = compare(BOOK, MATCH, source(author_raw="Tác Giả Một - Tác Giả Hai"), [], MAPPING)
        self.assertEqual(result["changes"]["authors"]["proposed"], ["Tác Giả Một", "Tác Giả Hai"])
        self.assertEqual(result["source"]["author_raw"], "Tác Giả Một - Tác Giả Hai")
        self.assertIn("multiple_author_roles_need_review", result["review_reasons"])

    def test_category_conflicts_do_not_choose_first_membership(self):
        result = compare(BOOK, MATCH, source(), [membership("van-hoc-hien-dai"), membership("lich-su-1")], MAPPING)
        self.assertNotIn("category", result["changes"])
        self.assertIn("category_conflict", result["review_reasons"])

    def test_category_change_requires_positive_evidence_and_review(self):
        result = compare(BOOK, MATCH, source(), [membership("van-hoc-hien-dai")], MAPPING)
        self.assertEqual(result["changes"]["category"]["proposed"], "Văn học & Tiểu thuyết")
        self.assertEqual(result["changes"]["category"]["confidence"], "review")
        no_evidence = compare(BOOK, MATCH, source(), [], MAPPING)
        self.assertNotIn("category", no_evidence["changes"])

    def test_source_canonical_change_blocks_high_confidence(self):
        result = compare(BOOK, MATCH, source(canonical_url=BASE + "/other-edition"), [], MAPPING)
        self.assertEqual(result["changes"]["authors"]["confidence"], "review")

    def test_robots_wildcards_and_specific_allow(self):
        rules = Robots('''User-agent: *
Disallow: /search
Disallow: /collections/*sortBy*
Disallow: /*previewThemeId*
Allow: /search/public$
User-agent: AhrefsBot
Disallow: /
''')
        self.assertFalse(rules.allowed(BASE + "/search?q=book"))
        self.assertFalse(rules.allowed(BASE + "/collections/all?sortBy=price"))
        self.assertFalse(rules.allowed(BASE + "/book?previewThemeId=2"))
        self.assertTrue(rules.allowed(BASE + "/search/public"))
        self.assertTrue(rules.allowed(BASE + "/book"))

    def test_external_or_private_destination_is_rejected(self):
        for url in ["http://nhanam.vn/book", "https://other.example/book", "https://nhanam.vn@localhost/book"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                public_url(url)

    def test_report_keeps_book_ids_versions_raw_evidence_and_utf8(self):
        result = compare(BOOK, MATCH, source(), [membership("van-hoc-hien-dai")], MAPPING)
        class Stats:
            requests = 0
            cache_hits = 1
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            report(path, {"active_books": [BOOK]}, [result], [], {}, Stats())
            data = json.loads((path / "report.json").read_text(encoding="utf-8"))
            self.assertFalse(data["summary"]["database_updated"])
            self.assertEqual(data["records"][0]["current"]["version"], 0)
            self.assertEqual(data["records"][0]["book_id"], 5)
            self.assertIn("Tác Giả Đúng", (path / "report.csv").read_text(encoding="utf-8-sig"))

    def test_csv_treats_imported_formula_like_text(self):
        book = {**BOOK, "title": '=HYPERLINK("https://example.invalid")'}
        result = compare(book, MATCH, source(title=book["title"]), [], MAPPING)
        class Stats:
            requests = cache_hits = 0
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)
            report(path, {"active_books": [book]}, [result], [], {}, Stats())
            import csv
            with (path / "report.csv").open(encoding="utf-8-sig", newline="") as stream:
                row = next(csv.DictReader(stream))
            self.assertTrue(row["title"].startswith("'="))

    def test_database_connection_is_read_only_and_environment_overrides_dotenv(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / ".env").write_text("DB_PASSWORD=file-value\nDB_NAME=AnotherService\n", encoding="utf-8")
            with patch("nhanam_audit.ROOT", root), patch.dict("os.environ", {"DB_PASSWORD": "environment-value"}, clear=True), patch("psycopg2.connect") as connect:
                connection = connect.return_value.__enter__.return_value
                cursor = connection.cursor.return_value.__enter__.return_value
                cursor.fetchall.return_value = []
                self.assertTrue(load_catalog()["read_only"])
                self.assertIn("default_transaction_read_only=on", connect.call_args.kwargs["options"])
                self.assertEqual(connect.call_args.kwargs["password"], "environment-value")
                self.assertEqual(connect.call_args.kwargs["dbname"], "BookDB")
                connection.set_session.assert_called_once_with(readonly=True)


if __name__ == "__main__":
    unittest.main()
