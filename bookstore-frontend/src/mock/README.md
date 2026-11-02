# Hệ Thống Mock Data – Bookstore Frontend (Prompt 25)

Tài liệu hướng dẫn dữ liệu giả lập (Mock Database) phục vụ chạy giao diện đầy đủ khi chưa có Backend hoặc kiểm thử độc lập.

---

## 1. Danh Sách Tài Khoản Demo (Đăng nhập nhanh)

| Tên đăng nhập (Username) | Mật khẩu | Vai trò (Role) | Trạng thái | Mô tả quyền & Dữ liệu sẵn có |
| :--- | :--- | :--- | :--- | :--- |
| **`admin`** | `Admin@123` | **ADMIN** | `ACTIVE` | Toàn quyền hệ thống: Dashboard, Sách, Danh mục, Tác giả, NXB, Kho, Đơn hàng, Người dùng, Thống kê. |
| **`staff1`** | `Staff@123` | **STAFF** | `ACTIVE` | Nhân viên quản lý: Quản lý sách (chỉ xem), Kho hàng và Đơn hàng. |
| **`customer1`** | `Customer@123` | **CUSTOMER** | `ACTIVE` | Khách hàng mẫu: Có sẵn **3 cuốn sách trong giỏ hàng** (trong đó có cuốn sắp hết kho) và **10+ đơn hàng** ở nhiều trạng thái. |
| **`locked1`** | `Locked@123` | **CUSTOMER** | **`LOCKED`** | Tài khoản bị khóa: Dùng để thử nghiệm thông báo lỗi 403 khi tài khoản bị vô hiệu hóa. |

---

## 2. Cách Bật / Tắt Mock Data

1. **Qua biến môi trường `.env`**:
   ```env
   # Bật mock (mặc định)
   VITE_USE_MOCK=true

   # Tắt mock (kết nối trực tiếp backend Spring Boot)
   VITE_USE_MOCK=false
   ```

2. **Qua Console trình duyệt (DevTools)**:
   ```javascript
   // Tắt mock
   localStorage.setItem('VITE_USE_MOCK', 'false'); location.reload();

   // Bật lại mock
   localStorage.setItem('VITE_USE_MOCK', 'true'); location.reload();
   ```

3. **Công tắc kiểm thử trạng thái qua URL**:
   - `?mock=error`: Ép toàn bộ API ném lỗi `500 Server Error` để kiểm tra màn hình `ErrorState` và nút *Thử lại*.
   - `?mock=empty`: Ép API trả về mảng rỗng `[]` để kiểm tra giao diện `EmptyState`.
   - `?mock=slow`: Tạo độ trễ mạng giả lập `3000ms` để kiểm tra hiệu ứng `Skeleton` và `Spinner`.

---

## 3. Quản Lý Trạng Thái & Reset Dữ Liệu

- Dữ liệu được lưu trong trình duyệt tại `localStorage` với khóa **`'mock_db_v1'`**.
- Mọi thao tác thêm sách, sửa danh mục, xóa sản phẩm, đặt hàng mới, hủy đơn hay nhập kho sẽ được **lưu lại bền vững** ngay cả khi F5 tải lại trang.
- Để khôi phục dữ liệu gốc: Nhấn nút **"Reset dữ liệu"** tại dải thông báo màu vàng cố định ở đáy màn hình hoặc chạy lệnh:
  ```javascript
  import { resetMockDb } from '@/mock/db';
  resetMockDb();
  ```

---

## 4. Bảng Đối Chiếu Trường Dữ Liệu Với Swagger API

| Thực thể | Field giao diện (Frontend) | Field Backend (Spring Boot/Swagger) | Ghi chú mapper |
| :--- | :--- | :--- | :--- |
| **Book** | `id`, `book_id` | `book_id`, `id` | Hỗ trợ cả 2 chuẩn |
| | `title` | `title` | Tên cuốn sách |
| | `price`, `originalPrice` | `price`, `original_price` | Giá bán & giá gốc |
| | `stock`, `stock_quantity` | `stock_quantity` | Tồn kho hiện có |
| | `authors` | `authors: [{ author_id, author_name, author_order }]` | Sắp theo thứ tự tác giả |
| | `category` | `category: { category_id, category_name }` | Thể loại |
| | `publisher` | `publisher: { publisher_id, publisher_name }` | Nhà xuất bản |
| | `image`, `coverUrl` | `image_url` | Sinh SVG Data URI tự động |
| **Order** | `id`, `order_id` | `order_id` | Mã đơn hàng |
| | `customer_name`, `customer_phone` | `customer_name`, `customer_phone` | Thông tin người nhận |
| | `shipping_address` | `shipping_address` | Địa chỉ giao hàng |
| | `status`, `order_status` | `order_status` | PENDING -> CONFIRMED -> PREPARING -> SHIPPING -> DELIVERED (hoặc CANCELLED) |
| | `payment_method` | `payment_method` | COD / BANK_TRANSFER / MOMO |
| | `payment_status` | `payment_status` | UNPAID / PAID |
| | `items` | `items: [{ book_id, quantity, unit_price }]` | Danh sách sản phẩm mua |
| | `status_history` | `order_status_history` | Lịch sử chuyển trạng thái |

