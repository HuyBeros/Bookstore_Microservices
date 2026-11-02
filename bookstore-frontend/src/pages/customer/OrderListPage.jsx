import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Package, Clock, ArrowRight, ShoppingBag } from 'lucide-react';
import { ErrorState, Skeleton, StatusBadge } from '../../components/ui';
import { orderApi } from '../../api/services';

/**
 * OrderListPage Component — BookZone Figma Design
 * Danh sách đơn hàng của khách hàng
 */
const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = filter !== 'all' ? { status: filter } : {};
        const data = await orderApi.getMyOrders(params);
        setOrders(Array.isArray(data) ? data : data?.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Không thể tải danh sách đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filter]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const filterTabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'confirmed', label: 'Đã xác nhận' },
    { key: 'preparing', label: 'Đang soạn hàng' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] text-[#121c2a] dark:text-[#f0ece8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#9b2f00] dark:text-[#ff9266]">
              Lịch sử mua hàng
            </span>
            <h1 className="font-playfair font-bold text-2xl sm:text-4xl text-[#121c2a] dark:text-white mt-1">
              Đơn hàng của tôi
            </h1>
          </div>
          <Link
            to="/books"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#9b2f00] dark:text-[#ff9266] hover:underline"
          >
            <span>Tiếp tục mua sách</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all ${
                filter === tab.key
                  ? 'bg-[#9b2f00] text-white shadow-sm'
                  : 'bg-white dark:bg-[#18222f] text-[#59413a] dark:text-gray-300 border border-[#e8e3db] dark:border-gray-800 hover:border-[#9b2f00]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800">
                <Skeleton type="rect" height="100px" />
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Lỗi tải dữ liệu"
            message={error}
            onRetry={() => window.location.reload()}
          />
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-[#eff4ff] dark:bg-[#9b2f00]/20 text-[#9b2f00] dark:text-[#ff9266] flex items-center justify-center">
              <ShoppingBag size={28} />
            </div>
            <h3 className="font-bold text-lg text-[#121c2a] dark:text-white mb-2">
              {filter === 'all' ? 'Bạn chưa có đơn hàng nào' : 'Không có đơn hàng nào trong mục này'}
            </h3>
            <p className="text-xs sm:text-sm text-[#8d7168] dark:text-gray-400 max-w-sm mx-auto mb-6">
              Hàng ngàn cuốn sách hấp dẫn đang chờ bạn khám phá trên Phương Anh!
            </p>
            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-[#c2410c] hover:bg-[#9b2f00] text-white transition-all shadow-md no-underline"
            >
              Khám phá sách ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="block no-underline group"
              >
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 hover:border-[#9b2f00] dark:hover:border-[#ff9266] hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                    {/* Order Meta Info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-base text-[#121c2a] dark:text-white">
                          Đơn #{String(order.id).toUpperCase().slice(0, 8)}
                        </span>
                        <StatusBadge type="order" value={order.status} />
                        <span className="hidden sm:inline-block">
                          <StatusBadge type="payment" value={order.payment_status} />
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8d7168] dark:text-gray-400">
                        <Clock size={13} />
                        <span>Đặt ngày: {formatDate(order.created_at)}</span>
                      </div>
                    </div>

                    {/* Order Financials & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] uppercase font-bold text-[#8d7168] dark:text-gray-400">
                          {order.items?.length || 0} sản phẩm
                        </p>
                        <p className="font-bold text-lg text-[#9b2f00] dark:text-[#ff9266]">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-[#eff4ff] dark:bg-gray-800 text-[#59413a] dark:text-gray-300 group-hover:bg-[#ffece7] group-hover:text-[#9b2f00] flex items-center justify-center transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>

                  </div>

                  {/* Book Thumbnails preview */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#e8e3db] dark:border-gray-800 flex items-center gap-3 overflow-x-auto no-scrollbar">
                      {order.items.slice(0, 4).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-[#f8f9ff] dark:bg-gray-800/50 px-3 py-1.5 rounded-lg border border-[#e8e3db] dark:border-gray-700 shrink-0 text-xs"
                        >
                          <Package size={13} className="text-[#9b2f00] dark:text-[#ff9266]" />
                          <span className="font-medium text-[#121c2a] dark:text-white max-w-[150px] truncate">
                            {item.book?.title || item.title || `Sách #${item.book_id}`}
                          </span>
                          <span className="text-[#8d7168] dark:text-gray-400">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <span className="text-xs text-[#8d7168] dark:text-gray-400 font-semibold shrink-0">
                          +{order.items.length - 4} cuốn khác
                        </span>
                      )}
                    </div>
                  )}

                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default OrderListPage;
