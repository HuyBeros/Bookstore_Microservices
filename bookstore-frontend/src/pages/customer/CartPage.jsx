import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { QuantityInput, ConfirmModal, Skeleton, ErrorState } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/**
 * CartPage Component — BookZone Figma Theme
 * Quản lý giỏ hàng, cập nhật số lượng và tính toán vận chuyển
 */
const CartPage = () => {
  const navigate = useNavigate();
  const { items, loading, error, fetchCart, updateQuantity, removeItem, getTotal } = useCart();
  const { showToast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const total = getTotal?.() || 0;
  const isFreeShipping = total >= 250000;
  const shippingFee = isFreeShipping ? 0 : (items.length > 0 ? 30000 : 0);
  const grandTotal = total + shippingFee;

  const handleQuantityChange = async (bookId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      setUpdatingId(bookId);
      await updateQuantity(bookId, newQuantity);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Lỗi khi cập nhật số lượng' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (bookId) => {
    try {
      await removeItem(bookId);
      showToast({ type: 'success', message: 'Đã xóa tác phẩm khỏi giỏ hàng' });
      setDeleteConfirm(null);
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'Lỗi khi xóa khỏi giỏ hàng' });
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1280px] mx-auto space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} type="rect" height="120px" className="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={() => fetchCart().catch(() => {})} />;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center bg-white rounded-2xl p-8 sm:p-12 border border-gray-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#ffece7] text-[#9b2f00] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={28} strokeWidth={1.75} />
          </div>
          <h2
            className="text-2xl font-bold text-[#121c2a] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Giỏ hàng của bạn đang trống
          </h2>
          <p className="text-sm text-[#59413a] mb-6">
            Hàng ngàn đầu sách hấp dẫn đang chờ bạn khám phá tại Phương Anh.
          </p>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm shadow-xs active:scale-95 transition-all no-underline"
            style={{ background: '#c2410c', color: '#ffece7' }}
          >
            Khám phá Kho Sách ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 pb-24 md:pb-12">
      <div className="max-w-[1280px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[13px] text-[#786b65] mb-2">
            <Link to="/" className="hover:text-[#9b2f00]">Trang chủ</Link>
            <span>/</span>
            <span className="font-semibold text-[#121c2a]">Giỏ hàng</span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[#121c2a]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Giỏ Hàng Của Bạn
          </h1>
          <p className="text-sm text-[#786b65] mt-1">
            Bạn có <span className="font-bold text-[#9b2f00]">{items.length}</span> sản phẩm trong giỏ hàng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Cart Items List (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs divide-y divide-gray-100 overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.book_id}
                  className="p-4 sm:p-6 flex gap-4 hover:bg-gray-50/80 transition-colors"
                >
                  {/* Product Image with Book Spine Effect */}
                  <Link
                    to={`/books/${item.book_id}`}
                    className="flex-shrink-0 w-20 h-28 sm:w-24 sm:h-34 rounded-xl overflow-hidden bg-[#f7f2eb] relative shadow-2xs border border-border/40 group block"
                  >
                    <img
                      src={
                        item.cover_url ||
                        item.coverUrl ||
                        item.image_url ||
                        item.imageUrl ||
                        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=300';
                      }}
                    />
                    <div className="absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <Link
                        to={`/books/${item.book_id}`}
                        className="text-sm sm:text-base font-semibold text-[#121c2a] dark:text-white hover:text-[#9b2f00] line-clamp-2 mb-1 transition-colors"
                      >
                        {item.title}
                      </Link>
                      {item.author && (
                        <p className="text-xs text-[#8d7168] mb-2">
                          Tác giả: {item.author}
                        </p>
                      )}
                    </div>

                    {/* Price & Quantity Row */}
                    <div className="flex items-end justify-between gap-3 pt-2">
                      <div className="space-y-1.5">
                        <p className="text-xs text-[#8d7168]">
                          Đơn giá: <span className="font-semibold text-[#121c2a] dark:text-gray-300">{formatPrice(item.price)}</span>
                        </p>
                        <QuantityInput
                          value={item.quantity}
                          onChange={(q) => handleQuantityChange(item.book_id, q)}
                          max={item.stock_quantity || 999}
                          disabled={updatingId === item.book_id}
                        />
                      </div>

                      {/* Total & Delete Button */}
                      <div className="text-right space-y-2">
                        <p className="text-base sm:text-lg font-bold text-[#9b2f00]">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(item.book_id)}
                          className="text-xs text-[#c2410c] hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <Trash2 size={14} />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping Link */}
            <div className="pt-2">
              <Link
                to="/books"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#9b2f00] hover:underline"
              >
                <ArrowLeft size={16} />
                <span>Tiếp tục tìm kiếm sách</span>
              </Link>
            </div>
          </div>

          {/* Order Summary (4 Cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-sm sticky top-28 space-y-5">
              <h2
                className="text-lg font-bold text-[#121c2a] dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-[#8d7168]">Tổng tiền sách:</span>
                  <span className="font-semibold text-[#121c2a] dark:text-gray-200">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#8d7168]">Phí vận chuyển:</span>
                  <span className="font-semibold text-[#121c2a] dark:text-gray-200">
                    {isFreeShipping ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#bdedd7] text-[#3b6756]">
                        Miễn phí (Freeship)
                      </span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>

                {!isFreeShipping && (
                  <div className="p-3 rounded-xl bg-amber-50 text-[#9b2f00] text-xs leading-relaxed border border-amber-200/60">
                    <span>Mua thêm <strong className="font-bold">{formatPrice(250000 - total)}</strong> để được Miễn phí giao hàng toàn quốc.</span>
                  </div>
                )}
              </div>

              {/* Total Row */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-baseline">
                <span className="font-bold text-sm text-[#121c2a] dark:text-white">Tổng thanh toán:</span>
                <span className="text-xl sm:text-2xl font-bold text-[#9b2f00]">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-[0.98]"
                style={{ background: '#c2410c', color: '#ffece7' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#9b2f00'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#c2410c'}
              >
                Tiến hành thanh toán
              </button>

              <div className="pt-2 text-center text-[11px] text-[#8d7168] flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-[#3b6756]" />
                <span>Bảo mật thanh toán 100% & Giao sách chu đáo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        title="Xóa khỏi giỏ hàng?"
        message="Bạn có chắc chắn muốn bỏ tác phẩm này khỏi giỏ hàng không?"
        confirmLabel="Xóa tác phẩm"
        cancelLabel="Giữ lại"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};

export default CartPage;
