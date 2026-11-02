import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookCard, BookCardSkeleton, EmptyState, ErrorState } from '../../components/ui';
import { bookApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function BestsellersPage() {
  const [result, setResult] = useState({ loading: true, books: [], error: null });
  const [revision, setRevision] = useState(0);
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    const controller = new AbortController();
    bookApi.getBestsellers({ limit: 24 }, { signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setResult({ loading: false, books: response.data, error: null }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ loading: false, books: [], error: 'Chưa tải được sách bán chạy.' }); });
    return () => controller.abort();
  }, [revision]);
  const add = async book => {
    if (!isAuthenticated) { navigate(`/login?redirect=/books/${book.id}`); return; }
    try { await addToCart(book, 1); showToast({ type: 'success', message: 'Đã thêm sách vào giỏ hàng.' }); }
    catch (error) { showToast({ type: 'error', message: error.message }); }
  };
  return <div className="mx-auto max-w-[1280px] space-y-8 px-4 py-10 sm:px-6 lg:px-8">
    <Link to="/" className="text-xs text-ink-muted hover:text-primary">Trang chủ</Link>
    <header><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Những lựa chọn của độc giả</p>
      <h1 className="font-serif text-3xl sm:text-4xl">Sách bán chạy</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">Xếp theo số cuốn đã bán từ các đơn đã giao và thanh toán tại Phương Anh. Không tính đơn hủy hoặc trả hàng.</p>
    </header>
    {result.loading ? <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{[0,1,2,3].map(index => <BookCardSkeleton key={index} />)}</div>
      : result.error ? <ErrorState message={result.error} onRetry={() => { setResult(previous => ({ ...previous, loading: true })); setRevision(value => value + 1); }} />
      : result.books.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-4">{result.books.map((book, index) => <BookCard key={book.id} book={book} rank={index + 1} onAddToCart={() => add(book)} />)}</div>
      : <EmptyState title="Chưa có dữ liệu sách bán chạy" description="Danh sách sẽ cập nhật khi cửa hàng có đơn đã giao và thanh toán." action={() => navigate('/books')} actionLabel="Khám phá kho sách" showQuote={false} />}
  </div>;
}
