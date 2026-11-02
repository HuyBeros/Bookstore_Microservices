/**
 * Các hàm định dạng dữ liệu dùng chung toàn hệ thống
 */

export const ORDER_STATUS_MAP = {
  PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'info' },
  PREPARING: { label: 'Đang chuẩn bị', variant: 'info' },
  SHIPPING: { label: 'Đang giao', variant: 'info' },
  DELIVERED: { label: 'Đã hoàn thành', variant: 'success' },
  CANCELLED: { label: 'Đã hủy', variant: 'danger' },
  RETURNED: { label: 'Đã trả hàng', variant: 'info' },
};

/**
 * Định dạng tiền tệ VNĐ (ví dụ: 120.000 ₫)
 * @param {number} amount
 * @returns {string}
 */
export const formatVND = (amount) => {
  if (!amount && amount !== 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatPrice = formatVND;

/**
 * Định dạng ngày giờ: chuẩn hóa 'dd/MM/yyyy' hoặc 'dd/MM/yyyy HH:mm'
 * @param {string|Date} date
 * @param {string} format - 'short' | 'long' | 'time'
 * @returns {string}
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '-';
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return String(date);

  const formats = {
    short: (d) =>
      d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    long: (d) =>
      d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    time: (d) =>
      d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
  };

  return (formats[format] || formats.short)(dateObj);
};

/**
 * Cắt ngắn chuỗi
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};

/**
 * Chuyển đổi số điện thoại VN
 * @param {string} phone
 * @returns {string}
 */
export const formatPhoneVN = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `0${cleaned.slice(-9)}`;
  }
  return phone;
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
