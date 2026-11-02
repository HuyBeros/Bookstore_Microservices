# catalog-service

Quản lý sách, thể loại, tác giả, nhà xuất bản và tìm kiếm.

## Yêu cầu

- JDK 21
- Docker Desktop và Docker Compose
- Mạng Docker bookstore-network

## Cấu hình

Copy `.env.example` thành `.env`, sau đó điền giá trị thực tế.

| Biến | Ý nghĩa |
|---|---|
| HOST_PORT | Cổng truy cập từ máy host |
| CATALOG_DB_URL | JDBC URL database |
| CATALOG_DB_USER | Tài khoản database |
| CATALOG_DB_PASSWORD | Mật khẩu database |
| JWT_ISSUER | Issuer của JWT |
| JWT_JWK_SET_URI | Địa chỉ lấy khóa xác thực |
| JWT_AUDIENCE | Audience được chấp nhận |
| EUREKA_ENABLED | Bật/tắt discovery |
| EUREKA_URL | Địa chỉ Eureka |

Không commit `.env`.

## Test và build

```powershell
.\mvnw.cmd clean verify
```

## Chạy

Build JAR thành công trước khi chạy:

```powershell
docker compose --env-file .env up -d --build
```

## API

- GET /api/catalog/books
- GET /api/catalog/search
- POST /api/catalog/books
- CRUD /api/catalog/categories
- CRUD /api/catalog/authors
- CRUD /api/catalog/publishers

Đọc công khai; ghi yêu cầu JWT có role ADMIN.

## Kiểm tra và vận hành

- Health: http://localhost:8084/actuator/health
- Log: `docker compose logs -f --tail 100`
- Dừng: `docker compose down`

## Dữ liệu

Database riêng; schema quản lý bằng Flyway.
Không truy cập database của service khác.