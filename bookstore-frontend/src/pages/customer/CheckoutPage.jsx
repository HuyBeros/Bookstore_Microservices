import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Banknote, AlertCircle, ArrowLeft, ShieldCheck, Truck } from 'lucide-react';
import { FormField, Input, Textarea, EmptyState, ConfirmModal } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { orderApi } from '../../api/services';

/**
 * CheckoutPage Component — BookZone Figma Design
 * Đặt hàng và lựa chọn phương thức thanh toán
 */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, resetCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    note: '',
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate]);

  const total = getTotal?.() || 0;
  const shippingCost = total >= 250000 ? 0 : 30000;
  const finalTotal = total + shippingCost;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmOrder = () => {
    if (!formData.full_name?.trim()) {
      showToast('error', 'Vui lòng nhập họ tên người nhận');
      return;
    }
    if (!formData.phone?.trim()) {
      showToast('error', 'Vui lòng nhập số điện thoại liên lạc');
      return;
    }
    if (!formData.address?.trim()) {
      showToast('error', 'Vui lòng cung cấp địa chỉ giao hàng');
      return;
    }

    setConfirmOpen(true);
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);

      const orderData = {
        shipping_address: formData.address,
        customer_phone: formData.phone,
        customer_name: formData.full_name,
        payment_method: paymentMethod === 'cod' ? 'COD' : paymentMethod === 'bank' ? 'BANK_TRANSFER' : 'MOMO',
        note: formData.note,
        items: items.map(item => ({
          book_id: item.book_id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      };

      const response = await orderApi.createOrder(orderData);

      if (response?.id) {
        resetCart();
        showToast('success', 'Đặt hàng thành công!');

        if (paymentMethod !== 'cod') {
          navigate(`/orders/${response.id}?payment_pending=true`);
        } else {
          navigate(`/orders/${response.id}`);
        }
      }
    } catch (err) {
      console.error('Order error:', err);
      showToast('error', err.message || 'Không thể tạo đơn hàng');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(price);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <EmptyState
          title="Giỏ hàng trống"
          description="Vui lòng thêm sách vào giỏ hàng trước khi thanh toán"
          action={
            <Link
              to="/books"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#c2410c] text-white no-underline mt-4"
            >
              Khám phá sách
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] dark:bg-[#0e1520] text-[#121c2a] dark:text-[#f0ece8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto">

        {/* Back to Cart link */}
        <div className="mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#8d7168] dark:text-gray-400 hover:text-[#9b2f00] dark:hover:text-[#ff9266] transition-colors no-underline"
          >
            <ArrowLeft size={16} />
            <span>Quay lại giỏ hàng</span>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#9b2f00] dark:text-[#ff9266]">
              Đặt hàng an toàn
            </span>
            <h1 className="font-playfair font-bold text-2xl sm:text-4xl text-[#121c2a] dark:text-white mt-1">
              Thanh toán đơn hàng
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#3b6756] dark:text-emerald-400 bg-[#e6eeff] dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-[#bdedd7] dark:border-emerald-800/40">
            <ShieldCheck size={16} />
            <span>Bảo mật chuẩn SSL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Form Left Column — 7/12 */}
          <div className="lg:col-span-7 space-y-6">

            {/* Delivery Information */}
            <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-bold text-lg text-[#121c2a] dark:text-white flex items-center gap-2">
                <Truck size={18} className="text-[#9b2f00] dark:text-[#ff9266]" />
                <span>Thông tin giao hàng</span>
              </h2>

              <div className="space-y-4">
                <FormField label="Họ và tên người nhận" required>
                  <Input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Nguyễn Văn An"
                  />
                </FormField>

                <FormField label="Số điện thoại nhận hàng" required>
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 0912 345 678"
                  />
                </FormField>

                <FormField label="Địa chỉ nhận hàng chi tiết" required>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                    rows={3}
                  />
                </FormField>

                <FormField label="Ghi chú đơn hàng (Tùy chọn)">
                  <Textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                    rows={2}
                  />
                </FormField>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-lg text-[#121c2a] dark:text-white">
                Phương thức thanh toán
              </h2>

              <div className="space-y-3">
                {/* COD */}
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#c2410c] bg-[#ffece7]/40 dark:bg-[#9b2f00]/10'
                      : 'border-[#e8e3db] dark:border-gray-800 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 text-[#c2410c] focus:ring-[#c2410c]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-[#9b2f00] dark:text-[#ff9266]" />
                      <p className="font-bold text-sm text-[#121c2a] dark:text-white">
                        Thanh toán khi nhận hàng (COD)
                      </p>
                    </div>
                    <p className="text-xs text-[#8d7168] dark:text-gray-400 mt-1">
                      Thanh toán tiền mặt cho shipper khi nhận và kiểm tra sách.
                    </p>
                  </div>
                </label>


              </div>
            </div>

            {/* Note alert */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#eff4ff] dark:bg-gray-800/80 text-[#59413a] dark:text-gray-300 text-xs">
              <AlertCircle size={18} className="text-[#9b2f00] dark:text-[#ff9266] shrink-0 mt-0.5" />
              <p>
                Bằng việc nhấn "Đặt hàng ngay", bạn đồng ý với Điều khoản dịch vụ và Chính sách đổi trả sách trong 7 ngày của Phương Anh.
              </p>
            </div>

          </div>

          {/* Order Summary Right Column — 5/12 */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-[#18222f] border border-[#e8e3db] dark:border-gray-800 rounded-2xl p-6 shadow-sm sticky top-28 space-y-5">
              <h2 className="font-bold text-lg text-[#121c2a] dark:text-white">
                Đơn hàng của bạn ({items.length} đầu sách)
              </h2>

              {/* Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 border-b border-[#e8e3db] dark:border-gray-800 pb-4">
                {items.map((item) => (
                  <div key={item.book_id} className="flex items-center text-xs sm:text-sm gap-3">
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-[#f7f2eb] border border-border/40 shrink-0">
                      <img
                        src={item.cover_url || item.coverUrl || item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#121c2a] dark:text-white line-clamp-1">
                        {item.title}
                      </p>
                      <span className="text-[11px] text-[#8d7168] dark:text-gray-400">
                        Số lượng: ×{item.quantity}
                      </span>
                    </div>
                    <span className="font-bold text-[#121c2a] dark:text-white shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-[#59413a] dark:text-gray-300">
                  <span>Tạm tính sách:</span>
                  <span className="font-semibold text-[#121c2a] dark:text-white">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between items-center text-[#59413a] dark:text-gray-300">
                  <span>Phí vận chuyển:</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#bdedd7] dark:bg-emerald-950 text-[#1a4035] dark:text-emerald-400">
                        Miễn phí
                      </span>
                    ) : (
                      <span className="font-semibold text-[#121c2a] dark:text-white">{formatPrice(shippingCost)}</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Total Row */}
              <div className="border-t border-[#e8e3db] dark:border-gray-800 pt-4">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#121c2a] dark:text-white">Tổng thanh toán:</span>
                  <span className="font-bold text-2xl text-[#9b2f00] dark:text-[#ff9266]">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-[#8d7168] dark:text-gray-400 mt-1">
                  (Đã bao gồm thuế GTGT và phí đóng gói sách cẩn thận)
                </p>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#c2410c] hover:bg-[#9b2f00] text-white transition-all shadow-md active:scale-98 disabled:opacity-50"
              >
                {loading ? 'Đang tạo đơn hàng...' : 'Đặt hàng ngay'}
              </button>

              <div className="pt-2 flex items-center justify-center gap-2 text-xs text-[#8d7168] dark:text-gray-400">
                <ShieldCheck size={14} className="text-[#3b6756] dark:text-emerald-400" />
                <span>Cam kết 100% sách chính hãng có hóa đơn</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmOpen}
        title="Xác nhận đặt hàng"
        confirmLabel="Tiến hành đặt hàng"
        cancelLabel="Kiểm tra lại"
        onConfirm={handlePlaceOrder}
        onCancel={() => setConfirmOpen(false)}
        loading={loading}
      >
        <div className="space-y-3 text-xs sm:text-sm">
          <p className="text-[#59413a] dark:text-gray-300">
            Vui lòng kiểm tra lại thông tin người nhận trước khi hoàn tất:
          </p>
          <div className="space-y-2 bg-[#f8f9ff] dark:bg-[#18222f] p-4 rounded-xl border border-[#e8e3db] dark:border-gray-800">
            <div><strong className="text-[#121c2a] dark:text-white">Người nhận:</strong> {formData.full_name}</div>
            <div><strong className="text-[#121c2a] dark:text-white">Số điện thoại:</strong> {formData.phone}</div>
            <div><strong className="text-[#121c2a] dark:text-white">Địa chỉ:</strong> {formData.address}</div>
            <div>
              <strong className="text-[#121c2a] dark:text-white">Phương thức:</strong>{' '}
              {paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : paymentMethod === 'bank' ? 'Chuyển khoản QR ngân hàng' : 'Ví MoMo'}
            </div>
            <div className="pt-2 border-t border-[#e8e3db] dark:border-gray-700 flex justify-between items-center">
              <strong className="text-[#121c2a] dark:text-white">Tổng cộng:</strong>
              <span className="text-[#9b2f00] dark:text-[#ff9266] font-bold text-base">
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>
        </div>
      </ConfirmModal>

    </div>
  );
};

export default CheckoutPage;
