# Kiểm tra giao diện tài khoản

## Kiểm tra tự động

```powershell
npm test
npm run build
```

`auth-feedback.test.mjs` kiểm tra chính sách mật khẩu dựa trên `RegisterRequest.java`, chuẩn hóa đầu vào, xác nhận mật khẩu, ánh xạ lỗi server, các trạng thái lỗi và điều hướng theo vai trò.

## Kiểm tra bằng trình duyệt với dữ liệu giả lập

Từ thư mục `bookstore-frontend`, chạy một Vite riêng để tránh ảnh hưởng phiên sử dụng thật:

```powershell
$env:VITE_USE_MOCK = 'true'
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort
```

Mở `http://127.0.0.1:5174/tests/auth-ui.html`. Harness sử dụng các form, layout, AuthProvider, ToastProvider và ToastContainer thật của ứng dụng, cùng adapter xác thực giả lập hiện có. Màn hình sau đăng nhập là trang kiểm thử đơn giản. Không tạo tài khoản trong PostgreSQL.

Harness giới hạn trong luồng xác thực vì một số API giỏ hàng/catalog hiện gọi backend thật kể cả khi `VITE_USE_MOCK=true`; token giả lập không thể dùng cho các API đó. Harness không được đưa vào entry production của Vite.

Các trường hợp cần kiểm tra:

| Trường hợp | Kết quả mong đợi |
|---|---|
| Gửi form trống | Hiện lỗi dưới ô nhập và đưa con trỏ đến ô lỗi đầu tiên |
| Sai mật khẩu của tài khoản `customer1` | Hiện lỗi trên form; dữ liệu và form vẫn tồn tại sau phản hồi |
| Đăng ký với username `customer1` | Hiện thông báo và lỗi ngay dưới tên đăng nhập, giữ lại các ô khác |
| Đăng ký bằng username/email chưa có | Chuyển sang đăng nhập, có thông báo thành công và điền sẵn username; không đưa mật khẩu vào URL/state |
| Mật khẩu thiếu yêu cầu hoặc xác nhận khác nhau | Chặn gửi, hiển thị lỗi tương ứng; checklist giúp người dùng sửa |
| Đăng nhập `customer1` / `Customer@123` | Chuyển trang, toast thành công vẫn xuất hiện sau điều hướng |
| Đăng nhập `staff1` / `Staff@123` | Chuyển tới `/admin` |
| Hiện/ẩn mật khẩu bằng bàn phím | Nút nhận focus và đổi trạng thái, không gửi form |
| Trong lúc gửi request | Nút đổi nhãn, form bị khóa để tránh gửi lặp, không thay bằng màn hình tải toàn ứng dụng |
| Màn hình 390px và 1366px | Form không tràn ngang, nhãn đọc được, thông báo nằm trong vùng nhìn thấy |

Thông tin tài khoản ở trên chỉ thuộc dữ liệu giả lập của project, không phải thông tin đăng nhập backend. Khởi động frontend thật bằng môi trường thường khi kiểm tra tích hợp các service. Các kiểm tra giả lập không chứng minh backend đang hoạt động.
