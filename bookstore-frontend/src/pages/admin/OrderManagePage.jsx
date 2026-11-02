import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calendar } from 'lucide-react';
import {
  DataTable,
  SearchInput,
  Select,
  EmptyState,
  ErrorState,
  StatusBadge,
  PageHeader,
  Button,
} from '../../components/ui';
import { orderApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { formatPrice, formatDate } from '../../utils/formatters';

const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'SHIPPING', label: 'Đang giao hàng' },
  { value: 'DELIVERED', label: 'Đã hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

/**
 * OrderManagePage Component
 * Admin order management in clean table layout with status filtering, date filtering, and details
 */
const OrderManagePage = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = {
          ...(searchTerm && { search: searchTerm }),
          ...(statusFilter !== 'all' && { status: statusFilter }),
          limit: 100,
        };
        const data = await orderApi.getOrders(params);
        let list = Array.isArray(data) ? data : data?.data || [];

        // Filter by date range if selected
        if (startDate) {
          const start = new Date(startDate).getTime();
          list = list.filter((o) => new Date(o.created_at).getTime() >= start);
        }
        if (endDate) {
          const end = new Date(endDate).getTime() + 86400000; // end of that day
          list = list.filter((o) => new Date(o.created_at).getTime() <= end);
        }

        setOrders(list);
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải danh sách đơn hàng:', err);
        setError('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, startDate, endDate]);

  const handleQuickStatusChange = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus);
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      showToast('success', 'Đã cập nhật trạng thái đơn hàng');
    } catch (err) {
      showToast('error', err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const columns = [
    {
      header: 'Mã đơn',
      accessor: 'id',
      render: (row) => (
        <Link
          to={`/admin/orders/${row.id}`}
          className="font-bold text-body-sm text-primary hover:underline"
        >
          #{String(row.id).slice(0, 8)}
        </Link>
      ),
    },
    {
      header: 'Khách hàng',
      accessor: 'customer_name',
      render: (row) => (
        <div>
          <p className="font-semibold text-body-sm text-ink dark:text-ink">
            {row.customer_name || 'Khách vãng lai'}
          </p>
          {row.customer_phone && (
            <p className="text-caption text-ink-muted">{row.customer_phone}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Ngày đặt',
      accessor: 'created_at',
      render: (row) => (
        <p className="text-body-sm text-ink-muted dark:text-ink-muted">
          {formatDate(row.created_at, 'long')}
        </p>
      ),
    },
    {
      header: 'Số món',
      accessor: 'items',
      render: (row) => (
        <span className="text-body-sm text-ink dark:text-ink font-medium">
          {row.items?.length || 1} sản phẩm
        </span>
      ),
    },
    {
      header: 'Tổng tiền',
      accessor: 'total_amount',
      render: (row) => (
        <p className="text-body-sm font-semibold text-ink dark:text-ink">
          {formatPrice(row.total_amount)}
        </p>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (row) => (
        <StatusBadge type="order" value={row.status} />
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/orders/${row.id}`}
            className="p-1.5 text-ink-muted hover:text-primary hover:bg-surface-muted rounded-button transition-colors inline-flex items-center gap-1 text-caption font-medium"
            title="Xem chi tiết đơn hàng"
          >
            <Eye size={16} />
            <span>Chi tiết</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Quản lý đơn hàng"
        subtitle="Theo dõi, duyệt đơn và quản lý toàn bộ quá trình giao nhận sách"
      />

      {/* Filters Bar */}
      <div className="p-4 bg-surface dark:bg-surface-muted border border-border rounded-card shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <SearchInput
              placeholder="Tìm theo mã đơn, họ tên khách hàng, số điện thoại..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>

          <div>
            <Select
              options={ORDER_STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-input text-caption bg-surface text-ink"
              title="Từ ngày"
            />
            <span className="text-ink-muted">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-input text-caption bg-surface text-ink"
              title="Đến ngày"
            />
          </div>
        </div>

        {(searchTerm || statusFilter !== 'all' || startDate || endDate) && (
          <div className="flex items-center justify-between text-caption text-ink-muted pt-1 border-t border-border">
            <span>Tìm thấy {orders.length} đơn hàng thỏa mãn bộ lọc</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="text-primary hover:underline font-medium"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      {error ? (
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      ) : orders.length === 0 && !loading ? (
        <EmptyState
          title="Không tìm thấy đơn hàng nào"
          description="Chưa có đơn hàng nào khớp với các tiêu chí tìm kiếm hoặc trạng thái đã chọn"
        />
      ) : (
        <DataTable columns={columns} data={orders} loading={loading} />
      )}
    </div>
  );
};

export default OrderManagePage;
