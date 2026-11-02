/**
 * Các hằng số dùng chung trong ứng dụng
 */

// ========== TRẠNG THÁI ĐƠN HÀNG ==========
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PREPARING: 'PREPARING',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
};

export const ORDER_STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã trả hàng',
};

export const ORDER_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
  PREPARING: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  SHIPPING: 'bg-purple-100 text-purple-800 border-purple-300',
  DELIVERED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  RETURNED: 'bg-gray-100 text-gray-800 border-gray-300',
};

// ========== TRẠNG THÁI THANH TOÁN ==========
export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

export const PAYMENT_STATUS_LABELS = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Đã hoàn tiền',
  PENDING: 'Chờ thanh toán',
  COMPLETED: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  CANCELLED: 'Đã hủy',
};

export const PAYMENT_STATUS_COLORS = {
  UNPAID: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  PAID: 'bg-green-100 text-green-800 border-green-300',
  REFUNDED: 'bg-gray-100 text-gray-800 border-gray-300',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  FAILED: 'bg-red-100 text-red-800 border-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
};

// ========== PHƯƠNG THỨC THANH TOÁN ==========
export const PAYMENT_METHODS = {
  COD: 'COD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOMO: 'MOMO',
};

export const PAYMENT_METHOD_LABELS = {
  COD: 'Thanh toán khi nhận hàng',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  MOMO: 'Ví MoMo',
};

// ========== TRẠNG THÁI NGƯỜI DÙNG ==========
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
};

export const USER_STATUS_LABELS = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khóa',
};

export const USER_STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-300',
  LOCKED: 'bg-red-100 text-red-800 border-red-300',
};

// ========== VAI TRÒ NGƯỜI DÙNG ==========
export const USER_ROLES = {
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
};

export const USER_ROLE_LABELS = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị viên',
};

export const USER_ROLE_COLORS = {
  CUSTOMER: 'bg-blue-100 text-blue-800 border-blue-300',
  STAFF: 'bg-purple-100 text-purple-800 border-purple-300',
  ADMIN: 'bg-red-100 text-red-800 border-red-300',
};

// ========== LOẠI GIAO DỊCH KHO ==========
export const INVENTORY_TYPES = {
  IMPORT: 'IMPORT',
  EXPORT_ORDER: 'EXPORT_ORDER',
  ADJUSTMENT: 'ADJUSTMENT',
};

export const INVENTORY_TYPE_LABELS = {
  IMPORT: 'Nhập kho',
  EXPORT_ORDER: 'Bán hàng',
  ADJUSTMENT: 'Điều chỉnh',
};

// ========== NGƯỠNG CẢNH BÁO KHO ==========
export const INVENTORY_THRESHOLDS = {
  LOW_STOCK: 5, // Sắp hết hàng
};

// ========== TRANG THÁI KHO ==========
export const STOCK_STATUS = {
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
};

export const STOCK_STATUS_LABELS = {
  in_stock: 'Còn hàng',
  low_stock: 'Sắp hết',
  out_of_stock: 'Hết hàng',
};

export const STOCK_STATUS_COLORS = {
  in_stock: 'bg-green-100 text-green-800 border-green-300',
  low_stock: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  out_of_stock: 'bg-red-100 text-red-800 border-red-300',
};

// ========== SỰ KIỆN CUSTOM ==========
export const CUSTOM_EVENTS = {
  SHOW_FORBIDDEN_TOAST: 'showForbiddenToast',
  CART_UPDATED: 'cartUpdated',
};
