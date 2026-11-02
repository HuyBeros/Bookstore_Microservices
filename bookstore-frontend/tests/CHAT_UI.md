# Kiểm tra chatbot và nút lên đầu trang

ChatWidget được gắn một lần trong CustomerLayout, dùng API AI hiện có. Không thay đổi backend hoặc dữ liệu database.

## Hành vi

- Nút chat tròn màu cam đất; khung trắng kem, có nhãn trợ lý AI.
- Nút lên đầu trang hiện sau 400px cuộn, ẩn khi mở chat để tránh chồng khung.
- Cụm nút tránh thanh điều hướng điện thoại và khoảng safe-area.
- Khách chưa đăng nhập được dẫn đến đăng nhập với đường dẫn quay lại.
- Gửi tối đa 10 lượt lịch sử, đúng định dạng AdviceRequest; khóa gửi trong lúc chờ.
- Enter gửi, Shift+Enter xuống dòng, hỗ trợ IME; Escape đóng và trả focus về nút mở.
- Giữ hội thoại khi thu gọn, xóa khi đổi tài khoản hoặc tải lại; không lưu chat vào localStorage.
- Lỗi có nút thử lại/chỉnh sửa, phản hồi degraded được ghi rõ, sách có liên kết chi tiết.

## Harness mô phỏng

Chạy từ thư mục bookstore-frontend trong PowerShell riêng:

```powershell
$env:VITE_USE_MOCK='true'
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175 --strictPort
```

Mở `/tests/chat-ui.html`. Harness chỉ hoạt động ở Vite dev với mock bật; dùng tài khoản và phản hồi mô phỏng, không gọi backend. Dừng tiến trình sau kiểm tra; không bật mock trên ứng dụng thật.

## Kết quả kiểm tra

- Website thật: mở/đóng, trạng thái khách, responsive 390x844, hai nút tránh thanh điều hướng, cuộn và trở về scrollY=0.
- Harness: đăng nhập, gợi ý nhanh, loading, câu trả lời và liên kết sách, lỗi 503, thử lại không lặp tin, lịch sử USER/ASSISTANT, lỗi 429 và phản hồi degraded.
- Xác nhận trước khi xóa; giữ nội dung khi thu gọn/Escape; reset khi đăng xuất.
- Build frontend, ESLint hai file JSX thay đổi và 13 kiểm thử hiện có đạt.

Chưa kiểm tra câu trả lời LLM thật với tài khoản đăng nhập trong đợt UI này. Phản hồi hội thoại được kiểm tra qua mock.
