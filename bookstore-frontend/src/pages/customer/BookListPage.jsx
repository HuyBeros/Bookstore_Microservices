import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { BookCard, BookCardSkeleton, EmptyState, ErrorState } from '../../components/ui';
import CatalogFilters from '../../components/features/CatalogFilters';
import { bookApi } from '../../api/services';
import { readBookQuery, updateBookQuery } from '../../api/bookQuery';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function BookListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const queryString = searchParams.toString();
  const filters = useMemo(() => readBookQuery(new URLSearchParams(queryString)), [queryString]);
  useEffect(() => { window.scrollTo(0, 0); }, [filters.q, filters.page, filters.pageSize]);
  const requestKey = `${queryString}|${revision}`;
  const [result, setResult] = useState({ key: null, books: [], total: 0, totalPages: 0, facets: null, error: null, filterError: null });
  const loading = result.key !== requestKey;
  useEffect(() => {
    const controller = new AbortController();
    const params = { ...filters, size: filters.pageSize };
    Promise.allSettled([bookApi.getBooks(params, { signal: controller.signal }), bookApi.getBookFilters(params, { signal: controller.signal })])
      .then(([books, facets]) => {
        if (controller.signal.aborted) return;
        if (books.status === 'fulfilled' && books.value.totalPages > 0 && filters.page > books.value.totalPages) {
          navigate(`/books?${updateBookQuery(queryString, { page: books.value.totalPages })}`, { replace: true });
          return;
        }
        setResult({ key: requestKey, books: books.status === 'fulfilled' ? books.value.data : [],
          total: books.status === 'fulfilled' ? books.value.total : 0,
          totalPages: books.status === 'fulfilled' ? books.value.totalPages : 0,
          facets: facets.status === 'fulfilled' ? facets.value : null,
          error: books.status === 'rejected' ? books.reason.message : null,
          filterError: facets.status === 'rejected' ? facets.reason.message : null });
      });
    return () => controller.abort();
  }, [filters, queryString, requestKey, navigate]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  const update = values => setSearchParams(updateBookQuery(searchParams, values));
  const clear = () => { setSearchParams({}); };
  const active = Boolean(filters.q || filters.categoryIds.length || filters.publisherIds.length || filters.authorIds.length || filters.minPrice !== '' || filters.maxPrice !== '');
  const chips = [
    ...(filters.q ? [{ key: 'q', label: `Từ khóa: ${filters.q}`, remove: () => update({ q: '' }) }] : []),
    ...[['category', 'categories'], ['publisher', 'publishers'], ['author', 'authors']].flatMap(([name, facet]) => filters[`${name}Ids`].map(id => ({
      key: `${name}-${id}`, label: result.facets?.[facet]?.find(option => String(option.id) === id)?.name ?? `#${id}`,
      remove: () => update({ [`${name}Id`]: filters[`${name}Ids`].filter(value => value !== id) }),
    }))),
    ...(filters.minPrice !== '' || filters.maxPrice !== '' ? [{ key: 'price', label: `${Number(filters.minPrice || 0).toLocaleString('vi-VN')} – ${filters.maxPrice === '' ? 'không giới hạn' : Number(filters.maxPrice).toLocaleString('vi-VN')} đ`, remove: () => update({ minPrice: '', maxPrice: '' }) }] : []),
  ];
  const add = async book => {
    if (!isAuthenticated) { navigate(`/login?redirect=${encodeURIComponent('/books?' + queryString)}`); return; }
    try { await addToCart(book, 1); showToast({ type: 'success', message: 'Đã thêm sách vào giỏ hàng' }); }
    catch (error) { showToast({ type: 'error', message: error.message }); }
  };
  const pages = Array.from({ length: result.totalPages }, (_, index) => index + 1)
    .filter(value => value === 1 || value === result.totalPages || Math.abs(value - filters.page) <= 1);
  return <div className="min-h-screen bg-paper px-4 py-8 font-body text-ink sm:px-6 lg:px-8">
    <div className="mx-auto max-w-[1280px] space-y-7">
      <nav aria-label="Đường dẫn" className="flex items-center gap-2 text-xs text-ink-muted"><Link to="/" className="hover:text-primary">Trang chủ</Link><span>/</span><span>Kho sách</span></nav>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="space-y-2"><p className="text-xs font-semibold uppercase tracking-widest text-primary">Kho tàng tri thức Phương Anh</p><h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">{filters.q ? `Kết quả cho “${filters.q}”` : 'Khám phá kho sách'}</h1><p role="status" aria-live="polite" className="text-sm text-ink-muted">{loading ? 'Đang tìm sách phù hợp…' : `${result.total.toLocaleString('vi-VN')} tựa sách${active ? ' phù hợp với tìm kiếm và bộ lọc' : ' trong kho sách'}.`}</p></div>
        <label className="flex items-center gap-2 text-xs text-ink-muted"><ArrowUpDown size={15} /><span>Sắp xếp:</span><select aria-label="Sắp xếp sách" value={filters.sort} onChange={event => update({ sort: event.target.value })} className="rounded-xl border border-border bg-white px-3 py-2.5 text-ink"><option value="newest">Mới nhất</option><option value="price-asc">Giá: Thấp đến Cao</option><option value="price-desc">Giá: Cao đến Thấp</option><option value="title">Tên sách A–Z</option></select></label>
      </div>
      <button aria-expanded={mobileOpen} aria-controls="catalog-filters" onClick={() => setMobileOpen(value => !value)} className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary lg:hidden"><SlidersHorizontal size={16} />{mobileOpen ? 'Ẩn bộ lọc' : 'Bộ lọc tìm kiếm'}</button>
      <div className="grid items-start gap-7 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside id="catalog-filters" className={`${mobileOpen ? 'block' : 'hidden'} lg:block`}><CatalogFilters facets={result.facets} filters={filters} onChange={update} onClear={clear} active={active} loading={loading} error={result.filterError} onClose={() => { setMobileOpen(false); window.scrollTo(0, 0); }} /></aside>
        <section aria-label="Kết quả tìm kiếm sách" aria-busy={loading} className="min-w-0 space-y-6">
          {chips.length > 0 && <div className="flex flex-wrap items-center gap-2">{chips.map(chip => <button key={chip.key} aria-label={`Bỏ lọc ${chip.label}`} onClick={chip.remove} className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary-light/60 px-3 py-1.5 text-xs text-primary">{chip.label}<X size={12} /></button>)}<button onClick={clear} className="px-2 text-xs font-semibold text-cta hover:underline">Xóa tất cả</button></div>}
          {loading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <BookCardSkeleton key={index} />)}</div> : result.error ? <ErrorState message={result.error} onRetry={() => setRevision(value => value + 1)} /> : result.books.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{result.books.map(book => <BookCard key={book.id} book={book} onAddToCart={() => add(book)} href={`/books/${book.id}`} />)}</div> : <EmptyState title="Không tìm thấy sách phù hợp" description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc để xem thêm sách." action={clear} actionLabel="Xóa bộ lọc" />}
          {!loading && !result.error && result.total > 0 && <div className="flex flex-col justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-xs text-ink-muted"><span>Hiển thị mỗi trang:</span><select aria-label="Số sách mỗi trang" value={filters.pageSize} onChange={event => update({ pageSize: event.target.value })} className="rounded-lg border border-border bg-white p-2 text-ink">{[16,32,48].map(size => <option key={size} value={size}>{size} sách</option>)}</select></label>
            <nav aria-label="Phân trang sách" className="flex flex-wrap items-center gap-1.5"><button aria-label="Trang trước" disabled={filters.page <= 1} onClick={() => update({ page: filters.page - 1 })} className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronLeft size={16} /></button>{pages.map((page, index) => <span key={page} className="contents">{index > 0 && page - pages[index-1] > 1 && <span className="px-1 text-ink-muted">…</span>}<button aria-label={`Trang ${page}`} aria-current={page === filters.page ? 'page' : undefined} onClick={() => update({ page })} className={`min-w-8 rounded-lg px-2 py-1.5 text-xs font-semibold ${page === filters.page ? 'bg-cta text-white' : 'border border-border text-ink-body hover:border-primary'}`}>{page}</button></span>)}<button aria-label="Trang sau" disabled={filters.page >= result.totalPages} onClick={() => update({ page: filters.page + 1 })} className="rounded-lg border border-border p-2 disabled:opacity-30"><ChevronRight size={16} /></button></nav>
          </div>}
        </section>
      </div>
    </div>
  </div>;
}
