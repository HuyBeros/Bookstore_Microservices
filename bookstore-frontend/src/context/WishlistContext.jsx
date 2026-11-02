import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

/**
 * Chuẩn hóa đối tượng sách lưu vào danh sách yêu thích
 */
const normalizeWishlistBook = (book) => {
  if (!book) return null;
  const id = Number(book.id ?? book.book_id ?? book.bookId);
  const price = Number(book.price ?? 0);
  const originalPrice = Number(book.originalPrice ?? book.original_price ?? price);
  const coverUrl = book.coverUrl ?? book.cover_url ?? book.imageUrl ?? book.image_url ?? book.image ?? '';

  return {
    id,
    book_id: id,
    title: book.title ?? book.name ?? 'Tác phẩm tuyển chọn',
    price,
    originalPrice,
    original_price: originalPrice,
    coverUrl,
    cover_url: coverUrl,
    image_url: coverUrl,
    authors: Array.isArray(book.authors) ? book.authors : (book.author ? [{ name: book.author }] : []),
    author: typeof book.author === 'string' ? book.author : (book.authors?.[0]?.name ?? ''),
    category: book.category,
    category_name: book.category_name ?? book.category?.name ?? book.genre ?? 'Sách chọn lọc',
    stockQuantity: Number(book.stockQuantity ?? book.stock_quantity ?? book.stock ?? 10),
    stock_quantity: Number(book.stockQuantity ?? book.stock_quantity ?? book.stock ?? 10),
    soldCount: Number(book.soldCount ?? book.sold_count ?? 0),
    rating: book.rating ?? 5.0,
    addedAt: Date.now()
  };
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const userKey = user?.id || user?.userId || 'guest';
  const storageKey = `phuonganh_wishlist_${userKey}`;

  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
      // Fallback kiểm tra guest storage nếu người dùng mới đăng nhập
      const guestStored = localStorage.getItem('phuonganh_wishlist_guest');
      if (guestStored && userKey !== 'guest') {
        const guestParsed = JSON.parse(guestStored);
        if (Array.isArray(guestParsed) && guestParsed.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(guestParsed));
          return guestParsed;
        }
      }
    } catch {
      // Bỏ qua lỗi parse
    }
    return [];
  });

  // Khi user thay đổi, nạp lại danh sách yêu thích tương ứng
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
          return;
        }
      }
      setWishlist([]);
    } catch {
      setWishlist([]);
    }
  }, [storageKey]);

  // Lưu vào localStorage khi wishlist thay đổi
  const saveWishlist = useCallback((items) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (e) {
      console.error('Không thể lưu wishlist vào localStorage', e);
    }
  }, [storageKey]);

  /**
   * Kiểm tra một cuốn sách có nằm trong danh sách yêu thích không
   */
  const isInWishlist = useCallback((bookId) => {
    if (!bookId) return false;
    const targetId = Number(bookId);
    return wishlist.some(item => Number(item.id) === targetId);
  }, [wishlist]);

  /**
   * Thêm sách vào danh sách yêu thích
   */
  const addToWishlist = useCallback((book) => {
    if (!book) return;
    const normalized = normalizeWishlistBook(book);
    if (!normalized || !normalized.id) return;

    setWishlist(prev => {
      if (prev.some(item => Number(item.id) === normalized.id)) {
        return prev;
      }
      const updated = [normalized, ...prev];
      saveWishlist(updated);
      return updated;
    });

    showToast({
      type: 'success',
      message: `Đã thêm "${book.title || 'Sách'}" vào danh sách yêu thích`
    });
  }, [saveWishlist, showToast]);

  /**
   * Xóa sách khỏi danh sách yêu thích
   */
  const removeFromWishlist = useCallback((bookId) => {
    if (!bookId) return;
    const targetId = Number(bookId);

    setWishlist(prev => {
      const bookToRemove = prev.find(item => Number(item.id) === targetId);
      const updated = prev.filter(item => Number(item.id) !== targetId);
      saveWishlist(updated);

      if (bookToRemove) {
        showToast({
          type: 'info',
          message: `Đã xóa "${bookToRemove.title}" khỏi danh sách yêu thích`
        });
      }
      return updated;
    });
  }, [saveWishlist, showToast]);

  /**
   * Toggle yêu thích: nếu có thì xóa, nếu chưa có thì thêm
   */
  const toggleWishlist = useCallback((book) => {
    if (!book) return;
    const id = Number(book.id ?? book.book_id ?? book.bookId);
    if (!id) return;

    if (isInWishlist(id)) {
      removeFromWishlist(id);
    } else {
      addToWishlist(book);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  /**
   * Xóa toàn bộ danh sách yêu thích
   */
  const clearWishlist = useCallback(() => {
    setWishlist([]);
    saveWishlist([]);
    showToast({
      type: 'info',
      message: 'Đã làm trống danh sách sách yêu thích'
    });
  }, [saveWishlist, showToast]);

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist phải được sử dụng bên trong WishlistProvider');
  }
  return context;
};
