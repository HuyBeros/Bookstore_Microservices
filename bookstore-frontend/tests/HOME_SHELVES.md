# Trang chủ: hero, bán chạy, tuyển chọn và tác giả

## Dữ liệu

- Hero không chứa số lượng đầu sách, năm cố định hoặc nhãn bản đặc biệt không có căn cứ. Tác phẩm giới thiệu được chọn theo tên tại `src/data/homeEditorial.js`, có lời dẫn biên tập riêng và nút xem chi tiết. Giá lấy từ Catalog.
- `GET /api/orders/bestsellers?limit=12`: tổng số cuốn từ đơn DELIVERED và PAID, toàn thời gian, giảm dần theo số cuốn và tăng dần ID khi bằng nhau. Không tính đơn hủy/trả. Không có doanh số thì trả mảng rỗng; frontend không thay bằng sách mới.
- Frontend ghép ID bán chạy với sách đang hoạt động từ Catalog batch và tồn kho Inventory. Không đọc API thống kê admin. Trang `/bestsellers` lấy tối đa 24 sách.
- Khám phá có tám thể loại được biên tập trong `homeEditorial.js`, tìm tên sách đã chọn trong từng thể loại, có phương án lấy sách khác khi sách đã xuất hiện ở hero/bán chạy. Loại ID trùng trước khi hiển thị.
- Tác giả được chọn theo tên thực có trong facets, số tựa sách lấy từ Catalog, ảnh lưu tại `public/images/authors`. Nguồn và giấy phép có tại `ATTRIBUTION.md` và mục nguồn ảnh trong giao diện.

## Trình bày

- Các phần dùng chung container 1280px. Hero dùng Serif, chữ nghiêng đất nung, cỡ chữ clamp và text-wrap balance. Chip thể loại là link categoryId thật và cao tối thiểu 44px.
- Banner dùng chung nền ngà, chữ nâu và điểm nhấn đất nung. Mục “Phương Anh chọn đọc” giới thiệu Nhà giả kim, bìa đứng thẳng, đúng tỷ lệ, bóng nhẹ; bìa, giá và tác giả lấy từ Catalog. Nút khám phá dẫn tới kho sách; nút hỏi AI mở ChatWidget hiện có, đóng bằng Esc trả tiêu điểm về nút vừa dùng.
- Chân banner là dải ngà liên tục với bốn mục: giao hàng, chính hãng, đổi trả và AI tư vấn sách. Desktop bốn cột, tablet hai cột, điện thoại bốn hàng; icon nét và đường phân cách đồng bộ. Mục AI là nút mở chatbot, hỗ trợ bàn phím và trả tiêu điểm khi đóng.
- Bìa sách dùng khung 2:3, lazy loading và width/height. Bìa dọc dùng object-fit contain; ảnh canvas vuông của nhà xuất bản được căn giữa bằng object-fit cover để bỏ lề dư hai bên và giữ chiều cao bìa đồng đều.
- Ảnh tác giả hiển thị trong khung tròn bằng CSS, có vị trí khuôn mặt riêng cho từng ảnh. Ảnh lỗi dùng icon sách, không dùng khuôn mặt giả.
- Carousel có scroll-snap, cuộn ngang, nút đầu/cuối bị vô hiệu hóa phù hợp, hỗ trợ ArrowLeft/ArrowRight/Home/End. Vùng mờ chỉ ở mép 12px.
- Tên tác giả không bị cắt, danh sách nhiều tác giả có cấu trúc hiện tên đầu +n và tooltip đầy đủ. Chuỗi tên ghép được giữ nguyên.

## Kiểm tra

- Frontend: 21 kiểm thử đạt; build và ESLint các file thay đổi đạt.
- Order: 7 kiểm thử đạt trên H2, bao gồm 3 kiểm thử API bán chạy (đếm đúng, bỏ trạng thái không hợp lệ, rỗng, giới hạn, quyền truy cập).
- Native API qua Gateway: bestseller 200 với 12 bản ghi; limit=25 trả 400; đơn của tôi và thống kê admin vẫn 401 khi chưa đăng nhập.
- Trình duyệt: 12 sách bán chạy, 8 tuyển chọn không trùng, 4 chân dung tải thành công, trang /bestsellers hoạt động. Desktop 1280x900 và điện thoại 390x844 không tràn ngang; headline điện thoại hai dòng và chip 44px.
- Banner cập nhật: bìa Nhà giả kim tải thành công từ Catalog, hai nút chính cao 48px, liên kết Văn học dẫn tới `/books?categoryId=1`, mở/đóng chatbot từ banner hoạt động. Ảnh kiểm tra nền ngà lưu tại `.cache/banner-refresh/ivory-desktop.jpg` và `.cache/banner-refresh/ivory-mobile.jpg` ở gốc project.

Hợp đồng API: `docs/api/bestsellers.openapi.yaml` ở gốc project. Không thêm dữ liệu doanh số hoặc sửa metadata sách trong database cho lần cập nhật giao diện này.
