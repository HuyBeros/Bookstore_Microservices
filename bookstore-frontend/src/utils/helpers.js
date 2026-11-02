/**
 * Các hàm tiện ích chung
 */

/**
 * Tính tổng tiền giỏ hàng
 * @param {Array} items - [{quantity, unit_price}]
 * @returns {number}
 */
export const calculateCartTotal = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0), 0);
};

/**
 * Tính giá cho một sản phẩm
 * @param {number} quantity
 * @param {number} price
 * @returns {number}
 */
export const calculateItemPrice = (quantity, price) => {
  return (quantity || 0) * (price || 0);
};

/**
 * Xác định trạng thái kho
 * @param {number} stock
 * @param {number} threshold - ngưỡng sắp hết (default 5)
 * @returns {string} - 'in_stock' | 'low_stock' | 'out_of_stock'
 */
export const getStockStatus = (stock, threshold = 5) => {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
};

/**
 * Chặn open redirect
 * @param {string} url
 * @returns {boolean}
 */
export const isInternalUrl = (url) => {
  if (!url) return false;
  try {
    // Chỉ chấp nhận đường dẫn nội bộ bắt đầu bằng /
    return url.startsWith('/') && !url.startsWith('//');
  } catch {
    return false;
  }
};

/**
 * Xác thực số điện thoại VN
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhoneVN = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && /^0[0-9]{9}$/.test(cleaned);
};

/**
 * Debounce function
 * @param {Function} func
 * @param {number} wait - milliseconds
 * @returns {Function}
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {Function} func
 * @param {number} limit - milliseconds
 * @returns {Function}
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Sắp xếp mảng đối tượng
 * @param {Array} arr
 * @param {string} key - khóa để sắp xếp
 * @param {string} order - 'asc' | 'desc'
 * @returns {Array}
 */
export const sortBy = (arr, key, order = 'asc') => {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Lọc đối tượng theo điều kiện
 * @param {Array} arr
 * @param {object} filters - {key: value}
 * @returns {Array}
 */
export const filterBy = (arr, filters) => {
  return arr.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === null || value === undefined) return true;
      return item[key] === value;
    });
  });
};

/**
 * Phát sự kiện custom
 * @param {string} eventName
 * @param {*} detail
 */
export const dispatchCustomEvent = (eventName, detail) => {
  const event = new CustomEvent(eventName, { detail });
  window.dispatchEvent(event);
};

/**
 * Lắng nghe sự kiện custom
 * @param {string} eventName
 * @param {Function} callback
 * @returns {Function} - hàm dùng để remove listener
 */
export const onCustomEvent = (eventName, callback) => {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
};

/**
 * Xác thực email
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Tạo slug từ chuỗi
 * @param {string} str
 * @returns {string}
 */
export const toSlug = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

/**
 * Lấy viết tắt tên
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Deep clone object
 * @param {*} obj
 * @returns {*}
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};
