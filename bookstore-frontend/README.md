# 📚 Bookstore Frontend - React + Vite + TypeScript

Ứng dụng web bán sách hiện đại được xây dựng với **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, và tích hợp **Backend Microservices**.

---

## ✨ Tính Năng

### 👥 Khách Hàng (Customer)
- ✅ Duyệt danh sách sách với bộ lọc
- ✅ Tìm kiếm sách theo tên, tác giả, thể loại
- ✅ Xem chi tiết sách (tác giả, nhà xuất bản, mô tả)
- ✅ Đánh giá & xem bình luận sách
- ✅ Thêm sách vào giỏ hàng
- ✅ Quản lý giỏ hàng (thêm/xóa/cập nhật số lượng)
- ✅ Đặt hàng với 2 phương thức thanh toán (COD, Bank Transfer)
- ✅ Xem lịch sử đơn hàng & chi tiết đơn hàng
- ✅ Quản lý hồ sơ cá nhân (thông tin, mật khẩu)
- ✅ Dark mode support

### 🛠️ Nhân Viên/Admin (Staff/Admin)
- ✅ Quản lý sách (tạo/sửa/xóa/tìm kiếm)
- ✅ Quản lý tác giả, nhà xuất bản, thể loại
- ✅ Quản lý kho hàng (xem tồn kho, nhập hàng, điều chỉnh)
- ✅ Quản lý đơn hàng (xem status, cập nhật trạng thái)
- ✅ Quản lý người dùng (xem danh sách, phân quyền, khóa tài khoản)
- ✅ Xem thống kê & biểu đồ bán hàng
- ✅ Xuất báo cáo (CSV/Excel)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 16.x
- **npm** ≥ 8.x hoặc **yarn**
- **Backend Services** chạy trên port 8080, 8081, 8082, 8084

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/bookstore-frontend.git
cd bookstore-frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Update backend URLs if needed (default: localhost)
# VITE_CATALOG_URL=http://localhost:8080/api/catalog
# VITE_USER_URL=http://localhost:8081/api
# VITE_ORDER_URL=http://localhost:8082/api
# VITE_INVENTORY_URL=http://localhost:8084/api/inventory
```

### Development

```bash
# Start development server
npm run dev
# Frontend sẽ chạy trên http://localhost:5173

# Start backend services (in separate terminals)
# Catalog Service (port 8080)
# User Service (port 8081)
# Order Service (port 8082)
# Inventory Service (port 8084)
```

### Build & Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📁 Project Structure

```
bookstore-frontend/
├── src/
│   ├── api/                          # API Services Layer
│   │   ├── apiConfig.ts              # URL & config
│   │   ├── axiosClient.js            # HTTP client
│   │   ├── index.ts                  # Export all services
│   │   └── services/
│   │       ├── catalogService.ts     # Books, Authors, Categories
│   │       ├── authService.ts        # Auth, Profile, Users
│   │       ├── orderService.ts       # Cart, Orders, Payments
│   │       └── inventoryService.ts   # Stock, Transactions
│   │
│   ├── components/                   # React Components
│   │   ├── common/                   # Common components
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ...
│   │   └── features/                 # Feature components
│   │       ├── BookCard.jsx
│   │       ├── BookList.jsx
│   │       └── ...
│   │
│   ├── context/                      # React Context
│   │   ├── AuthContext.jsx           # Auth state management
│   │   ├── CartContext.jsx           # Cart state management
│   │   └── ToastContext.jsx          # Toast notifications
│   │
│   ├── pages/                        # Page components
│   │   ├── customer/                 # Customer pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── BookListPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   └── ...
│   │   ├── admin/                    # Admin pages
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── BookManagePage.jsx
│   │   │   └── ...
│   │   └── auth/
│   │       ├── LoginPage.jsx
│   │       └── RegisterPage.jsx
│   │
│   ├── layouts/                      # Layout components
│   │   ├── CustomerLayout.jsx
│   │   ├── AdminLayout.jsx
│   │   └── AuthLayout.jsx
│   │
│   ├── types/                        # TypeScript types
│   │   ├── api.types.ts              # API types
│   │   └── index.ts                  # Export all types
│   │
│   ├── routes/                       # Route definitions
│   │   └── AppRoutes.jsx
│   │
│   ├── App.jsx                       # Main app component
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles (Tailwind)
│
├── public/                           # Static assets
├── .env.example                      # Environment template
├── .env.local                        # Environment (local)
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 🔌 API Services Integration

### 4 Main Services

#### 1. **Catalog Service** (Port 8080)
Quản lý sách, tác giả, thể loại, nhà xuất bản

```typescript
import { catalogService } from '@/api';

// Search books
const books = await catalogService.searchBooks('Java', { categoryId: 1 });

// Get categories
const categories = await catalogService.getCategories();

// Get authors
const authors = await catalogService.getAuthors();
```

#### 2. **Auth Service** (Port 8081)
Xác thực, quản lý người dùng

