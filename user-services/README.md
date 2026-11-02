# User Services — BookStore Microservices

![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-6DB33F?logo=springboot&logoColor=white)
![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2025.1.3-6DB33F?logo=spring&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6-6DB33F?logo=springsecurity&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

Microservice quản lý người dùng, định danh (Identity), xác thực và phân quyền (Authentication & Authorization) trung tâm cho hệ thống **BookStore**. Dịch vụ cung cấp hệ thống REST API chuẩn hóa xử lý đăng ký, đăng nhập JWT Stateless, cấp mới token tự động (Token Rotation), thu hồi token khi đăng xuất (Token Blacklist), khôi phục mật khẩu qua mã OTP, quản lý hồ sơ cá nhân và bộ công cụ quản trị tài khoản đa quyền (RBAC).

---

## Mục lục

- [Kiến trúc hệ thống](#kiến-trúc-hệ-thống)
- [Tính năng chính](#tính-năng-chính)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Hướng dẫn cài đặt và khởi chạy](#hướng-dẫn-cài-đặt-và-khởi-chạy)
- [Cấu hình và biến môi trường](#cấu-hình-và-biến-môi-trường)
- [Danh sách API Endpoints](#danh-sách-api-endpoints)
- [Ví dụ sử dụng API](#ví-dụ-sử-dụng-api)
- [Kiểm thử tự động](#kiểm-thử-tự-động)
- [Lộ trình phát triển](#lộ-trình-phát-triển)
- [Đóng góp](#đóng-góp)
- [Tác giả và liên hệ](#tác-giả-và-liên-hệ)
- [Giấy phép](#giấy-phép)

---

## Kiến trúc hệ thống

- **Phân tầng nghiêm ngặt (Clean Layered Architecture):**
  `Controller` -> `Service` -> `Repository` -> `Entity`, tuân thủ nguyên lý tách biệt trách nhiệm.
- **Chuẩn hóa phản hồi API:**
  Toàn bộ endpoints đều trả về cấu trúc thống nhất `ApiResponse<T>`, kèm mã trạng thái, thông điệp chi tiết và dấu thời gian (`timestamp`).
- **Bảo mật đa tầng:**
  - Khóa bí mật JWT tối thiểu **256 bits** (32 bytes Base64) được kiểm tra ngay khi ứng dụng khởi chạy (`@PostConstruct`).
  - Phân tách rõ loại token: `access` (gọi API) và `refresh` (cấp lại access token), ngăn chặn hành vi tráo đổi token.
  - Mật khẩu mã hóa 1 chiều với **BCrypt**.
  - Phân quyền theo vai trò (Role-Based Access Control - RBAC): `ADMIN`, `STAFF`, `CUSTOMER`.
- **Chống brute-force và DoS (Rate Limiting):**
  Tích hợp **Bucket4j** (thuật toán Token Bucket), giới hạn tối đa 5 lần thử đăng nhập thất bại trong vòng 15 phút.
- **Khả năng tự phục hồi (Graceful Degradation & In-Memory Fallback):**
  Hệ thống sử dụng **Redis** để lưu trữ phân tán (Token Blacklist, OTP, Rate Limiting, Cache). Khi Redis gặp sự cố kết nối, hệ thống tự động chuyển đổi sang bộ nhớ nội bộ (`ConcurrentHashMap`) hoặc truy vấn trực tiếp CSDL nhằm đảm bảo dịch vụ không bị gián đoạn.
- **Tích hợp Microservices:**
  Đã cấu hình sẵn **Spring Cloud Netflix Eureka Client** cho Service Discovery và **HikariCP** Connection Pool tối ưu hiệu năng.

---

## Tính năng chính

| Phân hệ | Tính năng | Chi tiết kỹ thuật |
|---|---|---|
| **Xác thực** | Đăng ký & Đăng nhập | Đăng ký tài khoản `CUSTOMER` mới; đăng nhập bằng `username` hoặc `email`. |
| **Bảo mật JWT** | JWT Stateless & Rotation | Access Token (24h) + Refresh Token (7 ngày); tự động cấp mới cặp token mà không cần đăng nhập lại. |
| **Đăng xuất an toàn** | Token Blacklist | Đưa Access Token vào Redis Blacklist với TTL tương ứng với thời gian sống còn lại của token. |
| **Rate Limiting** | Chống Brute-Force | Thuật toán Token Bucket (Bucket4j), ngăn chặn tấn công dò mật khẩu. |
| **Khôi phục mật khẩu** | OTP 6 chữ số | Sinh mã OTP ngẫu nhiên an toàn (`SecureRandom`), TTL 5 phút, lưu trữ Redis kèm fallback in-memory. |
| **Hồ sơ cá nhân** | Quản lý Profile | Xem và cập nhật thông tin cá nhân (họ tên, email, SĐT, địa chỉ), đổi mật khẩu. |
| **Quản trị người dùng** | Quản trị viên (ADMIN) | Danh sách người dùng phân trang, tìm kiếm đa trường (username, email, họ tên), lọc theo `Role` và `Status`. |
| **Kiểm soát nghiệp vụ** | Bảo vệ quyền Admin | Ngăn cản Admin tự khóa hoặc tự hạ quyền của chính mình. |
| **Khởi tạo dữ liệu** | Data Seeding tự động | Tự động tạo 3 vai trò và 1 tài khoản Admin mặc định thông qua biến môi trường khi triển khai lần đầu. |
| **Tài liệu API** | Swagger / OpenAPI | Tự động sinh tài liệu API tương tác tại `/swagger-ui.html`. |
| **Giám sát hệ thống** | Spring Boot Actuator | Cung cấp endpoints giám sát `/actuator/health`, `/actuator/info`, `/actuator/metrics`. |
| **Đóng gói** | Docker Ready | Dockerfile tối ưu dựa trên base image `eclipse-temurin:21-jre`, chạy dưới non-root user. |

---

## Công nghệ sử dụng

| Thành phần | Công nghệ / Thư viện | Phiên bản | Ghi chú |
|---|---|---|---|
| **Ngôn ngữ** | Java | 21 (LTS) | Virtual Threads, Records, Pattern Matching |
| **Framework** | Spring Boot | 4.1.1 | Nền tảng phát triển ứng dụng chính |
| **Microservice Cloud** | Spring Cloud Netflix Eureka | 2025.1.3 | Service Discovery Client |
| **An ninh & Phân quyền** | Spring Security | 6.x | Stateless JWT filter, CORS, RBAC |
| **JSON Web Token** | JJWT (io.jsonwebtoken) | 0.12.6 | HMAC-SHA256, Claims extraction, Base64 validation |
| **Cơ sở dữ liệu** | PostgreSQL | 16+ | CSDL quan hệ chính |
| **ORM / Data Access** | Spring Data JPA / Hibernate | 7.x | Repository Pattern, Auditing, Paging & Sorting |
| **Connection Pool** | HikariCP | Built-in | Quản lý kết nối CSDL hiệu năng cao |
| **Bộ nhớ đệm phân tán**| Redis | 7.x | Caching, Token Blacklist, OTP, Rate Limiting |
| **Chống Brute-Force** | Bucket4j Core | 8.10.1 | Thuật toán Token Bucket |
| **Tài liệu API** | SpringDoc OpenAPI Starter | 3.0.3 | Tích hợp Swagger UI & OpenAPI v3 |
| **Kiểm thử** | JUnit 5, MockMvc, AssertJ | Built-in | Kiểm thử tích hợp toàn bộ các luồng Auth & User |
| **Build Tool** | Apache Maven | 3.9+ | Trình quản lý dependency và build |
| **Containerization** | Docker | Latest | Base image `eclipse-temurin:21-jre` |

---

## Cấu trúc thư mục

```
user-services/
├── .env.example                               # Mẫu khai báo các biến môi trường
├── Dockerfile                                 # Chỉ dẫn đóng gói Docker container
├── pom.xml                                    # Khai báo dependency Maven & plugins
├── src/
│   ├── main/
│   │   ├── java/com/bookstore/userservices/
│   │   │   ├── UserServicesApplication.java   # Điểm khởi chạy Spring Boot
│   │   │   ├── config/                        # Cấu hình ứng dụng
│   │   │   │   ├── DataInitializer.java       #   Khởi tạo Role & tài khoản Admin ban đầu
│   │   │   │   ├── OpenApiConfig.java         #   Cấu hình Swagger OpenAPI & Bearer Auth
│   │   │   │   ├── RateLimitConfig.java       #   Cấu hình Bucket4j rate limiting
│   │   │   │   ├── RedisConfig.java           #   Cấu hình RedisTemplate, CacheManager, ErrorHandler
│   │   │   │   └── SecurityConfig.java        #   Cấu hình SecurityFilterChain, CORS, PasswordEncoder
│   │   │   ├── controller/                    # Tầng REST Controllers
│   │   │   │   ├── AdminUserController.java   #   API quản trị người dùng (ROLE_ADMIN)
│   │   │   │   ├── AuthController.java        #   API xác thực: Register, Login, OTP, Logout
│   │   │   │   └── UserController.java        #   API hồ sơ cá nhân: Profile, Change Password
│   │   │   ├── dto/                           # Data Transfer Objects
│   │   │   │   ├── request/                   #   10 DTO tiếp nhận dữ liệu đầu vào
│   │   │   │   │   ├── ChangePasswordRequest.java
│   │   │   │   │   ├── ForgotPasswordRequest.java
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── RefreshTokenRequest.java
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   ├── ResetPasswordRequest.java
│   │   │   │   │   ├── UpdateProfileRequest.java
│   │   │   │   │   ├── UpdateUserRoleRequest.java
│   │   │   │   │   ├── UpdateUserStatusRequest.java
│   │   │   │   │   └── VerifyOtpRequest.java
│   │   │   │   └── response/                  #   4 DTO định dạng dữ liệu trả về
│   │   │   │       ├── ApiResponse.java       #   Wrapper chuẩn: success, message, data, timestamp
│   │   │   │       ├── AuthResponse.java      #   Kết quả xác thực kèm cặp token JWT
│   │   │   │       ├── PageResponse.java      #   Phản hồi dữ liệu phân trang
│   │   │   │       └── UserDetailResponse.java#   Chi tiết thông tin tài khoản
│   │   │   ├── entity/                        # Các thực thể JPA Entity
│   │   │   │   ├── Role.java                  #   Bảng roles (mã vai trò, mô tả)
│   │   │   │   ├── RoleName.java              #   Enum: ADMIN, STAFF, CUSTOMER
│   │   │   │   ├── User.java                  #   Bảng users
│   │   │   │   └── UserStatus.java            #   Enum: ACTIVE, LOCKED
│   │   │   ├── exception/                     # Xử lý ngoại lệ tập trung
│   │   │   │   ├── AppException.java          #   Custom business exception với HTTP Status
│   │   │   │   └── GlobalExceptionHandler.java#   @RestControllerAdvice xử lý lỗi toàn cục
│   │   │   ├── repository/                    # Tầng giao tiếp dữ liệu Spring Data JPA
│   │   │   │   ├── RoleRepository.java        #   Truy vấn bảng roles
│   │   │   │   └── UserRepository.java        #   Truy vấn users (JOIN FETCH, phân trang, keyword)
│   │   │   ├── security/                      # Bảo mật và xác thực JWT
│   │   │   │   ├── CustomUserDetails.java     #   Adapter chuyển đổi User -> UserDetails
│   │   │   │   ├── CustomUserDetailsService.java# Nạp người dùng từ CSDL vào Security Context
│   │   │   │   ├── JwtAuthenticationFilter.java# Filter xác thực JWT Bearer trên mỗi request
│   │   │   │   └── JwtService.java            #   Xử lý token: tạo, giải mã, kiểm tra TTL
│   │   │   └── service/                       # Tầng nghiệp vụ (Interfaces & Implementations)
│   │   │       ├── AuthService.java           #   Nghiệp vụ xác thực
│   │   │       ├── EmailService.java          #   Gửi thông báo / mô phỏng gửi email OTP
│   │   │       ├── OtpService.java            #   Sinh, xác minh và dọn dẹp mã OTP
│   │   │       ├── RateLimitService.java      #   Kiểm tra giới hạn request đăng nhập
│   │   │       ├── TokenBlacklistService.java #   Thu hồi token khi đăng xuất
│   │   │       ├── UserService.java           #   Quản lý thông tin và phân quyền user
│   │   │       └── impl/                      #   Các lớp cài đặt Service
│   │   │           ├── AuthServiceImpl.java
│   │   │           ├── EmailServiceImpl.java
│   │   │           ├── OtpServiceImpl.java
│   │   │           ├── RateLimitServiceImpl.java
│   │   │           ├── TokenBlacklistServiceImpl.java
│   │   │           └── UserServiceImpl.java
│   │   └── resources/
│   │       └── application.properties         # Cấu hình trung tâm của ứng dụng
│   └── test/java/com/bookstore/userservices/
│       ├── AuthIntegrationTest.java           # Test tích hợp luồng Register, Login, OTP, Blacklist
│       ├── DatabaseConnectionTest.java        # Test kết nối PostgreSQL & dữ liệu ban đầu
│       ├── UserManagementIntegrationTest.java # Test hồ sơ, đổi mật khẩu, phân quyền Admin
│       └── UserServicesApplicationTests.java  # Test kiểm tra Spring context
```

---

## Hướng dẫn cài đặt và khởi chạy

### 1. Yêu cầu môi trường

- **Java Development Kit (JDK):** Phiên bản `21` trở lên
- **Apache Maven:** Phiên bản `3.9+`
- **PostgreSQL:** Phiên bản `14+` (Khuyến nghị bản `16`)
- **Redis:** Phiên bản `7.0+` *(Khuyến nghị cài đặt; nếu không có Redis, hệ thống sẽ tự động chuyển sang lưu trữ in-memory)*
- **Docker:** *(Tùy chọn nếu chạy dạng container)*

---

### 2. Các bước cài đặt chi tiết

#### Bước 1: Clone repository
```bash
git clone https://github.com/HuyBeros/UserServices.git
cd UserServices
```

#### Bước 2: Tạo cơ sở dữ liệu PostgreSQL
Khởi tạo cơ sở dữ liệu bằng `psql` hoặc các công cụ giao diện như pgAdmin, DBeaver:
```sql
CREATE DATABASE "QLBookStore";
```

#### Bước 3: Tạo file cấu hình môi trường (.env)
Sao chép file mẫu:
- Trên Linux / macOS / Git Bash:
  ```bash
  cp .env.example .env
  ```
- Trên Windows (PowerShell):
  ```powershell
  Copy-Item .env.example .env
  ```

Mở file `.env` vừa tạo và điền các thông số thực tế của môi trường (tham khảo chi tiết từng biến tại mục [Cấu hình và biến môi trường](#cấu-hình-và-biến-môi-trường)).

> **Lưu ý về `JWT_SECRET`:** Giá trị này bắt buộc phải là chuỗi Base64 có độ dài tối thiểu 256 bits (32 bytes).
> - Linux / macOS: `openssl rand -base64 32`
> - Windows (PowerShell): `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))`

---

### 3. Khởi chạy ứng dụng

#### Lựa chọn A: Chạy trực tiếp bằng Maven
```bash
# Biên dịch project
mvn clean install -DskipTests

# Chạy ứng dụng
mvn spring-boot:run
```

#### Lựa chọn B: Đóng gói và chạy qua Docker
```bash
# 1. Đóng gói file JAR
mvn clean package -DskipTests

# 2. Xây dựng Docker Image
docker build -t bookstore-user-services:latest .

# 3. Khởi chạy Docker Container
docker run -d \
  -p 8081:8081 \
  --name bookstore-user-services \
  --env-file .env \
  bookstore-user-services:latest
```

---

### 4. Kiểm tra dịch vụ hoạt động

Sau khi ứng dụng khởi động thành công trên cổng mặc định `8081`:
- Swagger UI (Tài liệu API tương tác): [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)
- OpenAPI Specification JSON: [http://localhost:8081/v3/api-docs](http://localhost:8081/v3/api-docs)
- Health Check (Actuator): [http://localhost:8081/actuator/health](http://localhost:8081/actuator/health)

---

## Cấu hình và biến môi trường

### 1. Bảng biến môi trường (Environment Variables)

| Biến | Bắt buộc | Mặc định | Mô tả |
|---|:---:|---|---|
| `SERVER_PORT` | Không | `8081` | Cổng HTTP lắng nghe của dịch vụ |
| `DB_HOST` | Không | `localhost` | Địa chỉ máy chủ CSDL PostgreSQL |
| `DB_PORT` | Không | `5432` | Cổng kết nối PostgreSQL |
| `DB_NAME` | Không | `QLBookStore` | Tên cơ sở dữ liệu |
| `DB_USERNAME` | Không | `postgres` | Tài khoản kết nối CSDL |
| `DB_PASSWORD` | **Có** | `postgres` | Mật khẩu kết nối CSDL |
| `JWT_SECRET` | **Có** | (None) | Khóa bí mật JWT HMAC-SHA256 (Base64, >= 256 bits) |
| `JWT_EXPIRATION` | Không | `86400000` | Thời gian sống Access Token (ms) — mặc định 24 giờ |
| `JWT_REFRESH_EXPIRATION` | Không | `604800000` | Thời gian sống Refresh Token (ms) — mặc định 7 ngày |
| `REDIS_HOST` | Không | `localhost` | Địa chỉ máy chủ Redis |
| `REDIS_PORT` | Không | `6379` | Cổng kết nối Redis |
| `REDIS_PASSWORD` | Không | *(trống)* | Mật khẩu xác thực Redis (nếu có) |
| `ADMIN_USERNAME` | Không | `admin` | Tên đăng nhập Admin được khởi tạo lần đầu |
| `ADMIN_PASSWORD` | **Có** | (None) | Mật khẩu tài khoản Admin khởi tạo lần đầu |
| `ADMIN_EMAIL` | Không | `admin@bookstore.com` | Email tài khoản Admin khởi tạo lần đầu |
| `EUREKA_URL` | Không | `http://localhost:8761/eureka/` | URL Eureka Discovery Server |
| `CORS_ALLOWED_ORIGINS` | Không | `http://localhost:3000,http://localhost:4200` | Danh sách domain frontend được phép truy cập CORS |
| `SHOW_SQL` | Không | `false` | Bật/tắt log câu lệnh SQL ra console |

---

### 2. Cấu hình nội bộ trong `application.properties`

```properties
# HikariCP Connection Pool
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000

# Rate Limiting (Bucket4j)
rate.limit.login.capacity=5
rate.limit.login.refill-tokens=5
rate.limit.login.refill-duration-minutes=15

# Cache & OTP TTL
spring.cache.redis.time-to-live=1800000      # 30 phút
application.security.otp.expiration-minutes=5 # 5 phút
```

---

## Danh sách API Endpoints

> **Định dạng phản hồi chung:** Toàn bộ API đều đóng gói kết quả theo định dạng chuẩn:
> ```json
> {
>   "success": true,
>   "message": "Thông báo kết quả thao tác",
>   "data": { ... },
>   "timestamp": "2026-10-18T10:00:00.000"
> }
> ```

### 1. Nhóm Xác thực (Public Endpoints — Không yêu cầu Token)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
|:---:|---|:---:|---|
| `POST` | `/api/auth/register` | Public | Đăng ký tài khoản khách hàng (`CUSTOMER`) mới |
| `POST` | `/api/auth/login` | Public | Đăng nhập bằng `username` hoặc `email` + mật khẩu |
| `POST` | `/api/auth/refresh-token` | Public | Cấp mới cặp token bằng Refresh Token hợp lệ |
| `POST` | `/api/auth/logout` | Public / Auth | Đăng xuất và đưa Access Token vào Redis Blacklist |
| `POST` | `/api/auth/forgot-password` | Public | Yêu cầu cấp mã OTP 6 số gửi về email |
| `POST` | `/api/auth/verify-otp` | Public | Kiểm tra tính chính xác của mã OTP |
| `POST` | `/api/auth/reset-password` | Public | Đặt lại mật khẩu mới sau khi xác thực OTP thành công |

---

### 2. Nhóm Hồ sơ Người dùng (Yêu cầu JWT — `Bearer <token>`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
|:---:|---|:---:|---|
| `GET` | `/api/users/me` | Authenticated | Lấy chi tiết thông tin hồ sơ của tài khoản đang đăng nhập |
| `PUT` | `/api/users/profile` | Authenticated | Cập nhật thông tin cá nhân (họ tên, email, SĐT, địa chỉ) |
| `PUT` | `/api/users/change-password` | Authenticated | Đổi mật khẩu tài khoản (yêu cầu mật khẩu cũ) |

---

### 3. Nhóm Quản trị viên (Yêu cầu JWT + Quyền `ROLE_ADMIN`)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
|:---:|---|:---:|---|
| `GET` | `/api/admin/users` | `ADMIN` | Lấy danh sách người dùng phân trang, tìm kiếm & lọc |
| `GET` | `/api/admin/users/{userId}` | `ADMIN` | Lấy thông tin chi tiết một người dùng theo ID |
| `PATCH` | `/api/admin/users/{userId}/status` | `ADMIN` | Cập nhật trạng thái người dùng (`ACTIVE` / `LOCKED`) |
| `PATCH` | `/api/admin/users/{userId}/role` | `ADMIN` | Cập nhật vai trò người dùng (`ADMIN` / `STAFF` / `CUSTOMER`) |

---

### 4. Nhóm Giám sát hệ thống (Actuator Monitoring)

| Phương thức | Đường dẫn | Quyền truy cập | Mô tả |
|:---:|---|:---:|---|
| `GET` | `/actuator/health` | Public | Kiểm tra tình trạng hoạt động của dịch vụ và kết nối CSDL |
| `GET` | `/actuator/info` | `ADMIN` | Xem thông tin ứng dụng |
| `GET` | `/actuator/metrics` | `ADMIN` | Đo lường số liệu JVM, CPU, bộ nhớ và HTTP requests |

---

## Ví dụ sử dụng API

### 1. Đăng ký tài khoản khách hàng mới
```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nguyenvana",
    "password": "Password@123",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone": "0987654321",
    "address": "Hà Nội, Việt Nam"
  }'
```
**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "userId": 2,
    "username": "nguyenvana",
    "email": "nguyenvana@gmail.com",
    "fullName": "Nguyễn Văn A",
    "role": "CUSTOMER"
  },
  "timestamp": "2026-10-18T10:15:00"
}
```

---

### 2. Đăng nhập hệ thống
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "nguyenvana",
    "password": "Password@123"
  }'
```

---

### 3. Làm mới Access Token bằng Refresh Token
```bash
curl -X POST http://localhost:8081/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
  }'
```

---

### 4. Luồng Quên và Đặt lại mật khẩu qua OTP

**Bước 1: Gửi yêu cầu mã OTP**
```bash
curl -X POST http://localhost:8081/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "nguyenvana@gmail.com" }'
```

**Bước 2: Xác thực mã OTP**
```bash
curl -X POST http://localhost:8081/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@gmail.com",
    "otp": "654321"
  }'
```

**Bước 3: Thiết lập mật khẩu mới**
```bash
curl -X POST http://localhost:8081/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nguyenvana@gmail.com",
    "otp": "654321",
    "newPassword": "NewSecurePassword@456"
  }'
```

---

### 5. Đăng xuất và thu hồi Token (Blacklist)
```bash
curl -X POST http://localhost:8081/api/auth/logout \
  -H "Authorization: Bearer <access_token>"
```

---

### 6. Lấy hồ sơ tài khoản cá nhân
```bash
curl -X GET http://localhost:8081/api/users/me \
  -H "Authorization: Bearer <access_token>"
```

---

### 7. Quản trị viên: Lấy danh sách người dùng phân trang & lọc
```bash
curl -X GET "http://localhost:8081/api/admin/users?pageNo=0&pageSize=10&keyword=nguyen&role=CUSTOMER&status=ACTIVE" \
  -H "Authorization: Bearer <admin_access_token>"
```

---

### 8. Quản trị viên: Khóa hoặc Mở khóa tài khoản
```bash
curl -X PATCH http://localhost:8081/api/admin/users/2/status \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "LOCKED" }'
```

---

## Kiểm thử tự động

Dự án tích hợp hệ thống kiểm thử tự động (Integration Tests):
- **`AuthIntegrationTest.java`:** Kiểm thử luồng đăng ký, validation dữ liệu đầu vào, đăng nhập thành công/sai mật khẩu, đăng nhập tài khoản bị khóa, đăng xuất và chặn token blacklist, luồng OTP quên & đổi mật khẩu.
- **`UserManagementIntegrationTest.java`:** Kiểm thử xem và cập nhật hồ sơ cá nhân, đổi mật khẩu, phân quyền truy cập (chặn Customer truy cập Admin API), phân trang người dùng và điều kiện ràng buộc Admin không thể tự khóa tài khoản của mình.
- **`DatabaseConnectionTest.java`:** Kiểm tra tính toàn vẹn kết nối PostgreSQL, bảng và dữ liệu seed ban đầu.
- **`UserServicesApplicationTests.java`:** Kiểm tra khởi động Application Context.

### Lệnh thực thi kiểm thử:
```bash
# Chạy toàn bộ test suites
mvn test

# Chạy riêng suite kiểm thử xác thực
mvn test -Dtest=AuthIntegrationTest

# Chạy riêng suite kiểm thử quản lý người dùng
mvn test -Dtest=UserManagementIntegrationTest
```

---

## Lộ trình phát triển

- [x] Tích hợp Spring Security 6 với JWT Stateless và Token Rotation
- [x] Xác thực độ an toàn của JWT Secret Key khi khởi động (>= 256 bits)
- [x] Cơ chế Rate Limiting chống Brute-Force bằng Bucket4j
- [x] Tích hợp Redis Cache & Session Management (TTL 30 phút)
- [x] Token Blacklist qua Redis khi Logout kèm cơ chế In-Memory Fallback
- [x] Chức năng quên mật khẩu qua OTP 6 số (Redis + In-memory Fallback)
- [x] Cấu hình HikariCP Connection Pool tối ưu hiệu năng CSDL
- [x] Tích hợp Spring Cloud Netflix Eureka Client (Service Discovery)
- [x] Đóng gói Docker Container sẵn sàng deploy (Dockerfile)
- [x] Bộ Integration Test toàn diện với MockMvc & Spring Boot Test
- [ ] Tích hợp API Gateway (Spring Cloud Gateway) định tuyến tập trung
- [ ] Upload ảnh đại diện người dùng (Avatar) tích hợp Cloudinary / AWS S3
- [ ] Gửi email thực tế qua giao thức SMTP (JavaMailSender / SendGrid)
- [ ] Xác thực hai yếu tố (2FA - TOTP / Google Authenticator)
- [ ] Hệ thống Audit Logging lưu vết thao tác của Quản trị viên vào CSDL

---

## Đóng góp

1. Fork repository này về tài khoản GitHub của bạn.
2. Tạo nhánh tính năng mới (`git checkout -b feature/AmazingFeature`).
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`).
4. Push lên nhánh của bạn (`git push origin feature/AmazingFeature`).
5. Tạo một Pull Request mô tả chi tiết nội dung thay đổi.

---

## Tác giả và liên hệ

- **Họ và tên:** Nguyễn Quang Huy
- **Email:** [nquanghuycv@gmail.com](mailto:nquanghuycv@gmail.com)
- **GitHub:** [@HuyBeros](https://github.com/HuyBeros)
- **Dự án Repository:** [https://github.com/HuyBeros/UserServices](https://github.com/HuyBeros/UserServices)

---

## Giấy phép

Dự án được phân phối dưới giấy phép **MIT License**. Chi tiết xem tại file `LICENSE`.
