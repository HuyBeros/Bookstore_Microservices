import { makeCover } from '../helpers';

const RAW_BOOKS = [
  { id: 1, title: 'Nhà Giả Kim', price: 79000, originalPrice: 99000, stock: 45, categoryId: 1, publisherId: 3, authorIds: [3], desc: 'Cuốn sách bán chạy chỉ sau Kinh Thánh, kể về hành trình theo đuổi ước mơ của chàng chăn cừu Santiago.' },
  { id: 2, title: 'Đắc Nhân Tâm', price: 86000, originalPrice: 110000, stock: 52, categoryId: 2, publisherId: 6, authorIds: [2], desc: 'Nghệ thuật thu phục lòng người và đạt được thành công bền vững trong giao tiếp và cuộc sống.' },
  { id: 3, title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', price: 92000, originalPrice: 115000, stock: 28, categoryId: 1, publisherId: 1, authorIds: [1], desc: 'Bức tranh đồng quê thơ mộng gắn liền với tuổi thơ, tình anh em và những rung động đầu đời trong sáng.' },
  { id: 4, title: 'Dế Mèn Phiêu Lưu Ký', price: 65000, originalPrice: 85000, stock: 40, categoryId: 7, publisherId: 2, authorIds: [7], desc: 'Tác phẩm thiếu nhi kinh điển của văn học Việt Nam, theo chân chú Dế Mèn dũng cảm đi khám phá thế giới.' },
  { id: 5, title: 'Sapiens - Lược Sử Loài Người', price: 189000, originalPrice: 239000, stock: 18, categoryId: 6, publisherId: 3, authorIds: [4], desc: 'Khám phá toàn cảnh lịch sử tiến hóa ngoạn mục của loài người từ sinh vật bình thường trở thành bá chủ hành tinh.' },
  { id: 6, title: 'Cha Giàu Cha Nghèo', price: 125000, originalPrice: 155000, stock: 3, categoryId: 3, publisherId: 1, authorIds: [5], desc: 'Tư duy tài chính đột phá về sự khác biệt giữa tài sản và tiêu sản để đạt tự do tài chính.' },
  { id: 7, title: 'Atomic Habits - Thay Đổi Tí Hon Hiệu Quả Bất Ngờ', price: 159000, originalPrice: 199000, stock: 35, categoryId: 2, publisherId: 4, authorIds: [6], desc: 'Cách xây dựng thói quen tốt và từ bỏ thói quen xấu một cách khoa học từ những bước nhỏ nhất.' },
  { id: 8, title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu', price: 78000, originalPrice: 95000, stock: 24, categoryId: 2, publisherId: 3, authorIds: [9], desc: 'Cuốn sách truyền cảm hứng sống rực rỡ, học tập và đam mê dành cho mọi bạn trẻ đang tìm phương hướng.' },
  { id: 9, title: 'Nghĩ Giàu Và Làm Giàu', price: 110000, originalPrice: 140000, stock: 0, categoryId: 3, publisherId: 6, authorIds: [10], desc: '13 nguyên tắc làm giàu kinh điển đúc kết qua 25 năm phỏng vấn hơn 500 người thành công nhất nước Mỹ.' },
  { id: 10, title: 'Tâm Lý Học Về Tiền', price: 145000, originalPrice: 180000, stock: 2, categoryId: 3, publisherId: 4, authorIds: [11], desc: 'Những bí mật tâm lý chi phối cách chúng ta chi tiêu, đầu tư và giữ gìn sự thịnh vượng cá nhân.' },
  { id: 11, title: 'Mắt Biếc', price: 85000, originalPrice: 105000, stock: 15, categoryId: 1, publisherId: 1, authorIds: [1], desc: 'Câu chuyện tình đẹp mà buồn man mác của Ngạn dành cho cô bạn thời thơ ấu có đôi mắt biếc.' },
  { id: 12, title: 'Hoàng Tử Bé', price: 58000, originalPrice: 75000, stock: 60, categoryId: 7, publisherId: 2, authorIds: [14], desc: 'Câu chuyện triết lý nhẹ nhàng nhưng sâu sắc về tình bạn, tình yêu và ý nghĩa đích thực của cuộc đời.' },
  { id: 13, title: 'Gieo Mầm Hạnh Phúc', price: 95000, originalPrice: 120000, stock: 4, categoryId: 4, publisherId: 7, authorIds: [12], desc: 'Phương pháp thực tập chánh niệm và hơi thở an lạc trong đời sống bận rộn hằng ngày.' },
  { id: 14, title: '1984 - Một Chín Tám Bốn', price: 115000, originalPrice: 145000, stock: 12, categoryId: 1, publisherId: 3, authorIds: [13], desc: 'Kiệt tác phản địa đàng kinh điển về sự kiểm soát tư tưởng và tự do cá nhân trong xã hội.' },
  { id: 15, title: 'Ikigai - Bí Mật Sống Lâu Và Hạnh Phúc Của Người Nhật', price: 89000, originalPrice: 115000, stock: 22, categoryId: 4, publisherId: 7, authorIds: [15], desc: 'Đi tìm lý do thức dậy mỗi buổi sáng và sống trọn vẹn từng khoảnh khắc theo triết lý sống Nhật Bản.' },
  { id: 16, title: 'Cho Tôi Xin Một Vé Đi Tuổi Thơ', price: 82000, originalPrice: 100000, stock: 33, categoryId: 1, publisherId: 1, authorIds: [1], desc: 'Hành trình trở về thế giới tuổi thơ hồn nhiên, nghịch ngợm và đầy ắp tiếng cười tinh nghịch.' },
  { id: 17, title: 'Chí Phèo', price: 52000, originalPrice: 65000, stock: 19, categoryId: 1, publisherId: 5, authorIds: [8], desc: 'Tập truyện ngắn hiện thực phê phán xuất sắc của Nam Cao về bi kịch tha hóa của người nông dân.' },
  { id: 18, title: 'Homo Deus - Lược Sử Tương Lai', price: 199000, originalPrice: 250000, stock: 14, categoryId: 5, publisherId: 3, authorIds: [4], desc: 'Dự báo tương lai loài người khi công nghệ sinh học và trí tuệ nhân tạo tái định hình thế giới.' },
  { id: 19, title: '21 Bài Học Cho Thế Kỷ 21', price: 175000, originalPrice: 220000, stock: 5, categoryId: 5, publisherId: 3, authorIds: [4], desc: 'Những thách thức cấp bách nhất mà nhân loại đang đối mặt trong kỷ nguyên công nghệ số và biến đổi.' },
  { id: 20, title: 'Cô Gái Đến Từ Hôm Qua', price: 79000, originalPrice: 95000, stock: 0, categoryId: 1, publisherId: 1, authorIds: [1], desc: 'Kỷ niệm tuổi học trò rực rỡ với những trò tinh quái và mối tình thơ mộng tuổi mộng mơ.' },
  { id: 21, title: 'Bí Mật Của May Mắn', price: 68000, originalPrice: 85000, stock: 30, categoryId: 2, publisherId: 6, authorIds: [2], desc: 'May mắn không phải là tình cờ, mà là kết quả của việc chuẩn bị và tạo ra điều kiện phù hợp.' },
  { id: 22, title: 'Trại Súc Vật', price: 72000, originalPrice: 90000, stock: 16, categoryId: 1, publisherId: 3, authorIds: [13], desc: 'Truyện ngụ ngôn chính trị sắc sảo, châm biếm sâu cay và đậm tính nhân văn.' },
  { id: 23, title: 'Quẳng Gánh Lo Đi Và Vui Sống', price: 90000, originalPrice: 110000, stock: 26, categoryId: 2, publisherId: 6, authorIds: [2], desc: 'Bí quyết xua tan âu lo, căng thẳng để tận hưởng cuộc sống bình an và tích cực hơn mỗi ngày.' },
  { id: 24, title: 'Tư Duy Nhanh Và Chậm', price: 210000, originalPrice: 260000, stock: 8, categoryId: 4, publisherId: 4, authorIds: [6], desc: 'Khám phá hai hệ thống tư duy chi phối mọi quyết định và phán đoán trong cuộc sống con người.' },
  { id: 25, title: 'Hiệu Ứng Chim Mồi', price: 88000, originalPrice: 110000, stock: 1, categoryId: 3, publisherId: 4, authorIds: [11], desc: 'Nghệ thuật tâm lý học giá cả và định giá sản phẩm thông minh trong bán lẻ hiện đại.' },
  { id: 26, title: 'Người Giàu Có Nhất Thành Babylon', price: 75000, originalPrice: 95000, stock: 50, categoryId: 3, publisherId: 6, authorIds: [10], desc: 'Những bài học tài chính trường tồn về tích lũy vàng và bảo vệ gia sản từ nền văn minh Babylon cổ.' },
  { id: 27, title: 'Không Gia Đình', price: 145000, originalPrice: 180000, stock: 20, categoryId: 7, publisherId: 5, authorIds: [14], desc: 'Cuộc phiêu lưu đầy cảm động và lòng kiên cường của cậu bé Rémi mồ côi trên khắp nước Pháp.' },
  { id: 28, title: 'Bàn Về Khởi Nghiệp Tinh Gọn', price: 165000, originalPrice: 205000, stock: 0, categoryId: 3, publisherId: 4, authorIds: [6], desc: 'Phương pháp khởi nghiệp giảm thiểu lãng phí và kiểm chứng sản phẩm nhanh chóng từ Silicon Valley.' },
  { id: 29, title: 'Học Cách Học', price: 119000, originalPrice: 150000, stock: 27, categoryId: 2, publisherId: 4, authorIds: [9], desc: 'Bí quyết tiếp thu kiến thức hiệu quả và ghi nhớ lâu dài từ các nhà khoa học thần kinh.' },
  { id: 30, title: 'Nghệ Thuật Tinh Tế Của Việc Không Quan Tâm', price: 105000, originalPrice: 130000, stock: 18, categoryId: 2, publisherId: 7, authorIds: [2], desc: 'Góc nhìn thẳng thắn và hài hước về việc lựa chọn điều thực sự có ý nghĩa trong đời.' },
  { id: 31, title: 'Hành Trình Về Phương Đông', price: 98000, originalPrice: 125000, stock: 22, categoryId: 4, publisherId: 6, authorIds: [12], desc: 'Hành trình thám hiểm tâm linh kỳ thú của đoàn khoa học hoàng gia Anh tại đất nước Ấn Độ.' },
  { id: 32, title: 'Bắt Trẻ Đồng Xanh', price: 89000, originalPrice: 110000, stock: 13, categoryId: 1, publisherId: 3, authorIds: [13], desc: 'Tiếng nói chân thật về sự lạc lõng, nổi loạn và khao khát bảo vệ sự thuần khiết tuổi trẻ.' },
  { id: 33, title: 'Bước Chậm Lại Giữa Thế Gian Vội Vã', price: 92000, originalPrice: 115000, stock: 0, categoryId: 4, publisherId: 3, authorIds: [12], desc: 'Những suy ngẫm sâu lắng giúp lòng bình yên giữa những xô bồ và áp lực của cuộc sống số.' },
  { id: 34, title: 'Lập Trình Cuộc Đời', price: 135000, originalPrice: 168000, stock: 17, categoryId: 5, publisherId: 4, authorIds: [6], desc: 'Ứng dụng tư duy giải thuật và công nghệ thông tin để tối ưu hóa quản lý cuộc sống cá nhân.' },
  { id: 35, title: 'Nguyện Ước Dưới Trăng', price: 68000, originalPrice: 85000, stock: 3, categoryId: 1, publisherId: 1, authorIds: [1], desc: 'Tập truyện tình cảm tuổi học trò ngọt ngào và thơ mộng bên dòng sông quê hương.' },
  { id: 36, title: 'Sức Mạnh Của Hiện Tại', price: 128000, originalPrice: 160000, stock: 21, categoryId: 4, publisherId: 6, authorIds: [12], desc: 'Thoát khỏi gánh nặng của quá khứ và lo âu tương lai để chạm vào năng lượng an nhiên ngay bây giờ.' },
  { id: 37, title: 'Lược Sử Thời Gian', price: 160000, originalPrice: 200000, stock: 11, categoryId: 5, publisherId: 3, authorIds: [4], desc: 'Tác phẩm vật lý thiên văn kinh điển giải thích về lỗ đen, thuyết tương đối và vụ nổ Big Bang.' },
  { id: 38, title: 'Dám Bị Ghét', price: 99000, originalPrice: 125000, stock: 34, categoryId: 4, publisherId: 3, authorIds: [15], desc: 'Dũng cảm sống cuộc đời của chính mình dựa trên tâm lý học dũng cảm của Alfred Adler.' },
  { id: 39, title: 'Khởi Nghiệp 4.0', price: 155000, originalPrice: 195000, stock: 16, categoryId: 3, publisherId: 4, authorIds: [5], desc: 'Chiến lược kinh doanh và chuyển đổi mô hình tăng trưởng trong kỷ nguyên AI và tự động hóa.' },
  { id: 40, title: 'Khu Vườn Bí Mật', price: 88000, originalPrice: 110000, stock: 29, categoryId: 7, publisherId: 2, authorIds: [14], desc: 'Câu chuyện kỳ diệu về sự hồi sinh của một khu vườn hoang phế và những tâm hồn trẻ thơ trong sáng.' },
];

export const initialBooks = RAW_BOOKS.map((b) => {
  const authorName = b.authorIds[0] === 1 ? 'Nguyễn Nhật Ánh' : b.authorIds[0] === 2 ? 'Dale Carnegie' : b.authorIds[0] === 3 ? 'Paulo Coelho' : 'Nhiều tác giả';
  const coverUrl = makeCover(b.title, authorName, b.id);
  const now = Date.now();
  // Rải ngày tạo trong 90 ngày gần đây
  const createdDaysAgo = (b.id * 2) % 85;
  const createdAt = new Date(now - createdDaysAgo * 86400000).toISOString();

  return {
    id: b.id,
    book_id: b.id,
    title: b.title,
    price: b.price,
    originalPrice: b.originalPrice,
    stock: b.stock,
    stock_quantity: b.stock,
    description: b.desc,
    category_id: b.categoryId,
    publisher_id: b.publisherId,
    authors: b.authorIds.map((aid, idx) => ({
      id: aid,
      author_id: aid,
      name: aid === 1 ? 'Nguyễn Nhật Ánh' : aid === 2 ? 'Dale Carnegie' : aid === 3 ? 'Paulo Coelho' : aid === 4 ? 'Yuval Noah Harari' : aid === 5 ? 'Robert Kiyosaki' : 'Tác giả uy tín',
      author_order: idx + 1,
    })),
    image: coverUrl,
    image_url: coverUrl,
    coverUrl,
    created_at: createdAt,
    createdAt,
    soldCount: Math.floor((40 - b.id) * 12 + 15),
  };
});

