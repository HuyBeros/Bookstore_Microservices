import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFetch } from '../../hooks/useFetch';
import { getStats } from '../../api/services/statsApi';
import { getOrders } from '../../api/services/orderApi';
import { getBooks } from '../../api/services/bookApi';
import { formatVND } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';

/**
 * AdminDashboardPage: Trang chủ admin
 * - Thống kê doanh thu
 * - Đơn hàng gần đây
 * - Sách bán chạy
 * - Biểu đồ
 */
const AdminDashboardPage = () => {
  const { data: stats, loading: statsLoading } = useFetch(
    async () => {
      const res = await getStats();
      return res.data || {};
    },
    []
  );

  const { data: recentOrders } = useFetch(
    async () => {
      const res = await getOrders({ limit: 5 });
      return res.data || [];
    },
    []
  );

  const { data: topBooks } = useFetch(
    async () => {
      const res = await getBooks({ limit: 5, sort: 'bestseller' });
      return res.data || [];
    },
    []
  );

  const statCards = [
    {
      label: 'Tổng doanh thu',
      value: formatVND(stats?.totalRevenue || 0),
      icon: '💰',
    },
    {
      label: 'Đơn hàng',
      value: stats?.totalOrders || 0,
      icon: '📦',
    },
    {
      label: 'Sản phẩm',
      value: stats?.totalProducts || 0,
      icon: '📚',
    },
    {
      label: 'Người dùng',
      value: stats?.totalUsers || 0,
      icon: '👥',
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Tổng quan hoạt động cửa hàng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{card.label}</p>
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        {stats?.revenueData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Doanh thu theo ngày
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(v) => formatVND(v)} />
                <Line type="monotone" dataKey="amount" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Books */}
        {topBooks && topBooks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Sách bán chạy
            </h2>
            <div className="space-y-3">
              {topBooks.map((book, idx) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-gray-400">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 line-clamp-1">
                      {book.title}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 flex-shrink-0">
                    {book.soldCount || 0} bản
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      {recentOrders && recentOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Đơn hàng gần đây
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Đơn hàng
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Khách hàng
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-900">
                    Tổng tiền
                  </th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-900">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200">
                    <td className="px-4 py-2 text-blue-600">#{order.id}</td>
                    <td className="px-4 py-2 text-gray-900">
                      {order.customer_name}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatVND(order.total_amount)}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
