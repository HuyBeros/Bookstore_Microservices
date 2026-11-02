import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { BookCard, BookCardSkeleton, EmptyState, ErrorState } from '../../components/ui';
import { bookApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { loadDiscoveryBooks } from '../../utils/homeBooks';
import HomeBanner from '../../components/features/HomeBanner/HomeBanner';
import { AUTHOR_PORTRAITS, EDITORIAL_SHELVES, SPOTLIGHT } from '../../data/homeEditorial';
import './HomePage.css';

const CONTAINER = 'mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8';
const scrollBehavior = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

function ShelfHeading({ id, eyebrow, title, to, description, children }) {
  return <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl"><p className="mb-2 text-[11px] font-semibold uppercase tracking-[.2em] text-primary">{eyebrow}</p>
      <h2 id={id} className="font-serif text-2xl font-bold text-ink sm:text-3xl lg:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{description}</p>}
    </div>
    <div className="flex items-center gap-3">{children}{to && <Link to={to} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">Xem tất cả <ArrowRight size={16} aria-hidden="true" /></Link>}</div>
  </div>;
}

function BestsellerShelf({ books, loading, error, retry, add }) {
  const shelf = useRef(null);
  const [edges, setEdges] = useState({ previous: false, next: false });
  useEffect(() => {
    const element = shelf.current;
    if (!element) return;
    const update = () => setEdges({ previous: element.scrollLeft > 2, next: element.scrollLeft + element.clientWidth < element.scrollWidth - 2 });
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); element.removeEventListener('scroll', update); };
  }, [books.length, loading]);
  const move = direction => shelf.current?.scrollBy({ left: direction * shelf.current.clientWidth * .85, behavior: scrollBehavior() });
  return <section aria-labelledby="home-bestsellers" className="border-b border-border py-12 sm:py-16">
    <div className={CONTAINER}>
      <ShelfHeading id="home-bestsellers" eyebrow="Những lựa chọn của độc giả" title="Sách bán chạy" to="/bestsellers"
        description="Xếp theo số cuốn đã bán từ các đơn đã giao và thanh toán tại Phương Anh.">
        {!loading && books.length > 0 && <div className="flex gap-2"><button type="button" aria-label="Sách bán chạy trước" aria-controls="bestseller-carousel" disabled={!edges.previous} onClick={() => move(-1)} className="home-shelf-arrow"><ChevronLeft size={19} /></button>
          <button type="button" aria-label="Sách bán chạy tiếp theo" aria-controls="bestseller-carousel" disabled={!edges.next} onClick={() => move(1)} className="home-shelf-arrow"><ChevronRight size={19} /></button></div>}
      </ShelfHeading>
      {loading ? <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">{[0,1,2,3].map(index => <BookCardSkeleton key={index} />)}</div>
        : error ? <ErrorState message={error} onRetry={retry} />
        : books.length ? <div className="relative">
          <div ref={shelf} id="bestseller-carousel" tabIndex={0} role="region" aria-label="Danh sách sách bán chạy, dùng phím mũi tên để cuộn"
            className="home-book-carousel" onKeyDown={event => {
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
              if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); shelf.current.scrollTo({left: event.key === 'Home' ? 0 : shelf.current.scrollWidth, behavior: scrollBehavior()}); }
            }}>
            {books.map((book, index) => <div key={book.id} className="home-carousel-item"><BookCard book={book} rank={index + 1} onAddToCart={() => add(book)} /></div>)}
          </div>
          {edges.next && <div className="home-shelf-edge" aria-hidden="true" />}
        </div> : <div className="home-sales-empty"><BookOpen size={30} strokeWidth={1.3} aria-hidden="true" /><div><h3 className="font-serif text-lg">Chờ những lựa chọn đầu tiên</h3><p className="mt-2 text-sm text-ink-muted">Danh sách sẽ xuất hiện khi cửa hàng có đơn đã giao và thanh toán.</p></div><Link to="/books" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">Khám phá kho sách <ArrowRight size={16} /></Link></div>}
    </div>
  </section>;
}

