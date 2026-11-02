/**
 * Tuyển tập danh ngôn & trích dẫn văn học kinh điển về sách và sự đọc
 * Dành cho Nhà sách Phương Anh
 */
export const LITERARY_QUOTES = [
  {
    quote: 'Sách là ngọn hải đăng bất tử của thời gian.',
    author: 'George Bernard Shaw',
    source: 'Tiểu luận Văn học',
  },
  {
    quote: 'Một cuốn sách hay trên giá sách là một người bạn dù quay lưng lại nhưng vẫn là bạn tốt.',
    author: 'Tục ngữ Pháp',
    source: 'Văn học dân gian',
  },
  {
    quote: 'Chính từ sách mà những người thông thái tìm được sự an ủi trong những nỗi gian nan của cuộc đời.',
    author: 'Victor Hugo',
    source: 'Những người khốn khổ',
  },
  {
    quote: 'Không có người bạn nào trung thành và kiên nhẫn như một cuốn sách hay.',
    author: 'Ernest Hemingway',
    source: 'Ghi chép văn chương',
  },
  {
    quote: 'Đọc sách không chỉ để tích lũy kiến thức, mà là để tìm lại sự lắng đọng và bình yên trong tâm hồn.',
    author: 'Haruki Murakami',
    source: 'Rừng Na Uy',
  },
  {
    quote: 'Đọc một cuốn sách hay giống như được trò chuyện với những bộ óc vĩ đại nhất của các thế kỷ đã qua.',
    author: 'René Descartes',
    source: 'Phương pháp luận',
  },
  {
    quote: 'Thế giới là một cuốn sách mở, và những ai không dịch chuyển chỉ mới đọc được một trang.',
    author: 'St. Augustine',
    source: 'Tự thuật',
  },
  {
    quote: 'Để cho con một hòm vàng không bằng dạy cho con đọc một quyển sách hay.',
    author: 'Cổ nhân',
    source: 'Cách ngôn phương Đông',
  },
  {
    quote: 'Sách mở ra trước mắt tôi những chân trời mới, nơi tri thức và lòng nhân ái hòa làm một.',
    author: 'Maksim Gorky',
    source: 'Thời thơ ấu',
  },
  {
    quote: 'Ngôi nhà không có sách chẳng khác nào một thể xác không có linh hồn.',
    author: 'Marcus Tullius Cicero',
    source: 'Triết học cổ đại',
  },
];

/**
 * Lấy ngẫu nhiên một câu trích dẫn
 */
export const getRandomQuote = () => {
  const index = Math.floor(Math.random() * LITERARY_QUOTES.length);
  return LITERARY_QUOTES[index];
};

/**
 * Lấy câu trích dẫn ổn định theo ngày (giúp không bị đổi loạn xạ giữa các lần render trong cùng ngày)
 */
export const getDailyQuote = () => {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  return LITERARY_QUOTES[dayOfYear % LITERARY_QUOTES.length];
};

export default LITERARY_QUOTES;
