import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ShoppingCart, Zap, Heart, Star, Truck, ShieldCheck, RotateCcw, Share2 } from 'lucide-react';
import {
  DetailSkeleton,
  ErrorState,
  QuantityInput,
  BookCard,
} from '../../components/ui';
import { bookApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useWishlist } from '../../context/WishlistContext';

/**
 * BookDetailPage Component — BookZone Figma Theme
 * Chi tiết tác phẩm, thêm vào giỏ, thông số sách và sách cùng thể loại
 */
const BookDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const isWishlisted = isInWishlist(book?.id || id);
  const [activeTab, setActiveTab] = useState('description');

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      try {
        setLoading(true);
        const data = await bookApi.getBookDetail(id);
        setBook(data);
        setError(null);

        // Fetch related books (same category)
        const catId = data?.category_id || data?.category?.id;
        if (catId) {
          try {
            const related = await bookApi.getBooks({
              category_id: catId,
              limit: 5,
            });
            setRelatedBooks((related?.data || []).filter(item => String(item.id) !== String(id)).slice(0, 4));
          } catch {
            setRelatedBooks([]);
          }
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        if (err.response?.status === 404) {
          setError('Không tìm thấy sách yêu cầu');
        } else {
          setError('Không thể tải thông tin tác phẩm');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/books/${id}`);
      return;
    }

    if (!book || quantity < 1) return;

    try {
      setAddingToCart(true);
      await addItem(book.id, quantity);
      showToast({ type: 'success', message: `Đã thêm ${quantity} cuốn sách vào giỏ!` });
      setQuantity(1);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Lỗi khi thêm vào giỏ hàng' });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          <ErrorState
            title={error || 'Tác phẩm không khả dụng'}
            message="Sách có thể đã ngừng kinh doanh hoặc đường dẫn không chính xác."
            onRetry={() => navigate('/books')}
            retryLabel="Quay lại Kho Sách"
          />
        </div>
      </div>
    );
  }

  const stockQuantity = book.stock_quantity ?? book.stockQuantity ?? book.stock ?? 10;
  const isOutOfStock = stockQuantity === 0;

  const price = book.price || 0;
  const originalPrice = book.original_price || book.originalPrice || (price > 0 ? Math.round(price * 1.25) : 0);
  const discountPercent = originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(p);

  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22320%22 height=%22460%22 viewBox=%220 0 320 460%22%3E%3Crect fill=%22%23f9fafb%22 width=%22320%22 height=%22460%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2216%22 fill=%22%23786b65%22%3EBìa Sách Phương Anh%3C/text%3E%3C/svg%3E';

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1280px] mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[13px] text-[#8d7168] mb-8 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-[#9b2f00] transition-colors">Trang chủ</Link>
          <ChevronRight size={14} />
          <Link to="/books" className="hover:text-[#9b2f00] transition-colors">Kho sách</Link>
          {book.category && (
            <>
              <ChevronRight size={14} />
              <Link to={`/books?categoryId=${book.category.id}`} className="hover:text-[#9b2f00] transition-colors">
                {book.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={14} />
          <span className="font-semibold text-[#121c2a] dark:text-gray-200 truncate max-w-xs">{book.title}</span>
        </div>

        {/* Main Product Section */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-10 border border-gray-100 dark:border-gray-800 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* Left: Book Cover (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[340px] relative rounded-2xl overflow-hidden bg-[#e6eeff] dark:bg-gray-800 shadow-[0_20px_40px_-15px_rgba(155,47,0,0.2)] aspect-[2/3]">
                <img
                  src={book.coverUrl || book.cover_url || book.image_url || book.imageUrl || book.image || fallbackImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                {/* Book spine shadow */}
                <div className="absolute top-0 bottom-0 left-0 w-3.5 bg-gradient-to-r from-black/30 via-black/10 to-transparent pointer-events-none" />

                {discountPercent > 0 && (
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider shadow-sm"
                    style={{ background: '#c2410c', color: '#ffece7' }}
                  >
                    -{discountPercent}%
                  </div>
                )}
              </div>

              {/* Action Buttons below image */}
              <div className="flex items-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => toggleWishlist(book)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    isWishlisted
                      ? 'border-[#c2410c] bg-[#ffece7] text-[#c2410c]'
                      : 'border-gray-200 dark:border-gray-700 text-[#59413a] hover:border-[#c2410c]'
                  }`}
                >
                  <Heart size={16} fill={isWishlisted ? '#c2410c' : 'none'} />
                  <span>{isWishlisted ? 'Đã lưu yêu thích' : 'Lưu vào yêu thích'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast({ type: 'success', message: 'Đã sao chép liên kết sách!' });
                  }}
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[#8d7168] hover:text-[#121c2a]"
                  title="Chia sẻ sách"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            {/* Right: Book Details (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                {/* Category & Badge */}
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  {book.category && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                      style={{ background: '#e6eeff', color: '#3b6756' }}
                    >
                      {book.category.name}
                    </span>
                  )}
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: isOutOfStock ? '#ffece7' : '#bdedd7',
                      color: isOutOfStock ? '#c2410c' : '#3b6756',
                    }}
                  >
                    {isOutOfStock ? 'Hết hàng' : `Còn hàng (${stockQuantity})`}
                  </span>
                </div>

                {/* Title */}
                <h1
                  className="text-2xl sm:text-3xl font-bold text-[#121c2a] dark:text-white leading-tight mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {book.title}
                </h1>

                {/* Author & Publisher Meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-[#8d7168] mb-4">
                  {book.authors && book.authors.length > 0 && (
                    <div>
                      Tác giả:{' '}
                      <span className="font-semibold text-[#121c2a] dark:text-gray-200">
                        {book.authors.map((a) => a.name || a.authorName).join(', ')}
                      </span>
                    </div>
                  )}
                  {book.publisher && (
                    <div>
                      Nhà xuất bản:{' '}
                      <span className="font-semibold text-[#121c2a] dark:text-gray-200">
                        {book.publisher.name}
                      </span>
                    </div>
                  )}
                  {book.publication_year && (
                    <div>
                      Năm phát hành:{' '}
                      <span className="font-semibold text-[#121c2a] dark:text-gray-200">
                        {book.publication_year}
                      </span>
                    </div>
                  )}
                </div>

                {Number(book.rating) > 0 && <div className="mb-6 flex items-center gap-2 text-sm text-ink-body"><Star size={15} className="fill-amber-400 text-amber-400" />{Number(book.rating).toFixed(1)} / 5</div>}

                {/* Price Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-border mb-6 flex items-baseline gap-3 flex-wrap">
                  <span
                    className="text-2xl sm:text-3xl font-bold tracking-tight"
                    style={{ color: '#9b2f00' }}
                  >
                    {formatPrice(price)}
                  </span>
                  {originalPrice > price && (
                    <span className="text-sm sm:text-base text-[#8d7168] line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-md text-xs font-bold"
                      style={{ background: '#bdedd7', color: '#3b6756' }}
                    >
                      Tiết kiệm {discountPercent}%
                    </span>
                  )}
                </div>

                {/* Quantity & CTA */}
                {!isOutOfStock ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#8d7168]">
                        Số lượng:
                      </span>
                      <QuantityInput
                        value={quantity}
                        onChange={setQuantity}
                        max={stockQuantity}
                        disabled={addingToCart}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                        style={{ background: '#c2410c', color: '#ffece7' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#9b2f00'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#c2410c'}
                      >
                        <ShoppingCart size={17} />
                        <span>{addingToCart ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={addingToCart}
                        className="py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-[#3b6756] text-[#3b6756] hover:bg-[#bdedd7]/30 active:scale-[0.98]"
                      >
                        <Zap size={17} />
                        <span>Mua ngay</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#ffece7] text-[#c2410c] font-semibold text-sm">
                    Tác phẩm hiện đang tạm hết hàng. Bạn có thể lưu vào mục yêu thích để nhận thông báo khi có hàng lại.
                  </div>
                )}
              </div>

              {/* Trust Features Strip */}
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center flex-shrink-0 text-[#3b6756]">
                    <Truck size={16} />
                  </div>
                  <span className="text-[#59413a] dark:text-gray-300 font-medium">Freeship đơn từ 250k</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center flex-shrink-0 text-[#3b6756]">
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-[#59413a] dark:text-gray-300 font-medium">100% bản quyền NXB</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center flex-shrink-0 text-[#3b6756]">
                    <RotateCcw size={16} />
                  </div>
                  <span className="text-[#59413a] dark:text-gray-300 font-medium">Đổi trả trong 7 ngày</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Book Content Tabs (Giới thiệu tác phẩm, Thông số) */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm mb-12">
          {/* Tabs header */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 gap-6 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('description')}
              className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 ${
                activeTab === 'description'
                  ? 'border-[#9b2f00] text-[#9b2f00]'
                  : 'border-transparent text-[#8d7168] hover:text-[#121c2a]'
              }`}
            >
              Giới thiệu tác phẩm
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 font-bold text-sm tracking-wide transition-all border-b-2 ${
                activeTab === 'specs'
                  ? 'border-[#9b2f00] text-[#9b2f00]'
                  : 'border-transparent text-[#8d7168] hover:text-[#121c2a]'
              }`}
            >
              Thông số chi tiết
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'description' ? (
            <div className="text-sm leading-relaxed text-[#59413a] dark:text-gray-300 space-y-4 whitespace-pre-wrap">
              {book.description || (
                <p>
                  Một tác phẩm văn học xuất sắc mang đến cho độc giả những trải nghiệm sâu sắc về cảm xúc, nhân sinh và thế giới quan rộng lớn. Được tuyển chọn kỹ càng bởi Phương Anh.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[#8d7168]">Mã sản phẩm / ISBN:</span>
                <span className="font-semibold text-[#121c2a] dark:text-gray-200">{book.isbn || 'Đang cập nhật'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[#8d7168]">Số trang:</span>
                <span className="font-semibold text-[#121c2a] dark:text-gray-200">{book.page_count || book.pages || 'Đang cập nhật'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[#8d7168]">Hình thức bìa:</span>
                <span className="font-semibold text-[#121c2a] dark:text-gray-200">{book.cover_type || 'Đang cập nhật'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[#8d7168]">Ngôn ngữ:</span>
                <span className="font-semibold text-[#121c2a] dark:text-gray-200">Tiếng Việt</span>
              </div>
            </div>
          )}
        </div>

        {/* Related Books Section */}
        {relatedBooks.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-[#3b6756] mb-1">CÙNG CHỦ ĐỀ</p>
                <h2
                  className="text-xl sm:text-2xl font-bold text-[#121c2a] dark:text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Tác phẩm tương tự bạn có thể thích
                </h2>
              </div>
              <Link
                to={`/books?categoryId=${book.category?.id || ''}`}
                className="text-xs font-semibold text-[#9b2f00] hover:underline"
              >
                Xem tất cả →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedBooks.map((relBook) => (
                <BookCard
                  key={relBook.id}
                  book={relBook}
                  href={`/books/${relBook.id}`}
                  onAddToCart={() => navigate(`/books/${relBook.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BookDetailPage;
