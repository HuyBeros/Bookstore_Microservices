/**
 * Mock Helpers: Các tiện ích xử lý dữ liệu giả lập API
 */

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.message = message;
    this.response = { status, data: { message } };
  }
}

/**
 * Xóa dấu tiếng Việt để tìm kiếm không dấu
 */
export function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  str = str.replace(/\u02C6|\u0306|\u031B/g, '');
  return str.trim();
}

/**
 * Tạo độ trễ ngẫu nhiên mô phỏng mạng thật
 */
export const delay = (min = 300, max = 800) => {
  // Hỗ trợ kiểm thử qua URL: ?mock=slow -> trễ 3000ms
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('mock') === 'slow') {
    return new Promise((r) => setTimeout(r, 3000));
  }
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((r) => setTimeout(r, ms));
};

/**
 * Kiểm tra cờ ép lỗi hoặc ép rỗng qua URL: ?mock=error, ?mock=empty
 */
export const checkMockFlags = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const mockFlag = urlParams.get('mock');
  if (mockFlag === 'error') {
    throw new ApiError(500, 'Máy chủ giả lập phát hiện lỗi mô phỏng (?mock=error)');
  }
  return mockFlag === 'empty';
};

/**
 * Phân trang danh sách
 */
export const paginate = (items, page = 1, limit = 12) => {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.max(1, parseInt(limit) || 12);
  const total = items.length;
  const totalPages = Math.ceil(total / l) || 1;
  const start = (p - 1) * l;
  const paginatedData = items.slice(start, start + l);

  return {
    data: paginatedData,
    items: paginatedData,
    total,
    page: p,
    limit: l,
    totalPages,
  };
};

/**
 * Tìm kiếm theo từ khóa trong nhiều trường
 */
export const search = (items, query, fields = ['title', 'name']) => {
  if (!query || !query.trim()) return items;
  const normalizedQuery = removeVietnameseTones(query);

  return items.filter((item) => {
    return fields.some((field) => {
      const val = item[field];
      if (!val) return false;
      if (Array.isArray(val)) {
        return val.some((sub) =>
          removeVietnameseTones(typeof sub === 'string' ? sub : sub.name || '').includes(
            normalizedQuery
          )
        );
      }
      return removeVietnameseTones(String(val)).includes(normalizedQuery);
    });
  });
};

/**
 * Sinh ID tự động
 */
export const uid = () => Math.floor(100000 + Math.random() * 900000);

/**
 * Bảng màu sinh ảnh bìa SVG tỉ lệ 3:4 đẹp mắt
 */
const COVER_GRADIENTS = [
  ['#4f46e5', '#7c3aed'],
  ['#2563eb', '#06b6d4'],
  ['#059669', '#10b981'],
  ['#d97706', '#f59e0b'],
  ['#dc2626', '#f43f5e'],
  ['#7c2d12', '#ea580c'],
  ['#1e1b4b', '#4338ca'],
  ['#312e81', '#6366f1'],
  ['#831843', '#db2777'],
  ['#0f172a', '#334155'],
];

/**
 * Sinh ảnh bìa SVG dạng Data URI không cần gọi internet
 */
export const makeCover = (title, author = 'Phương Anh Books', seed = 0) => {
  const [c1, c2] = COVER_GRADIENTS[Math.abs(seed) % COVER_GRADIENTS.length];
  const safeTitle = (title || 'Sách').replace(/[<>&"]/g, '');
  const safeAuthor = (author || '').replace(/[<>&"]/g, '');

  // Cắt bớt tiêu đề nếu dài để hiển thị nhiều dòng trên bìa SVG
  const words = safeTitle.split(' ');
  const line1 = words.slice(0, 3).join(' ');
  const line2 = words.slice(3, 7).join(' ');
  const line3 = words.slice(7, 11).join(' ');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
      <linearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(0,0,0,0.3)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0.1)"/>
      </linearGradient>
    </defs>
    <rect width="300" height="400" rx="16" fill="url(#g)"/>
    <rect width="20" height="400" rx="4" fill="url(#spine)"/>
    <rect x="25" y="25" width="250" height="350" rx="10" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    <g fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">
      <text x="35" y="60" font-size="12" font-weight="600" letter-spacing="2" fill="rgba(255,255,255,0.7)" text-transform="uppercase">PHƯƠNG ANH STORE</text>
      <text x="35" y="140" font-size="22" font-weight="bold">${line1}</text>
      ${line2 ? `<text x="35" y="170" font-size="20" font-weight="bold">${line2}</text>` : ''}
      ${line3 ? `<text x="35" y="200" font-size="18" font-weight="bold">${line3}</text>` : ''}
      <line x1="35" y1="240" x2="100" y2="240" stroke="#f59e0b" stroke-width="3"/>
      <text x="35" y="275" font-size="14" fill="rgba(255,255,255,0.85)">${safeAuthor}</text>
      <circle cx="230" cy="330" r="28" fill="rgba(255,255,255,0.1)"/>
      <text x="220" y="337" font-size="20">📖</text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

