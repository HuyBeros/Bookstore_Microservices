# BookStore Microservices

Website bán sách: React/Vite → Spring Cloud Gateway → User, Catalog, Order, Inventory, AI. Eureka quản lý discovery; PostgreSQL lưu dữ liệu theo từng service; Redis phục vụ cache, OTP và blacklist của User Service.

## Chạy local trên Windows

Yêu cầu: Java 21, Maven, Node.js/npm và Docker Desktop. Frontend chỉ gọi gateway, không gọi trực tiếp cổng của từng service.

1. Nếu chưa có `.env`, sao chép `.env.example` ở thư mục gốc. Điền `DB_PASSWORD`, `ADMIN_PASSWORD` và `JWT_SECRET` (Base64 của ít nhất 32 byte ngẫu nhiên). Giữ nguyên `.env` hiện có khi nâng cấp. Không commit file này.
2. Nếu chưa có `bookstore-frontend/.env`, sao chép `.env.example` trong thư mục frontend. Dùng `VITE_API_URL=/api` và `VITE_USE_MOCK=false`.
3. Cài dependency frontend và khởi động:

```powershell
Push-Location bookstore-frontend
npm ci
Pop-Location
.\start-all.ps1
```

`start-all.ps1` đọc biến môi trường, bật PostgreSQL/Redis, build backend, chạy đủ bảy ứng dụng Java, chờ health và chờ các route thực sự hoạt động qua gateway trước khi chạy frontend. Script không dừng tiến trình đang chiếm cổng.

- Đã có PostgreSQL/Redis phù hợp: `.\start-all.ps1 -SkipInfrastructure`.
- Đã build: thêm `-SkipBuild`. Không cần frontend: thêm `-SkipFrontend`.
- `run-services.ps1` gọi cùng quy trình với các tham số tương tự.
- Dừng các tiến trình thuộc project do script ghi nhận: `.\stop-all-services.ps1`.
- Xem log tại `logs/<service>.log` và `logs/<service>-err.log`.

| Thành phần | Cổng |
|---|---:|
| Frontend | 5173 |
| Gateway | 8080 |
| Eureka | 8761 |
| User | 8081 |
| Catalog | 8082 |
| Order và thống kê | 8083 |
| Inventory | 8084 |
| AI | 8085 |
| PostgreSQL / Redis | 5432 / 6379 |

Tài khoản admin được tạo từ `ADMIN_USERNAME` và `ADMIN_PASSWORD` trong `.env`; không có mật khẩu mặc định trong hướng dẫn. Thay đổi biến này không tự đổi mật khẩu của tài khoản đã tồn tại trong database.

## Database

Compose tạo `QLBookStore` qua `POSTGRES_DB`, cùng `BookDB`, `order_db`, `inventory_db`, `ai_db` qua script init. Với PostgreSQL tự quản lý, cần tạo đủ các database này và cấp quyền cho tài khoản cấu hình trong `.env`.

Script init chỉ chạy khi volume PostgreSQL mới. Nếu dùng volume cũ, bổ sung database còn thiếu trực tiếp; không xóa volume đang chứa dữ liệu. Catalog/AI dùng Flyway; Order/Inventory hiện vẫn dùng JPA schema update.

## Kiểm tra

```powershell
mvn test
Push-Location bookstore-frontend
npm test
npm run build
Pop-Location
```

Các integration test backend dùng H2 riêng, không dùng PostgreSQL của người phát triển. User test dùng cache và Redis giả lập trong test; Order test giả lập HTTP client phụ thuộc. Kiểm thử HTTP chạy nhiều service thật được mô tả trong [tài liệu tích hợp](docs/INTEGRATION.md).

## Phạm vi hiện tại

Luồng chính: đăng ký/đăng nhập → xem sách và tồn thực → giỏ hàng → tạo đơn COD → quản trị xác nhận, chuẩn bị, giao hàng → ghi nhận đã trả tiền. Hủy đơn đã xác nhận sẽ gọi hoàn kho. Có form thêm/sửa sách, quản lý metadata, hồ sơ, nhập kho, thống kê từ đơn đã thanh toán và chat AI.

Checkout hiện chỉ cung cấp COD. Chuyển khoản/MoMo và callback từ nhà cung cấp cần một tích hợp riêng; callback giả lập không được mở cho người dùng. AI có thể trả kết quả tham khảo từ Catalog khi Gemini chưa được cấu hình.

Xem [hợp đồng API, kiểm thử và giới hạn triển khai](docs/INTEGRATION.md).

docker desktop start
docker compose up -d --wait redis
.\start-all.ps1 -SkipInfrastructure -SkipBuild