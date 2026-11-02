import Badge from './Badge';

/**
 * StatusBadge Component
 * Displays status with appropriate color and standard Vietnamese labels
 */
const StatusBadge = ({
  type = 'order', // 'order' | 'payment' | 'user'
  value,
  className = '',
}) => {
  // Order status
  const orderStatuses = {
    PENDING: { label: 'Chờ xác nhận', variant: 'warning' },
    CONFIRMED: { label: 'Đã xác nhận', variant: 'info' },
    PREPARING: { label: 'Đang chuẩn bị', variant: 'info' },
    SHIPPING: { label: 'Đang giao', variant: 'info' },
    DELIVERED: { label: 'Đã hoàn thành', variant: 'success' },
    CANCELLED: { label: 'Đã hủy', variant: 'danger' },
    RETURNED: { label: 'Đã trả hàng', variant: 'info' },
  };

  // Payment status
  const paymentStatuses = {
    UNPAID: { label: 'Chưa thanh toán', variant: 'warning' },
    PENDING: { label: 'Chờ thanh toán', variant: 'warning' },
    PAID: { label: 'Đã thanh toán', variant: 'success' },
    FAILED: { label: 'Thanh toán thất bại', variant: 'danger' },
    REFUNDED: { label: 'Đã hoàn tiền', variant: 'info' },
  };

  // User status
  const userStatuses = {
    ACTIVE: { label: 'Hoạt động', variant: 'success' },
    LOCKED: { label: 'Đã khóa', variant: 'danger' },
    INACTIVE: { label: 'Không hoạt động', variant: 'warning' },
  };

  let statusMap = {};
  if (type === 'order') statusMap = orderStatuses;
  if (type === 'payment') statusMap = paymentStatuses;
  if (type === 'user') statusMap = userStatuses;

  const status = statusMap[value] || { label: value, variant: 'primary' };

  return (
    <Badge
      variant={status.variant}
      size="sm"
      className={`whitespace-nowrap inline-flex items-center justify-center font-medium ${className}`.trim()}
    >
      {status.label}
    </Badge>
  );
};

export default StatusBadge;
