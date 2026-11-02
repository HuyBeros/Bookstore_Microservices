import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

/**
 * Admin Orders Management page – placeholder.
 */
const OrdersPage = () => {
  // Placeholder – real data via adminApi.
  const orders = [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Quản lý đơn hàng</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600">Chưa có dữ liệu đơn hàng.</p>
      ) : (
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Khách hàng</th>
              <th className="py-2 px-4 text-left">Tổng tiền</th>
              <th className="py-2 px-4 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>{/* map rows */}</tbody>
        </table>
      )}
    </div>
  );
};

export default OrdersPage;
