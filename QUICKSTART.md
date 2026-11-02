# Khởi động nhanh

Dùng hướng dẫn hiện hành tại [README.md](README.md#chạy-local-trên-windows).

```powershell
# Cấu hình .env gốc và bookstore-frontend/.env trước, không ghi đè các file đang có.
Push-Location bookstore-frontend
npm ci
Pop-Location
.\start-all.ps1
```

Đã có PostgreSQL và Redis: thêm `-SkipInfrastructure`. Đã build backend: thêm `-SkipBuild`.
Frontend: http://localhost:5173 — Gateway: http://localhost:8080 — Eureka: http://localhost:8761.

Đăng nhập bằng tài khoản admin đã cấu hình trong `.env`. Sau thay đổi hợp đồng JWT, đăng xuất rồi đăng nhập lại để nhận token mới.

Log tại `logs/`. Dừng tiến trình project được script ghi nhận: `.\stop-all-services.ps1`.
