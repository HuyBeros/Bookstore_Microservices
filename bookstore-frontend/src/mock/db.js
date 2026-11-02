import { initialCategories } from './data/categories';
import { initialAuthors } from './data/authors';
import { initialPublishers } from './data/publishers';
import { initialBooks } from './data/books';
import { initialUsers } from './data/users';
import { initialOrders } from './data/orders';
import { initialInventoryTransactions } from './data/inventory';

const STORAGE_KEY = 'mock_db_v1';

/**
 * Sinh dữ liệu ban đầu chuẩn
 */
export const createInitialDb = () => {
  // Giỏ hàng của customer1 có sẵn 3 sản phẩm
  const defaultCarts = {
    4: [
      { id: 1, book_id: 1, title: 'Nhà Giả Kim', unit_price: 79000, quantity: 2, image: initialBooks[0].image },
      { id: 2, book_id: 2, title: 'Đắc Nhân Tâm', unit_price: 86000, quantity: 1, image: initialBooks[1].image },
      // Sách sắp hết hàng (tồn kho = 3)
      { id: 3, book_id: 6, title: 'Cha Giàu Cha Nghèo', unit_price: 125000, quantity: 2, image: initialBooks[5].image },
    ],
  };

  return {
    categories: initialCategories,
    authors: initialAuthors,
    publishers: initialPublishers,
    books: initialBooks,
    users: initialUsers,
    orders: initialOrders,
    inventory: initialInventoryTransactions,
    carts: defaultCarts,
  };
};

/**
 * Lấy toàn bộ database từ localStorage, nếu chưa có thì khởi tạo
 */
export const getDb = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const init = createInitialDb();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
      return init;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Lỗi đọc mock_db_v1 từ localStorage, tái tạo dữ liệu:', err);
    const init = createInitialDb();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }
};

/**
 * Ghi lại database vào localStorage
 */
export const saveDb = (db) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Lỗi lưu mock_db_v1:', err);
  }
};

/**
 * Reset toàn bộ dữ liệu mock về trạng thái ban đầu
 */
export const resetMockDb = () => {
  localStorage.removeItem(STORAGE_KEY);
  const freshDb = createInitialDb();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(freshDb));
  window.dispatchEvent(new Event('mockDbReset'));
  return freshDb;
};