function AuthorPortrait({ author }) {
  const [failed, setFailed] = useState(false);
  return <article className="home-author">
    <Link to={`/books?authorId=${author.id}`} className="home-author-link">
      <div className="home-author-portrait">
        {failed ? <BookOpen size={40} aria-hidden="true" /> : <img src={author.image} alt={`Chân dung ${author.name}`} width="320" height="320" loading="lazy" decoding="async" style={{ objectPosition: author.position, transform: `scale(${author.zoom ?? 1})` }} onError={() => setFailed(true)} />}
      </div>
      <p className="mt-6 text-[10px] font-medium uppercase tracking-wider text-primary">{author.theme}</p>
      <h3 className="mt-2 font-serif text-xl font-semibold text-ink">{author.name}</h3>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-ink-muted"><strong className="mr-1 font-serif text-2xl font-medium text-primary">{author.count}</strong> tựa sách trong kho</span><span className="home-author-arrow"><ArrowRight size={17} aria-hidden="true" /></span></div>
    </Link>
  </article>;
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [revision, setRevision] = useState(0);
  const [books, setBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState(null);
  const [featuredBook, setFeaturedBook] = useState(null);
  const [featuredAuthors, setFeaturedAuthors] = useState([]);
  const [authorError, setAuthorError] = useState(false);
  const [topics, setTopics] = useState([]);
  const [discoveryBooks, setDiscoveryBooks] = useState([]);
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const active = () => !controller.signal.aborted;
    const facetsPromise = bookApi.getBookFilters({}, options);
    facetsPromise.then(facets => {
      if (!active()) return;
      setTopics([
        ['Văn học', 'Văn học hiện đại'], ['Tâm lý học', 'Tâm lý & Kỹ năng sống'],
        ['Thiếu nhi', 'Văn học thiếu nhi'], ['Triết học', 'Triết học & Tư tưởng'],
      ].flatMap(([label, name]) => {
        const category = facets.categories.find(item => item.name === name && item.count > 0);
        return category ? [{ label, id: category.id }] : [];
      }));
      setFeaturedAuthors(AUTHOR_PORTRAITS.flatMap(profile => {
        const match = facets.authors.find(author => author.name.toLocaleLowerCase('vi') === profile.name.toLocaleLowerCase('vi') && author.count > 0);
        return match ? [{ ...profile, ...match }] : [];
      }));
      setAuthorError(false);
    }).catch(() => { if (active()) setAuthorError(true); });
    const featuredPromise = bookApi.getBooks({ q: SPOTLIGHT.title, limit: 1 }, options)
      .then(result => { const book = result.data?.[0] ?? null; if (active()) setFeaturedBook(book); return book; })
      .catch(() => { if (active()) setFeaturedBook(null); return null; });
    const bestsellingPromise = bookApi.getBestsellers({ limit: 12 }, options).then(result => {
      if (active()) { setBooks(result.data); setBooksError(null); }
      return result.data;
    }).catch(() => { if (active()) setBooksError('Chưa tải được bảng sách bán chạy. Vui lòng thử lại.'); return []; })
      .finally(() => { if (active()) setBooksLoading(false); });
    Promise.all([facetsPromise, featuredPromise, bestsellingPromise]).then(async ([facets, featured, bestsellers]) => {
      if (!active()) return;
      const excluded = [...bestsellers, ...(featured ? [featured] : [])];
      const result = await loadDiscoveryBooks(excluded, facets.categories, bookApi.getBooks, options, EDITORIAL_SHELVES);
      if (active()) { setDiscoveryBooks(result.books); setDiscoveryError(result.incomplete ? 'Một số thể loại chưa tải được. Bạn có thể thử lại.' : null); }
    }).catch(() => { if (active()) { setDiscoveryBooks([]); setDiscoveryError('Chưa tải được sách tuyển chọn. Vui lòng thử lại.'); } })
      .finally(() => { if (active()) setDiscoveryLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const retry = () => { setBooksLoading(true); setDiscoveryLoading(true); setRevision(value => value + 1); };
  const add = async book => {
    if (!isAuthenticated) { navigate(`/login?redirect=/books/${book.id}`); return; }
    try { await addToCart(book, 1); showToast({type:'success', message:'Đã thêm sách vào giỏ hàng.'}); }
    catch (error) { showToast({type:'error', message:error.message || 'Chưa thể thêm sách vào giỏ hàng.'}); }
  };

  return <div className="bg-white text-ink">
    <HomeBanner book={featuredBook} topics={topics} />
    <BestsellerShelf books={books} loading={booksLoading} error={booksError} retry={retry} add={add} />
    <section aria-labelledby="home-discovery" className="border-b border-border py-12 sm:py-16"><div className={CONTAINER}>
      <ShelfHeading id="home-discovery" eyebrow="Tuyển chọn theo thể loại" title="Những tựa sách để khám phá" to="/books" description="Từ một câu chuyện đẹp đến một ý tưởng mới. Mỗi thể loại, một gợi ý để bắt đầu." />
      {discoveryLoading ? <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">{Array.from({length:8},(_,index)=><BookCardSkeleton key={index} />)}</div> : <>
        {discoveryError && <ErrorState message={discoveryError} onRetry={retry} />}
        {discoveryBooks.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:gap-x-7 lg:grid-cols-4">{discoveryBooks.map(book => <BookCard key={book.id} book={book} onAddToCart={() => add(book)} />)}</div>
          : !discoveryError && <EmptyState title="Chưa có gợi ý phù hợp" description="Bạn có thể khám phá thêm trong toàn bộ danh mục sách." showQuote={false} />}
      </>}
    </div></section>
    <section aria-labelledby="home-authors" className="bg-[#faf8f4] py-12 sm:py-16"><div className={CONTAINER}>
      <ShelfHeading id="home-authors" eyebrow="Những cây bút quen thuộc" title="Tác giả tiêu biểu" description="Gặp gỡ những tác giả qua các tác phẩm đang có tại nhà sách." />
      {authorError ? <ErrorState message="Chưa tải được danh sách tác giả." onRetry={retry} /> : <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">{featuredAuthors.map(author => <AuthorPortrait key={author.id} author={author} />)}</div>}
      {featuredAuthors.length > 0 && <details className="home-photo-credits"><summary>Nguồn ảnh tác giả</summary><ul>{featuredAuthors.map(author => <li key={author.id}><a href={author.source} target="_blank" rel="noreferrer">{author.name}: {author.credit}</a>{author.license && <> · <a href={author.license} target="_blank" rel="noreferrer">Giấy phép</a></>}</li>)}</ul><p>Ảnh được hiển thị trong khung tròn bằng CSS.</p></details>}
    </div></section>
  </div>;
}