```typescript
import { authService } from '@/api';

// Login
await authService.login({ usernameOrEmail: 'user', password: 'pass' });

// Get profile
const profile = await authService.getMyProfile();

// Update profile
await authService.updateProfile({ fullName: 'New Name', ... });
```

#### 3. **Order Service** (Port 8082)
Giỏ hàng, đơn hàng, thanh toán

```typescript
import { orderService } from '@/api';

// Get cart
const cart = await orderService.getCart();

// Add to cart
await orderService.addToCart({ bookId: 1, quantity: 2 });

// Place order
const order = await orderService.placeOrder({
  shippingAddress: '123 Street',
  paymentMethod: 'COD'
});
```

#### 4. **Inventory Service** (Port 8084)
Quản lý kho hàng (Admin only)

```typescript
import { inventoryService } from '@/api';

// Get inventory
const inventory = await inventoryService.getInventory(bookId);

// Check low stock
const lowStock = await inventoryService.getLowStockItems(5);

// Import inventory (admin)
await inventoryService.importInventory({
  bookId: 1,
  quantity: 50,
  note: 'Import from supplier A'
});
```

---

## ⚙️ Configuration

### .env.local

```env
# Backend Microservices URLs
VITE_CATALOG_URL=http://localhost:8080/api/catalog
VITE_USER_URL=http://localhost:8081/api
VITE_ORDER_URL=http://localhost:8082/api
VITE_INVENTORY_URL=http://localhost:8084/api/inventory

# Mock API (development only)
VITE_USE_MOCK_API=false

# Production URLs
# VITE_CATALOG_URL=https://api.bookstore.com/catalog
# VITE_USER_URL=https://api.bookstore.com/auth
# VITE_ORDER_URL=https://api.bookstore.com/orders
# VITE_INVENTORY_URL=https://api.bookstore.com/inventory
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **TypeScript** - Type safety
- **React Router v7** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Validation
- **Lucide React** - Icons
- **Recharts** - Charts & graphs

### Backend (Microservices)
- **Spring Boot** - Java framework
- **MySQL** - Database
- **JWT** - Authentication
- **Eureka** - Service discovery
- **API Gateway** - Request routing

---

## 📖 Usage Examples

### Login Page

```typescript
import { authService } from '@/api';

const handleLogin = async (credentials) => {
  try {
    const response = await authService.login(credentials);
    console.log('Login successful:', response);
    navigate('/');
  } catch (error) {
    showError(error.message);
  }
};
```

### Book Listing with Filters

```typescript
import { catalogService } from '@/api';

const [books, setBooks] = useState([]);

const handleSearch = async (query, filters) => {
  const result = await catalogService.searchBooks(query, filters);
  setBooks(result.content);
};
```

### Shopping Cart

```typescript
import { orderService } from '@/api';

const handlePlaceOrder = async (shippingAddress) => {
  const order = await orderService.placeOrder({
    shippingAddress,
    paymentMethod: 'COD'
  });
  navigate(`/orders/${order.orderId}`);
};
```

---

## 🐛 Troubleshooting

### Issue: CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Enable CORS on backend services

### Issue: 401 Unauthorized
**Solution**: Token may have expired. The app auto-refreshes tokens. If error persists, login again.

### Issue: Network Failed
**Solution**: 
- Verify backend services are running
- Check URLs in .env.local match your backend ports
- Check DevTools → Network tab for actual requests

### Issue: Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking (if available)
```

---

## 🔐 Security

- ✅ JWT tokens stored in localStorage
- ✅ Auto token refresh on 401
- ✅ Role-based access control (Admin/Staff/Customer)
- ✅ Input validation with Zod
- ✅ HTTPS recommended for production
- ✅ Secure headers configured

---

## 📄 API Documentation

Full API documentation is available at:
- [Backend Integration Guide](./BOOKSTORE_BACKEND_INTEGRATION_GUIDE.md)
- Swagger/OpenAPI: `http://localhost:8080/swagger-ui.html` (when backend runs)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

---

## 📋 Roadmap

- [ ] Add book reviews & ratings
- [ ] Wishlist feature
- [ ] Order tracking with real-time updates
- [ ] Email notifications
- [ ] Multiple payment gateways
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered book recommendations

---

## 📞 Support

For issues, questions, or feedback:
- 📧 Email: support@bookstore.com
- 🐛 GitHub Issues: [Create Issue](https://github.com/yourusername/bookstore-frontend/issues)
- 💬 Discord: [Join Community](https://discord.gg/bookstore)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Frontend Lead**: [Your Name](https://github.com/yourusername)
- **Backend Lead**: [Backend Team](https://github.com)
- **UI/UX Designer**: [Designer Name](https://dribbble.com)

---

## 🎉 Acknowledgments

- React & Vite teams for awesome tools
- Tailwind CSS for beautiful styling
- All contributors and users

---

**Made with ❤️ for book lovers**

Last Updated: October 2024
