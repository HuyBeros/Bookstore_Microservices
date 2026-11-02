import { useEffect } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { getOrderDetail, updateOrderStatus } from '../../api/services/orderApi';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants';
import { formatVND, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';

const statusUpdateSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS)),
});

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: order, loading, error, refetch } = useFetch(
    async () => {
      const res = await getOrderDetail(id);
      return res.data || res;
    },
    [id]
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: { status: order?.status },
  });

  const availableStatuses = ({
    PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['SHIPPING', 'CANCELLED'], SHIPPING: ['DELIVERED'], DELIVERED: ['RETURNED'],
  })[order?.status] ?? [];
  useEffect(() => {
    if (order) reset({ status: order.status });
  }, [order, reset]);

  const onSubmit = async (data) => {
    try {
      await updateOrderStatus(id, data);
      showToast({ type: 'success', message: 'Cập nhật trạng thái thành công' });
      refetch();
    } catch (err) {
      showToast({ type: 'error', message: err?.message });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(-1)}
          icon={<ArrowLeft size={16} />}
          className="mb-4"
        >
          Quay lại
        </Button>
        <ErrorState message="Không thể tải đơn hàng" onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => navigate(-1)}
        icon={<ArrowLeft size={16} />}
      >
        Quay lại
      </Button>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Đơn hàng #{order.id}
          </h1>
          <p className="text-gray-600 mt-1">
            {formatDate(order.created_at, 'long')}
          </p>
        </div>
        <StatusBadge
          type="order"
          value={order.status}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sản phẩm</h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} x {formatVND(item.unit_price)}
                    </p>
                  </div>
                  <p className="font-bold">{formatVND(item.quantity * item.unit_price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Thông tin giao hàng
            </h2>
            <div className="space-y-3">
              <p>
                <span className="text-gray-600">Tên:</span>{' '}
                <span className="font-medium">{order.customer_name}</span>
              </p>
              <p>
                <span className="text-gray-600">Điện thoại:</span>{' '}
                <span className="font-medium">{order.customer_phone}</span>
              </p>
              <p>
                <span className="text-gray-600">Email:</span>{' '}
                <span className="font-medium">{order.customer_email}</span>
              </p>
              <p>
                <span className="text-gray-600">Địa chỉ:</span>{' '}
                <span className="font-medium">{order.shipping_address}</span>
              </p>
            </div>
          </div>

          {/* Status History */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Lịch sử
              </h2>
              <div className="space-y-4">
                {order.status_history.map((h, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      {i < order.status_history.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {ORDER_STATUS_LABELS[h.status]}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(h.changed_at, 'long')}
                      </p>
                      {h.notes && (
                        <p className="text-sm text-gray-700 mt-1">{h.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 h-fit sticky top-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Tóm tắt
            </h2>
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span>{formatVND(order.subtotal || order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
            </div>
            <div className="flex justify-between mb-4">
              <span className="font-bold">Tổng:</span>
              <span className="text-lg font-bold">
                {formatVND(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Update Status */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Cập nhật trạng thái
            </h2>

            <FormField label="Trạng thái mới" error={errors.status?.message}>
              <select
                {...register('status')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={order.status}>{ORDER_STATUS_LABELS[order.status]}</option>
                {availableStatuses.map((value) => (
                  <option key={value} value={value}>
                    {ORDER_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </FormField>



            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={isSubmitting || !availableStatuses.length}
              className="w-full"
              icon={isSubmitting ? <Loader size={18} /> : undefined}
            >
              Cập nhật
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
