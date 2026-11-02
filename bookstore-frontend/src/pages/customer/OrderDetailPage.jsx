import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Package, MapPin, CreditCard, RotateCw } from 'lucide-react';
import {
  ErrorState,
  DetailSkeleton,
  StatusBadge,
} from '../../components/ui';
import { orderApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { Button, ConfirmModal } from '../../components/ui';

/**
 * OrderDetailPage Component — BookZone Figma Design
 * Chi tiết đơn hàng và tiến độ vận chuyển
 */
const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const { showToast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cancel = async () => {
    setCancelling(true);
    try {
      setOrder(await orderApi.cancelOrder(id));
      setCancelOpen(false);
      showToast({ type: 'success', message: 'Đã hủy đơn hàng' });
    } catch (err) { showToast({ type: 'error', message: err.message }); }
    finally { setCancelling(false); }
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderApi.getOrderDetail(id);
        setOrder(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err.status === 404 ? 'Không tìm thấy thông tin đơn hàng' : 'Lỗi khi tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const statusTimeline = [
    { status: 'PENDING', label: 'Đặt hàng thành công' },
    { status: 'CONFIRMED', label: 'Phương Anh đã xác nhận' },
    { status: 'PREPARING', label: 'Đang đóng gói' },
    { status: 'SHIPPING', label: 'Đang vận chuyển' },
    { status: 'DELIVERED', label: 'Giao hàng thành công' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] py-8 px-4 sm:px-6 lg:px-8">
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <ErrorState
          title={error === 'Order not found' ? 'Không tìm thấy đơn hàng' : 'Lỗi tải dữ liệu'}
          message={error}
          onRetry={() => navigate('/orders')}
          retryLabel="Quay lại danh sách đơn hàng"
        />
      </div>
    );
  }

  const currentStatusIndex = statusTimeline.findIndex(s => s.status === order.status);

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] text-[#121c2a] dark:text-[#f0ece8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-5xl mx-auto">

        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8d7168] dark:text-gray-400 hover:text-[#9b2f00] dark:hover:text-[#ff9266] transition-colors no-underline"
          >
            <ChevronLeft size={16} />
            <span>Quay lại danh sách đơn hàng</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#9b2f00] dark:text-[#ff9266]">
              Chi tiết đơn hàng
            </span>
            <h1 className="font-playfair font-bold text-2xl sm:text-3xl text-[#121c2a] dark:text-white mt-1">
              Đơn hàng #{String(order.id).toUpperCase().slice(0, 8)}
            </h1>
            <p className="text-xs sm:text-sm text-[#8d7168] dark:text-gray-400 mt-1">
              Thời gian đặt: {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge type="order" value={order.status} />
            <StatusBadge type="payment" value={order.payment_status} />
            {['PENDING', 'CONFIRMED'].includes(order.status) && <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>Hủy đơn</Button>}
          </div>
        </div>

        {/* Status Timeline */}
        {!['CANCELLED', 'RETURNED'].includes(order.status) && (
          <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
            <h2 className="font-bold text-base sm:text-lg text-[#121c2a] dark:text-white mb-6">
              Tiến trình đơn hàng
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {statusTimeline.map((step, index) => {
                const isPassed = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={step.status} className="flex flex-col items-center text-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${
                        isCurrent
                          ? 'bg-[#c2410c] text-white ring-4 ring-[#ffece7] dark:ring-[#c2410c]/20'
                          : isPassed
                          ? 'bg-[#3b6756] text-white'
                          : 'bg-[#eff4ff] dark:bg-gray-800 text-[#8d7168] dark:text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p
                      className={`text-xs font-semibold leading-tight ${
                        isPassed ? 'text-[#121c2a] dark:text-white' : 'text-[#8d7168] dark:text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancelled Alert */}
        {order.cancelled && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-700 dark:text-red-300">Đơn hàng đã bị hủy</p>
              {order.cancellation_reason && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Lý do: {order.cancellation_reason}</p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Order Items — 7/12 */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-base sm:text-lg text-[#121c2a] dark:text-white mb-4">
                Sách trong đơn ({order.items?.length || 0})
              </h2>

              <div className="divide-y divide-[#e8e3db] dark:divide-gray-800">
                {order.items?.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    {item.book?.image_url ? (
                      <img
                        src={item.book.image_url}
                        alt={item.book?.title}
                        className="w-16 h-22 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-16 h-22 rounded-lg bg-[#eff4ff] dark:bg-gray-800 flex items-center justify-center text-[#9b2f00] shrink-0">
                        <Package size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-[#121c2a] dark:text-white line-clamp-2">
                        {item.book?.title || item.title || `Sách #${item.book_id}`}
                      </h3>
                      {item.book?.authors && (
                        <p className="text-xs text-[#8d7168] dark:text-gray-400 mt-0.5">
                          Tác giả: {item.book.authors.map(a => a.name).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 text-xs sm:text-sm">
                        <span className="text-[#8d7168] dark:text-gray-400">
                          {formatPrice(item.unit_price)} × {item.quantity}
                        </span>
                        <span className="font-bold text-[#9b2f00] dark:text-[#ff9266]">
                          {formatPrice(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-base sm:text-lg text-[#121c2a] dark:text-white">
                  Nhật ký cập nhật
                </h2>
                <div className="space-y-3">
                  {order.status_history.map((event, i) => (
                    <div key={i} className="flex gap-4 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 text-xs">
                      <div className="text-[#8d7168] dark:text-gray-400 min-w-[120px]">
                        {formatDate(event.changed_at)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#121c2a] dark:text-white">
                          Trạng thái: {event.new_status}
                        </p>
                        {event.note && (
                          <p className="text-[#59413a] dark:text-gray-300 mt-0.5">{event.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Customer Info & Financials — 5/12 */}
          <div className="lg:col-span-5 space-y-6">

            {/* Shipping Info */}
            <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#121c2a] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} className="text-[#9b2f00] dark:text-[#ff9266]" />
                <span>Địa chỉ nhận hàng</span>
              </h3>
              <div className="text-xs sm:text-sm text-[#59413a] dark:text-gray-300 space-y-1">
                <p className="font-bold text-[#121c2a] dark:text-white">{order.customer_name}</p>
                <p>{order.customer_phone}</p>
                <p className="text-[#8d7168] dark:text-gray-400 leading-relaxed mt-1">
                  {order.shipping_address}
                </p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#121c2a] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CreditCard size={16} className="text-[#9b2f00] dark:text-[#ff9266]" />
                <span>Thanh toán</span>
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-[#59413a] dark:text-gray-300">
                  <span>Hình thức:</span>
                  <span className="font-semibold text-[#121c2a] dark:text-white">
                    {order.payment_method === 'COD' ? 'Thanh toán tiền mặt (COD)' : order.payment_method === 'BANK_TRANSFER' ? 'Chuyển khoản QR' : order.payment_method}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#59413a] dark:text-gray-300">
                  <span>Trạng thái:</span>
                  <StatusBadge type="payment" value={order.payment_status} />
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-[#121c2a] dark:text-white uppercase tracking-wider">
                Tổng cộng
              </h3>
              <div className="space-y-2 text-xs sm:text-sm border-b border-[#e8e3db] dark:border-gray-800 pb-3">
                <div className="flex justify-between text-[#59413a] dark:text-gray-300">
                  <span>Tiền sách:</span>
                  <span className="font-semibold text-[#121c2a] dark:text-white">{formatPrice(order.subtotal || order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-[#59413a] dark:text-gray-300">
                  <span>Phí ship:</span>
                  <span className="font-semibold text-[#121c2a] dark:text-white">{formatPrice(order.shipping_cost || 0)}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-sm text-[#121c2a] dark:text-white">Thành tiền:</span>
                <span className="font-bold text-2xl text-[#9b2f00] dark:text-[#ff9266]">
                  {formatPrice(order.total_amount)}
                </span>
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full mt-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#eff4ff] dark:bg-gray-800 text-[#59413a] dark:text-gray-200 hover:bg-[#ffece7] hover:text-[#9b2f00] transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw size={15} />
                <span>Làm mới tiến độ</span>
              </button>
            </div>

          </div>

        </div>

      </div>
      <ConfirmModal isOpen={cancelOpen} title="Hủy đơn hàng?"
        message="Bạn có chắc muốn hủy đơn hàng này?"
        confirmLabel="Hủy đơn" cancelLabel="Giữ đơn" variant="danger"
        loading={cancelling} onConfirm={cancel} onCancel={() => setCancelOpen(false)} />
    </div>
  );
};

export default OrderDetailPage;
