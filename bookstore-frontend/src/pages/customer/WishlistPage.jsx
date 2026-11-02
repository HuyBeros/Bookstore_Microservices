import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingBag, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { BookCard } from '../../components/ui';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function WishlistPage() {
  const { wishlist, wishlistCount, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isAuthenticated } = useAuth();
  const [addingAll, setAddingAll] = useState(false);

  const handleAddAllToCart = async () => {
    if (!isAuthenticated) {
      showToast({
        type: 'warning',
        message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng'
      });
      return;
    }

    if (wishlist.length === 0) return;

    setAddingAll(true);
    let successCount = 0;
    try {
      for (const item of wishlist) {
        const stock = item.stockQuantity ?? item.stock_quantity ?? item.stock ?? 1;
        if (stock > 0) {
          try {
            await addToCart(item, 1);
            successCount++;
          } catch {
            // bỏ qua lỗi từng item
          }
        }
      }

      if (successCount > 0) {
        showToast({
          type: 'success',
          message: `Đã thêm ${successCount} cuốn sách vào giỏ hàng thành công!`
        });
      } else {
        showToast({
          type: 'warning',
          message: 'Các tác phẩm trong danh sách hiện đang tạm hết hàng'
        });
      }
    } finally {
      setAddingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbfa] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#786b65] mb-6">
          <Link to="/" className="hover:text-[#c2410c] transition-colors no-underline">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-[#121c2a] font-medium">Sách yêu thích</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b border-[#e5e0d8]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffece7] text-[#c2410c] text-[11px] font-bold tracking-wider uppercase mb-2">
              <Sparkles size={13} />
              <span>BỘ SƯU TẬP CỦA BẠN</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#121c2a] tracking-tight">
              Sách Yêu Thích Của Bạn
            </h1>
            <p className="mt-1 text-sm text-[#59413a]">
              {wishlistCount > 0
                ? `Bạn đang lưu giữ ${wishlistCount} tác phẩm trong danh sách yêu thích.`
                : 'Lưu giữ những tác phẩm tâm đắc để thưởng thức và đặt mua bất cứ lúc nào.'}
            </p>
          </div>

          {/* Action buttons when items exist */}
          {wishlistCount > 0 && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={clearWishlist}
                className="h-10 px-4 flex items-center gap-2 rounded-xl text-xs font-semibold text-[#786b65] hover:text-[#c2410c] hover:bg-white border border-[#e5e0d8] transition-all shadow-xs"
              >
                <Trash2 size={15} />
                <span>Xóa tất cả</span>
              </button>

              <button
                type="button"
                onClick={handleAddAllToCart}
                disabled={addingAll}
                className="h-10 px-5 flex items-center gap-2 rounded-xl text-xs font-semibold text-white bg-[#c2410c] hover:bg-[#9b2f00] disabled:opacity-60 transition-all shadow-sm shadow-[#c2410c]/20"
              >
                <ShoppingBag size={15} />
                <span>{addingAll ? 'Đang thêm...' : 'Thêm tất cả vào giỏ'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Wishlist Content */}
        {wishlistCount === 0 ? (
          /* Empty State */
          <div className="max-w-xl mx-auto py-16 px-6 text-center bg-white rounded-3xl border border-[#e5e0d8] shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-[#ffece7] text-[#c2410c] flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Heart size={32} strokeWidth={1.5} className="fill-[#c2410c]/20" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#121c2a] mb-2">
              Danh sách yêu thích đang trống
            </h2>
            <p className="text-sm text-[#59413a] leading-relaxed mb-6">
              Bạn chưa thêm tựa sách nào vào danh sách yêu thích. Hãy dạo quanh kho sách và bấm biểu tượng trái tim để lưu lại những cuốn sách bạn muốn đọc nhé!
            </p>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#c2410c] text-white text-sm font-semibold hover:bg-[#9b2f00] transition-colors shadow-sm shadow-[#c2410c]/20 no-underline"
            >
              <BookOpen size={16} />
              <span>Khám phá kho sách ngay</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          /* Books Grid */
          <div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 sm:gap-6">
              {wishlist.map((book) => (
                <div key={book.id} className="relative">
                  <BookCard
                    book={book}
                    onAddToCart={(b) => {
                      if (!isAuthenticated) {
                        showToast({
                          type: 'warning',
                          message: 'Vui lòng đăng nhập để thêm vào giỏ hàng'
                        });
                        return;
                      }
                      addToCart(b, 1)
                        .then(() => {
                          showToast({
                            type: 'success',
                            message: `Đã thêm "${b.title}" vào giỏ hàng`
                          });
                        })
                        .catch((err) => {
                          showToast({
                            type: 'error',
                            message: err.message || 'Không thể thêm vào giỏ hàng'
                          });
                        });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
