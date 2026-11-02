import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useFetch } from '../../hooks/useFetch';
import { getStats } from '../../api/services/statsApi';
import { formatPrice, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { PageHeader, Card } from '../../components/ui';
import { Download } from 'lucide-react';

const STATUS_COLORS = {
  'Chờ xác nhận': '#f59e0b',
  'Đã xác nhận': '#0284c7',
  'Đang chuẩn bị': '#6366f1',
  'Đang giao': '#3b82f6',
  'Đã hoàn thành': '#10b981',
  'Đã hủy': '#ef4444',
  'Đã trả hàng': '#8b5cf6',
};

const VI_STATUS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã trả hàng',
};

const DEFAULT_PIE_COLORS = ['#f59e0b', '#0284c7', '#10b981', '#ef4444', '#8b5cf6'];

const StatisticsPage = () => {
  const { data: stats, loading, error, refetch } = useFetch(
    async () => {
      const res = await getStats();
      return res.data || res || {};
    },
    []
  );

  const handleExport = async () => {
    try {
      const csv =
        'data:text/csv;charset=utf-8,' +
        encodeURIComponent(
          'Báo cáo thống kê hoạt động kinh doanh Phương Anh\n' +
            `Tổng doanh thu,${stats?.totalRevenue || 0}\n` +
            `Tổng đơn hàng,${stats?.totalOrders || 0}\n` +
            `Tổng sản phẩm bán,${stats?.totalProductsSold || 0}\n`
        );
      const link = document.createElement('a');
      link.setAttribute('href', csv);
      link.setAttribute('download', `bao-cao-thong-ke-${new Date().toISOString().slice(0, 10)}.csv`);
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  // Prepare Pie Chart data with Vietnamese labels (only active statuses)
  const pieData = (stats?.ordersData || [])
    .filter((item) => Number(item.count) > 0)
    .map((item) => {
      const viLabel = VI_STATUS[item.status] || item.status;
      return {
        ...item,
        label: viLabel,
        color: STATUS_COLORS[viLabel] || '#6b7280',
      };
    });

  // Prepare continuous line chart data for last 14 days
  const rawRevenue = stats?.revenueData || stats?.revenue_data || [];
  const revenueLookup = new Map();
  rawRevenue.forEach((item) => {
    const dStr = (item.date || '').split('T')[0];
    if (dStr) {
      revenueLookup.set(dStr, Number(item.amount ?? item.revenue ?? 0));
    }
  });

  const continuousRevenue = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    continuousRevenue.push({
      date: `${dayStr}/${monthStr}`,
      fullDate: dateStr,
      amount: revenueLookup.get(dateStr) || 0,
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Báo cáo thống kê"
        subtitle="Phân tích tăng trưởng doanh thu và phân bổ đơn hàng"
        actions={
          <Button
            variant="secondary"
            size="md"
            onClick={handleExport}
            icon={<Download size={16} />}
          >
            Xuất file CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5 space-y-1.5 shadow-2xs">
          <p className="text-caption font-semibold text-ink-muted uppercase">Tổng doanh thu lũy kế</p>
          <p className="text-display-sm font-bold text-ink dark:text-ink">
            {formatPrice(stats?.totalRevenue || 0)}
          </p>
        </Card>

        <Card className="p-5 space-y-1.5 shadow-2xs">
          <p className="text-caption font-semibold text-ink-muted uppercase">Tổng đơn hàng</p>
          <p className="text-display-sm font-bold text-ink dark:text-ink">
            {(stats?.totalOrders || 0).toLocaleString('vi-VN')}
          </p>
        </Card>

        <Card className="p-5 space-y-1.5 shadow-2xs">
          <p className="text-caption font-semibold text-ink-muted uppercase">Số sách đã giao</p>
          <p className="text-display-sm font-bold text-ink dark:text-ink">
            {(stats?.totalProductsSold || 0).toLocaleString('vi-VN')} cuốn
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6">
          <h2 className="text-heading-md font-bold text-ink dark:text-ink mb-4">
            Doanh thu 14 ngày gần nhất
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={continuousRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(140, 140, 140, 0.15)" />
                <XAxis dataKey="date" tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis
                  width={80}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#71717a', fontSize: 12 }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toLocaleString('vi-VN')} Tr`;
                    if (val >= 1000) return `${(val / 1000).toLocaleString('vi-VN')} k`;
                    return Number(val).toLocaleString('vi-VN');
                  }}
                />
                <Tooltip
                  formatter={(v) => [formatPrice(v), 'Doanh thu']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `Ngày ${item.date} (${item.fullDate})` : label;
                  }}
                />
                <Legend />
                <Line
                  type="linear"
                  dataKey="amount"
                  stroke="#c2410c"
                  strokeWidth={2.2}
                  dot={{ r: 3.5, fill: '#c2410c', stroke: '#fff', strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, fill: '#c2410c', stroke: '#fff', strokeWidth: 2 }}
                  name="Doanh thu"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Orders Status Pie Chart */}
        <Card className="p-6">
          <h2 className="text-heading-md font-bold text-ink dark:text-ink mb-4">
            Phân bổ đơn hàng theo trạng thái
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={78}
                  innerRadius={36}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name.length > 10 ? name.split(' ')[0] : name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || DEFAULT_PIE_COLORS[index % DEFAULT_PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} đơn`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;
