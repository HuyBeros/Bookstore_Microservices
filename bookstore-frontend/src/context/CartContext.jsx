import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as cartApi from '../api/services/cartApi';
import * as bookApi from '../api/services/bookApi';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/**
 * Bổ sung thông tin bìa sách (cover_url) từ catalog-service nếu giỏ hàng bị thiếu
 */
const enrichCartItems = async (rawItems = []) => {
  if (!rawItems.length) return rawItems;

  const missingCoverIds = rawItems
    .filter((item) => !item.cover_url && !item.image_url)
    .map((item) => item.book_id)
    .filter(Boolean);

  if (missingCoverIds.length === 0) return rawItems;

  try {
    const bookDetails = await bookApi.getBooksByIds(missingCoverIds);
    const bookMap = new Map(bookDetails.map((b) => [String(b.id), b]));

    return rawItems.map((item) => {
      const b = bookMap.get(String(item.book_id));
      if (!b) return item;

      const cover = b.cover_url || b.coverUrl || b.imageUrl || b.image_url || b.image;
      return {
        ...item,
        cover_url: item.cover_url || cover,
        image_url: item.image_url || cover,
        coverUrl: item.coverUrl || cover,
        imageUrl: item.imageUrl || cover,
        author: item.author || (Array.isArray(b.authors) ? b.authors.map((a) => a.name).join(', ') : b.author),
        stock_quantity: b.stock_quantity ?? item.stock_quantity,
      };
    });
  } catch {
    return rawItems;
  }
};

export const CartProvider = ({ children }) => {
  const { user, token, loading: authLoading } = useAuth();
  const [cartSnapshot, setCart] = useState({ token: null, items: [] });
  const cart = cartSnapshot.token === token ? cartSnapshot : { items: [] };
  const [failure, setError] = useState(null);
  const error = failure?.token === token ? failure.value : null;
  const loading = Boolean(token && user && (authLoading || (!error && cartSnapshot.token !== token)));
  const session = useRef(token);

  useEffect(() => {
    session.current = token;
  }, [token]);

  const fetchCart = useCallback(async () => {
    if (!token || !user || authLoading) return;
    const activeToken = token;
    try {
      const result = await cartApi.getCart();
      const enrichedItems = await enrichCartItems(result.items || []);
      const enrichedResult = { ...result, items: enrichedItems };

      if (session.current === activeToken) {
        setCart({ ...enrichedResult, token: activeToken });
        setError(null);
      }
      return enrichedResult;
    } catch (err) {
      if (session.current === activeToken) setError({ token: activeToken, value: err });
      throw err;
    }
  }, [token, user, authLoading]);

  useEffect(() => {
    fetchCart().catch(() => {});
  }, [fetchCart]);

  const mutate = async (call) => {
    if (!token) throw new Error('Vui lòng đăng nhập để sử dụng giỏ hàng');
    const activeToken = token;
    const result = await call();
    const enrichedItems = await enrichCartItems(result.items || []);
    const enrichedResult = { ...result, items: enrichedItems };

    if (session.current === activeToken) {
      setCart({ ...enrichedResult, token: activeToken });
      setError(null);
    }
    return enrichedResult;
  };

  const addToCart = (book, quantity = 1) =>
    mutate(async () => {
      const bookId = typeof book === 'object' ? book.id ?? book.book_id : book;
      const res = await cartApi.addToCart(bookId, quantity);
      return res;
    });

  const updateQuantity = (bookId, quantity) => mutate(() => cartApi.updateCartItem(bookId, quantity));
  const removeItem = (bookId) => mutate(() => cartApi.removeFromCart(bookId));
  const resetCart = () => setCart({ token, items: [] });
  const clearCart = async () => {
    await cartApi.clearCart();
    resetCart();
  };

  const items = cart.items ?? [];
  const getTotal = () =>
    Number(cart.totalAmount ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0));

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        loading,
        error,
        fetchCart,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        getTotal,
        addToCart,
        addItem: addToCart,
        updateQuantity,
        updateCart: updateQuantity,
        removeItem,
        removeFromCart: removeItem,
        clearCart,
        resetCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được dùng bên trong CartProvider');
  return context;
};
