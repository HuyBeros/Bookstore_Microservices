import { getDb, saveDb } from './db';
import { delay, checkMockFlags, paginate, search, ApiError, uid, makeCover } from './helpers';
import { calculateStats } from './data/stats';

/**
 * Lấy user hiện tại từ token / localStorage
 */
const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const mockApi = {
  // ========== AUTH ==========
  async login(username, password) {
    await delay();
    checkMockFlags();
    const db = getDb();
    const user = db.users.find(
      (u) => u.username === username || u.email === username
    );

    if (!user || (user.password && user.password !== password)) {
      throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (user.status === 'LOCKED') {
      throw new ApiError(
        403,
        'Tài khoản đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
      );
    }

    const token = `mock-jwt-token-${user.role.toLowerCase()}-${user.id}-${Date.now()}`;
    const userProfile = {
      id: user.id,
      user_id: user.id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.status,
    };

    return { token, user: userProfile, data: { token, user: userProfile } };
  },

  async register(data) {
    await delay();
    checkMockFlags();
    const db = getDb();

    if (db.users.some((u) => u.username === data.username)) {
      throw new ApiError(400, 'Tên đăng nhập đã được sử dụng');
    }
    if (db.users.some((u) => u.email === data.email)) {
      throw new ApiError(400, 'Địa chỉ email đã được đăng ký');
    }

    const newUser = {
      id: uid(),
      user_id: uid(),
      username: data.username,
      password: data.password,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || '',
      address: data.address || '',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDb(db);

    return { message: 'Đăng ký tài khoản thành công', user: newUser, data: newUser };
  },

  async getMe() {
    await delay(150, 300);
    const user = getCurrentUser();
    if (!user) throw new ApiError(401, 'Chưa đăng nhập');
    return { data: user, ...user };
  },

  async updateProfile(data) {
    await delay();
    const currentUser = getCurrentUser();
    if (!currentUser) throw new ApiError(401, 'Chưa đăng nhập');

    const db = getDb();
    const userIndex = db.users.findIndex((u) => u.id === currentUser.id);
    if (userIndex === -1) throw new ApiError(404, 'Không tìm thấy tài khoản');

    db.users[userIndex] = {
      ...db.users[userIndex],
      full_name: data.fullName || data.full_name || db.users[userIndex].full_name,
      email: data.email || db.users[userIndex].email,
      phone: data.phone || db.users[userIndex].phone,
      address: data.address || db.users[userIndex].address,
    };
    saveDb(db);

    const updated = db.users[userIndex];
    localStorage.setItem('user', JSON.stringify(updated));
    return { message: 'Cập nhật thành công', data: updated, user: updated };
  },

  async changePassword(data) {
    await delay();
    const currentUser = getCurrentUser();
    if (!currentUser) throw new ApiError(401, 'Chưa đăng nhập');

    const db = getDb();
    const user = db.users.find((u) => u.id === currentUser.id);
    if (!user || user.password !== data.currentPassword) {
      throw new ApiError(400, 'Mật khẩu hiện tại không chính xác');
    }

    user.password = data.newPassword;
    saveDb(db);
    return { message: 'Đổi mật khẩu thành công', data: { success: true } };
  },

  // ========== BOOKS ==========
  async getBooks(params = {}) {
    await delay();
    if (checkMockFlags()) return { data: [], items: [], total: 0, page: 1, limit: 12, totalPages: 1 };

    const db = getDb();
    let books = [...db.books];

    // Search theo từ khóa
    if (params.q) {
      books = search(books, params.q, ['title', 'description', 'authors']);
    }

    // Lọc category
    if (params.category || params.category_id) {
      const catId = Number(params.category || params.category_id);
      books = books.filter((b) => b.category_id === catId || b.category?.id === catId);
    }

    // Lọc author
    if (params.author || params.author_id) {
      const aId = Number(params.author || params.author_id);
      books = books.filter((b) => (b.authors || []).some((a) => a.id === aId || a.author_id === aId));
    }

    // Lọc publisher
    if (params.publisher || params.publisher_id) {
      const pId = Number(params.publisher || params.publisher_id);
      books = books.filter((b) => b.publisher_id === pId || b.publisher?.id === pId);
    }

    // Lọc khoảng giá
    if (params.minPrice) books = books.filter((b) => b.price >= Number(params.minPrice));
    if (params.maxPrice) books = books.filter((b) => b.price <= Number(params.maxPrice));

    // Lọc stock status (dành cho Admin)
    if (params.stockStatus) {
      if (params.stockStatus === 'in_stock') books = books.filter((b) => b.stock > 5);
      if (params.stockStatus === 'low_stock') books = books.filter((b) => b.stock > 0 && b.stock <= 5);
      if (params.stockStatus === 'out_of_stock') books = books.filter((b) => b.stock === 0);
    }

    // Sắp xếp
    if (params.sort === 'newest') {
      books.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (params.sort === 'price_asc') {
      books.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'price_desc') {
      books.sort((a, b) => b.price - a.price);
    } else if (params.sort === 'popular') {
      books.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    }

    // Bổ sung object category & publisher nếu chưa có
    books = books.map((b) => {
      const cat = db.categories.find((c) => c.id === b.category_id);
      const pub = db.publishers.find((p) => p.id === b.publisher_id);
      return {
        ...b,
        category: cat ? { id: cat.id, name: cat.name } : b.category,
        publisher: pub ? { id: pub.id, name: pub.name } : b.publisher,
      };
    });

    return paginate(books, params.page || 1, params.limit || 12);
  },

  async getBookDetail(id) {
    await delay();
    checkMockFlags();
    const db = getDb();
    const book = db.books.find((b) => String(b.id) === String(id) || String(b.book_id) === String(id));
    if (!book) throw new ApiError(404, 'Không tìm thấy thông tin cuốn sách này');

    const cat = db.categories.find((c) => c.id === book.category_id);
    const pub = db.publishers.find((p) => p.id === book.publisher_id);

    const fullBook = {
      ...book,
      category: cat || book.category,
      publisher: pub || book.publisher,
    };
    return { data: fullBook, ...fullBook };
  },

  async createBook(data) {
    await delay();
    const db = getDb();
    const newId = uid();
    const coverUrl = data.image || makeCover(data.title, 'Phương Anh Bookstore', newId);

    const newBook = {
      id: newId,
      book_id: newId,
      title: data.title,
      price: Number(data.price),
      originalPrice: Number(data.price) * 1.2,
      stock: Number(data.stock || data.stock_quantity || 10),
      stock_quantity: Number(data.stock || data.stock_quantity || 10),
      description: data.description || '',
      category_id: Number(data.category_id || data.categoryId || 1),
      publisher_id: Number(data.publisher_id || data.publisherId || 1),
      authors: Array.isArray(data.authors) ? data.authors : [{ id: 1, name: 'Tác giả' }],
      image: coverUrl,
      image_url: coverUrl,
      coverUrl,
      created_at: new Date().toISOString(),
    };

    db.books.unshift(newBook);
    saveDb(db);
    return { message: 'Thêm sách thành công', data: newBook };
  },

  async updateBook(id, data) {
    await delay();
    const db = getDb();
    const index = db.books.findIndex((b) => String(b.id) === String(id));
    if (index === -1) throw new ApiError(404, 'Không tìm thấy sách để cập nhật');

    db.books[index] = {
      ...db.books[index],
      ...data,
      price: data.price !== undefined ? Number(data.price) : db.books[index].price,
      stock: data.stock !== undefined ? Number(data.stock) : db.books[index].stock,
    };
    saveDb(db);
    return { message: 'Cập nhật sách thành công', data: db.books[index] };
  },

  async deleteBook(id) {
    await delay();
    const db = getDb();
    // Kiểm tra ràng buộc đơn hàng
    const inOrders = db.orders.some((o) => (o.items || []).some((item) => String(item.book_id) === String(id)));
    if (inOrders) {
      throw new ApiError(400, 'Không thể xóa sách vì cuốn sách này đã có trong lịch sử đơn hàng');
    }

    db.books = db.books.filter((b) => String(b.id) !== String(id));
    saveDb(db);
    return { message: 'Xóa sách thành công', data: { success: true } };
  },

  // ========== CATEGORIES ==========
  async getCategories() {
    await delay(200, 400);
    if (checkMockFlags()) return { data: [] };
    const db = getDb();
    return { data: db.categories, items: db.categories };
  },

  async createCategory(data) {
    await delay();
    const db = getDb();
    if (db.categories.some((c) => c.name.toLowerCase() === (data.name || '').toLowerCase())) {
      throw new ApiError(400, 'Tên danh mục đã tồn tại');
    }
    const newCat = { id: uid(), name: data.name, description: data.description || '', icon: 'BookOpen' };
    db.categories.push(newCat);
    saveDb(db);
    return { message: 'Thêm danh mục thành công', data: newCat };
  },

  async updateCategory(id, data) {
    await delay();
    const db = getDb();
    const idx = db.categories.findIndex((c) => String(c.id) === String(id));
    if (idx === -1) throw new ApiError(404, 'Không tìm thấy danh mục');
    db.categories[idx] = { ...db.categories[idx], ...data };
    saveDb(db);
    return { message: 'Cập nhật danh mục thành công', data: db.categories[idx] };
  },

  async deleteCategory(id) {
    await delay();
    const db = getDb();
    const hasBooks = db.books.some((b) => String(b.category_id) === String(id));
    if (hasBooks) {
      throw new ApiError(400, 'Không thể xóa danh mục vì đang có sản phẩm thuộc danh mục này');
    }
    db.categories = db.categories.filter((c) => String(c.id) !== String(id));
    saveDb(db);
    return { message: 'Xóa danh mục thành công', data: { success: true } };
  },

  // ========== AUTHORS & PUBLISHERS ==========
  async getAuthors() {
    await delay(150, 300);
    const db = getDb();
    return { data: db.authors, items: db.authors };
  },
  async createAuthor(data) {
    await delay();
    const db = getDb();
    const newA = { id: uid(), name: data.name, bio: data.bio || '' };
    db.authors.push(newA);
    saveDb(db);
    return { data: newA };
  },
  async updateAuthor(id, data) {
    await delay();
    const db = getDb();
    const idx = db.authors.findIndex((a) => String(a.id) === String(id));
    if (idx !== -1) db.authors[idx] = { ...db.authors[idx], ...data };
    saveDb(db);
    return { data: db.authors[idx] };
  },
  async deleteAuthor(id) {
    await delay();
    const db = getDb();
    db.authors = db.authors.filter((a) => String(a.id) !== String(id));
    saveDb(db);
    return { data: { success: true } };
  },

  async getPublishers() {
    await delay(150, 300);
    const db = getDb();
    return { data: db.publishers, items: db.publishers };
  },
  async createPublisher(data) {
    await delay();
    const db = getDb();
    const newP = { id: uid(), name: data.name, address: data.address || '' };
    db.publishers.push(newP);
    saveDb(db);
    return { data: newP };
  },
  async updatePublisher(id, data) {
    await delay();
    const db = getDb();
    const idx = db.publishers.findIndex((p) => String(p.id) === String(id));
    if (idx !== -1) db.publishers[idx] = { ...db.publishers[idx], ...data };
    saveDb(db);
    return { data: db.publishers[idx] };
  },
  async deletePublisher(id) {
    await delay();
    const db = getDb();
    db.publishers = db.publishers.filter((p) => String(p.id) !== String(id));
    saveDb(db);
    return { data: { success: true } };
  },

  // ========== CART ==========
  async getCart() {
    await delay(150, 300);
    const db = getDb();
    const user = getCurrentUser();
    const userId = user?.id || 4;
    const items = db.carts[userId] || [];
    return { items, data: { items } };
  },

  async addItem(bookId, quantity = 1) {
    await delay();
    const db = getDb();
    const user = getCurrentUser();
    const userId = user?.id || 4;
    if (!db.carts[userId]) db.carts[userId] = [];

    const book = db.books.find((b) => String(b.id) === String(bookId));
    if (!book) throw new ApiError(404, 'Không tìm thấy sách');

    const existingIndex = db.carts[userId].findIndex((item) => String(item.book_id) === String(bookId));
    const currentQty = existingIndex !== -1 ? db.carts[userId][existingIndex].quantity : 0;
    const nextQty = currentQty + quantity;

    if (nextQty > book.stock) {
      throw new ApiError(400, `Sản phẩm không đủ số lượng (chỉ còn ${book.stock} cuốn)`);
    }

    if (existingIndex !== -1) {
      db.carts[userId][existingIndex].quantity = nextQty;
    } else {
      db.carts[userId].push({
        id: uid(),
        book_id: book.id,
        title: book.title,
        unit_price: book.price,
        quantity: nextQty,
        image: book.image,
      });
    }

    saveDb(db);
    return { message: 'Đã thêm vào giỏ hàng', items: db.carts[userId] };
  },

  async updateItem(bookId, quantity) {
    await delay(150, 350);
    const db = getDb();
    const user = getCurrentUser();
    const userId = user?.id || 4;
    if (!db.carts[userId]) return { items: [] };

    const book = db.books.find((b) => String(b.id) === String(bookId));
    if (book && quantity > book.stock) {
      throw new ApiError(400, 'Sản phẩm không đủ số lượng trong kho');
    }

    const item = db.carts[userId].find((i) => String(i.book_id) === String(bookId));
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
    saveDb(db);
    return { items: db.carts[userId] };
  },

  async removeItem(bookId) {
    await delay(150, 300);
    const db = getDb();
    const user = getCurrentUser();
    const userId = user?.id || 4;
    if (db.carts[userId]) {
      db.carts[userId] = db.carts[userId].filter((i) => String(i.book_id) !== String(bookId));
      saveDb(db);
    }
    return { message: 'Đã xóa sản phẩm khỏi giỏ hàng', items: db.carts[userId] || [] };
  },

  async clearCart() {
    await delay(100, 200);
    const db = getDb();
    const user = getCurrentUser();
    const userId = user?.id || 4;
    db.carts[userId] = [];
    saveDb(db);
    return { message: 'Đã làm trống giỏ hàng', items: [] };
  },

  // ========== ORDERS ==========
  async getOrders(params = {}) {
    await delay();
    if (checkMockFlags()) return { data: [], items: [] };

    const db = getDb();
    const user = getCurrentUser();
    let orders = [...db.orders];

    // Khách hàng thông thường chỉ thấy đơn của mình
    if (user && user.role === 'CUSTOMER') {
      orders = orders.filter((o) => o.user_id === user.id);
    }

    // Lọc theo status
    if (params.status) {
      orders = orders.filter((o) => o.status === params.status);
    }

    // Sắp xếp mới nhất lên đầu
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return { data: orders, items: orders, total: orders.length };
  },

  async getOrderDetail(id) {
    await delay();
    checkMockFlags();
    const db = getDb();
    const order = db.orders.find((o) => String(o.id) === String(id) || String(o.order_id) === String(id));
    if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');
    return { data: order, ...order };
  },

  async createOrder(data) {
    await delay();
    const db = getDb();
    const user = getCurrentUser();
    const userId = user?.id || 4;

    // Kiểm tra và trừ tồn kho sách
    for (const item of data.items || []) {
      const book = db.books.find((b) => String(b.id) === String(item.book_id));
      if (!book || book.stock < item.quantity) {
        throw new ApiError(400, `Sách "${book ? book.title : item.book_id}" không đủ tồn kho`);
      }
      book.stock -= item.quantity;
      book.stock_quantity = book.stock;

      // Tạo giao dịch kho EXPORT_ORDER
      db.inventory.unshift({
        id: uid(),
        book_id: book.id,
        book_title: book.title,
        type: 'EXPORT_ORDER',
        quantity: -item.quantity,
        note: `Xuất đơn hàng mới cho ${data.customer_name}`,
        created_by: 'Hệ thống tự động',
        created_at: new Date().toISOString(),
      });
    }

    const newOrderId = uid();
    const newOrder = {
      id: newOrderId,
      order_id: newOrderId,
      user_id: userId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email,
      shipping_address: data.shipping_address,
      payment_method: data.payment_method,
      payment_status: data.payment_method === 'COD' ? 'UNPAID' : 'PAID',
      status: 'PENDING',
      order_status: 'PENDING',
      notes: data.notes || '',
      items: (data.items || []).map((i) => {
        const b = db.books.find((book) => String(book.id) === String(i.book_id));
        return {
          id: uid(),
          book_id: i.book_id,
          title: b ? b.title : 'Sách',
          unit_price: b ? b.price : 0,
          quantity: i.quantity,
          image: b ? b.image : '',
        };
      }),
      status_history: [
        {
          status: 'PENDING',
          changed_at: new Date().toISOString(),
          notes: 'Đơn hàng được tạo thành công',
        },
      ],
      created_at: new Date().toISOString(),
    };

    const subtotal = newOrder.items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    newOrder.subtotal = subtotal;
    newOrder.total_amount = subtotal;
    newOrder.total = subtotal;

    db.orders.unshift(newOrder);

    // Xóa giỏ hàng
    db.carts[userId] = [];
    saveDb(db);

    return { message: 'Đặt hàng thành công', data: newOrder, order: newOrder };
  },

  async cancelOrder(id) {
    await delay();
    const db = getDb();
    const order = db.orders.find((o) => String(o.id) === String(id));
    if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new ApiError(400, 'Đơn hàng đã được xử lý, không thể hủy');
    }

    order.status = 'CANCELLED';
    order.order_status = 'CANCELLED';
    order.status_history.push({
      status: 'CANCELLED',
      changed_at: new Date().toISOString(),
      notes: 'Khách hàng hủy đơn hàng',
    });

    // Hoàn trả kho sách
    for (const item of order.items || []) {
      const b = db.books.find((book) => String(book.id) === String(item.book_id));
      if (b) {
        b.stock += item.quantity;
        b.stock_quantity = b.stock;
      }
    }

    saveDb(db);
    return { message: 'Đã hủy đơn hàng thành công', data: order };
  },

  async updateOrderStatus(id, newStatus, notes = '') {
    await delay();
    const db = getDb();
    const order = db.orders.find((o) => String(o.id) === String(id));
    if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng');

    order.status = newStatus;
    order.order_status = newStatus;
    if (newStatus === 'DELIVERED') {
      order.payment_status = 'PAID';
    }
    order.status_history.push({
      status: newStatus,
      changed_at: new Date().toISOString(),
      notes: notes || `Chuyển trạng thái sang ${newStatus}`,
    });

    saveDb(db);
    return { message: 'Cập nhật trạng thái thành công', data: order };
  },

  // ========== INVENTORY ==========
  async getInventory() {
    await delay();
    const db = getDb();
    return { data: db.books, items: db.books };
  },

  async importStock(data) {
    await delay();
    const db = getDb();
    const book = db.books.find((b) => String(b.id) === String(data.bookId || data.book_id));
    if (!book) throw new ApiError(404, 'Không tìm thấy sách');

    const qty = Number(data.quantity);
    book.stock += qty;
    book.stock_quantity = book.stock;

    db.inventory.unshift({
      id: uid(),
      book_id: book.id,
      book_title: book.title,
      type: 'IMPORT',
      quantity: qty,
      note: data.note || 'Nhập thêm kho thủ công',
      created_by: getCurrentUser()?.full_name || 'Admin',
      created_at: new Date().toISOString(),
    });

    saveDb(db);
    return { message: 'Nhập kho thành công', data: book };
  },

  async getInventoryHistory() {
    await delay();
    const db = getDb();
    return { data: db.inventory, items: db.inventory };
  },

  // ========== USERS (ADMIN) ==========
  async getUsers() {
    await delay();
    const db = getDb();
    return { data: db.users, items: db.users };
  },

  async updateUserRole(id, role) {
    await delay();
    const db = getDb();
    const user = db.users.find((u) => String(u.id) === String(id));
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
    user.role = role;
    saveDb(db);
    return { message: 'Cập nhật vai trò thành công', data: user };
  },

  async updateUserStatus(id, status) {
    await delay();
    const currentUser = getCurrentUser();
    if (currentUser && String(currentUser.id) === String(id)) {
      throw new ApiError(400, 'Không thể tự khóa tài khoản của chính mình');
    }
    const db = getDb();
    const user = db.users.find((u) => String(u.id) === String(id));
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng');
    user.status = status;
    saveDb(db);
    return { message: 'Cập nhật trạng thái thành công', data: user };
  },

  // ========== STATS & DASHBOARD ==========
  async getDashboardStats() {
    await delay();
    const db = getDb();
    const stats = calculateStats(db.orders, db.books);
    return { data: stats, ...stats };
  },

  async getRevenueStats() {
    await delay();
    const db = getDb();
    const stats = calculateStats(db.orders, db.books);
    return { data: stats.revenue30Days, items: stats.revenue30Days };
  },

  async exportReport(format = 'csv') {
    await delay(1000);
    const db = getDb();
    const csvHeader = 'Mã đơn,Khách hàng,Tổng tiền,Trạng thái,Ngày tạo\n';
    const csvRows = db.orders
      .map((o) => `${o.id},"${o.customer_name}",${o.total_amount},${o.status},${o.created_at}`)
      .join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    return blob;
  },

  // ========== AI SERVICES ==========
  async chatWithAI({ message }) {
    await delay(600, 1000);
    const db = getDb();
    const cleanMsg = (message || '').toLowerCase();

    // Tìm kiếm sách theo từ khóa trong câu hỏi
    const matchedBooks = db.books.filter((b) => {
      const titleLower = b.title.toLowerCase();
      const descLower = (b.description || '').toLowerCase();
      return (
        cleanMsg.includes('sách') ||
        titleLower.split(' ').some((w) => w.length > 2 && cleanMsg.includes(w)) ||
        descLower.split(' ').some((w) => w.length > 3 && cleanMsg.includes(w))
      );
    });

    const suggested = matchedBooks.slice(0, 3);
    let reply = 'Chào bạn! Tôi có thể giúp bạn tìm sách theo sở thích.';

    if (cleanMsg.includes('kinh tế') || cleanMsg.includes('tiền') || cleanMsg.includes('giàu')) {
      reply = 'Về lĩnh vực kinh tế & tài chính, Phương Anh Bookstore xin gợi ý cuốn "Tâm Lý Học Về Tiền", "Cha Giàu Cha Nghèo" và "Đắc Nhân Tâm". Đây là những tác phẩm giúp xây dựng tư duy tài chính vững vàng!';
    } else if (cleanMsg.includes('tiểu thuyết') || cleanMsg.includes('văn học')) {
      reply = 'Dòng sách văn học bán chạy nhất hiện nay là "Nhà Giả Kim" của Paulo Coelho và các tác phẩm trong trẻo của nhà văn Nguyễn Nhật Ánh như "Tôi Thấy Hoa Vàng Trên Cỏ Xanh".';
    } else if (cleanMsg.includes('phát triển') || cleanMsg.includes('thói quen')) {
      reply = 'Để nâng tầm bản thân và rèn luyện kỷ luật, cuốn "Atomic Habits - Thay Đổi Tí Hon" và "Đắc Nhân Tâm" sẽ là lựa chọn tuyệt vời nhất cho bạn!';
    } else {
      reply = `Dựa trên yêu cầu của bạn, tôi tìm thấy ${suggested.length > 0 ? suggested.length : 'nhiều'} cuốn sách rất phù hợp. Bạn có thể bấm thêm vào giỏ hàng ngay bên dưới nhé!`;
    }

    return {
      message: reply,
      reply,
      books: suggested,
      data: { message: reply, reply, books: suggested },
    };
  },

  async suggestBooks() {
    await delay(300, 500);
    const db = getDb();
    const suggested = db.books.slice(0, 4);
    return { data: suggested, items: suggested };
  },
};

