import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  BookOpen,
  Boxes,
  ArrowRight,
  RefreshCw,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, Button, Skeleton, ErrorState, PageHeader, ChartCard, StatusBadge } from '../../components/ui';
import { statsApi, orderApi, bookApi } from '../../api/services';
import { formatPrice, formatDate } from '../../utils/formatters';

const LOW_STOCK_THRESHOLD = 5;
const REVENUE_PERIODS = [7, 14, 30];
const number = new Intl.NumberFormat('vi-VN');
const calendarDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
const formatMetric = (value, unit) => value == null ? '—' : `${number.format(value)} ${unit}`;

/**
 * DashboardPage Component
 * Admin dashboard with clean flat linear charts, real continuous timeline, and genuine metrics
 */
const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockBooks, setLowStockBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [revenuePeriod, setRevenuePeriod] = useState(14);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsResult, ordersResult, inventoryResult] = await Promise.allSettled([
        statsApi.getDashboardStats(),
        orderApi.getOrders({ limit: 5, status: 'PENDING' }),
        bookApi.getLowStockBooks({ threshold: LOW_STOCK_THRESHOLD }),
      ]);
      const statsData = statsResult.value;
      const ordersData = ordersResult.value;
      const inventoryData = inventoryResult.value;
      const unwrappedStats = statsData?.data || statsData || {};
      const lowStockList = Array.isArray(inventoryData) ? inventoryData : inventoryData?.data || [];
      const ordersList = Array.isArray(ordersData) ? ordersData : ordersData?.data || [];

      const rawTop = unwrappedStats.topProducts || unwrappedStats.topBooks || unwrappedStats.top_books || [];
      const top = rawTop.slice(0, 5);
      const missingCoverIds = top.filter(book => !book.coverUrl && !book.cover_url && !book.image)
        .map(book => book.bookId ?? book.id)
        .filter(id => Number.isSafeInteger(Number(id)) && Number(id) > 0);
      const catalogBooks = await bookApi.getBooksByIds(missingCoverIds, { includeStock: false, timeout: 3500 })
        .catch(() => []);
      const coverLookup = new Map([...lowStockList, ...catalogBooks]
        .map(book => [String(book.id), book.coverUrl || book.cover_url || book.image]));

      const enrichedTop = top.map((book) => {
        const id = String(book.bookId || book.id);
        return {
          ...book,
          id,
          title: book.title || book.name,
          coverUrl: book.coverUrl || book.cover_url || book.image || coverLookup.get(id) || null,
        };
      });

      setStats({
        ...unwrappedStats,
        topProducts: enrichedTop,
        low_stock_count: inventoryResult.status === 'fulfilled' ? lowStockList.length : null,
      });
      setRecentOrders(ordersList);
      setLowStockBooks(lowStockList);
      setLastUpdated(new Date());
      setErrors({
        stats: statsResult.status === 'rejected' ? 'Chưa tải được số liệu thống kê.' : null,
        orders: ordersResult.status === 'rejected' ? 'Chưa tải được đơn chờ xác nhận.' : null,
        inventory: inventoryResult.status === 'rejected' ? 'Chưa tải được số liệu tồn kho.' : null,
      });
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bảng điều khiển:', err);
      setErrors({ general: 'Không thể tải dữ liệu bảng điều khiển' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(fetchDashboardData);
    return () => cancelAnimationFrame(frame);
  }, [fetchDashboardData]);

  const refresh = () => {
    setLoading(true);
    fetchDashboardData();
  };

  const monthlyRevenue =
    stats?.monthly_revenue ??
    stats?.monthlyRevenue ??
    stats?.summary?.monthlyRevenue;

  const newOrdersCount =
    stats?.new_orders_count ?? stats?.newOrdersCount ?? stats?.summary?.newOrdersCount;

  const pendingOrdersCount =
    stats?.pending_orders_count ??
    stats?.pendingOrders ??
    stats?.summary?.pendingOrders;

  const lowStockCount =
    stats?.low_stock_count ??
    stats?.summary?.lowStockCount;

  const rawRevenueData =
    stats?.revenue_data ||
    stats?.revenue30Days ||
    stats?.revenueData ||
    [];

  const revenueLookup = new Map();
  rawRevenueData.forEach((item) => {
    const dStr = (item.date || '').split('T')[0];
    if (dStr) {
      revenueLookup.set(dStr, {
        revenue: Number(item.revenue ?? item.amount ?? 0),
        orders: Number(item.orders ?? 0),
      });
    }
  });

  const today = Date.parse(`${calendarDate.format(lastUpdated)}T00:00:00Z`);
  const chartData = Array.from({ length: revenuePeriod }, (_, index) => {
    const dateStr = new Date(today - (revenuePeriod - 1 - index) * 86400000).toISOString().slice(0, 10);
    const [, month, day] = dateStr.split('-');
    const matched = revenueLookup.get(dateStr) || { revenue: 0, orders: 0 };
    return {
      displayDate: `${day}/${month}`,
      fullDate: dateStr,
      revenue: matched.revenue,
      orders: matched.orders,
    };
  });
  const periodRevenue = chartData.reduce((total, day) => total + day.revenue, 0);
  const topBooks = stats?.topProducts ?? [];

  // Clean KPI Cards without hardcoded fake percentages or placeholder texts
  const kpis = [
    {
      title: 'Đơn chờ xác nhận',
      value: formatMetric(pendingOrdersCount, 'đơn'),
      icon: AlertCircle,
      to: '/admin/orders?status=PENDING',
      description: 'Xem đơn chờ xác nhận',
    },
    {
      title: 'Sách sắp hết',
      value: formatMetric(lowStockCount, 'đầu sách'),
      icon: Boxes,
      to: '/admin/inventory?lowStock=true',
      description: `Xem tồn kho ≤ ${LOW_STOCK_THRESHOLD} cuốn`,
    },
    {
      title: 'Doanh thu tháng này',
      value: monthlyRevenue == null ? '—' : formatPrice(monthlyRevenue),
      icon: TrendingUp,
      description: 'Từ các đơn đã thanh toán',
    },
    {
      title: 'Đơn tháng này',
      value: formatMetric(newOrdersCount, 'đơn'),
      icon: ShoppingCart,
      description: 'Tính từ đầu tháng',
    },
  ];

  if (errors.general) {
    return <ErrorState message={errors.general} onRetry={refresh} />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Tổng quan"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} type="rect" height="130px" />
          ))
        ) : (
          kpis.map(kpi => {
            const Icon = kpi.icon;
            const content = <>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-ink">{kpi.title}</h3>
                  <Icon size={18} className={kpi.to ? 'shrink-0 text-amber-800 dark:text-amber-300' : 'shrink-0 text-ink-muted'} aria-hidden="true" />
                </div>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums">
                    {kpi.value}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
                    {kpi.description}{kpi.to && <ArrowRight size={14} aria-hidden="true" />}
                  </p>
              </>;
            return kpi.to
              ? <Link key={kpi.title} to={kpi.to} className="block rounded-card border border-amber-200 bg-amber-50 p-4 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-warning-soft dark:hover:bg-amber-900/50">{content}</Link>
              : <Card key={kpi.title} shadow="none" className="p-4">{content}</Card>;
          })
        )}
      </div>

      {/* Charts & Top Books */}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-3">
        {/* Revenue Flat LineChart */}
        <div className="min-w-0 xl:col-span-2">
          <ChartCard
            title="Doanh thu"
            actions={<div role="group" aria-label="Khoảng ngày doanh thu" className="inline-flex rounded-lg border border-border bg-paper p-0.5">
              {REVENUE_PERIODS.map(days => <button key={days} type="button" aria-pressed={revenuePeriod === days}
                onClick={() => setRevenuePeriod(days)}
                className={`min-h-9 rounded-md px-2.5 text-xs font-semibold transition-colors ${revenuePeriod === days
                  ? 'bg-primary text-white' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'}`}>
                {days} ngày
              </button>)}
            </div>}
            loading={loading}
            error={errors.stats}
            onRetry={refresh}
          >
            <p className="text-xl font-bold tracking-tight text-ink tabular-nums">{formatPrice(periodRevenue)}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{revenuePeriod} ngày gần nhất</p>
            <div className="h-48 w-full pt-3 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 6, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(140, 140, 140, 0.15)" />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(140, 140, 140, 0.2)' }}
                    tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
                    minTickGap={24}
                  />
                  <YAxis
                    width={55}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
                    tickCount={4}
                    tickFormatter={(val) => {
                      if (val >= 1000000) return `${(val / 1000000).toLocaleString('vi-VN')} Tr`;
                      if (val >= 1000) return `${(val / 1000).toLocaleString('vi-VN')} k`;
                      return val;
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-surface dark:bg-surface border border-border p-3 rounded-card shadow-lg text-body-sm">
                          <p className="font-semibold text-ink dark:text-ink text-caption mb-1">
                            Ngày {data.displayDate} ({data.fullDate})
                          </p>
                          <p className="font-bold text-ink">
                            Doanh thu: {formatPrice(payload[0].value)}
                          </p>
                          {data.orders !== undefined && data.orders > 0 && (
                            <p className="text-caption text-ink-muted mt-0.5">
                              {data.orders} đơn hàng đã hoàn tất
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="linear"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ r: 5, fill: 'var(--color-primary)', stroke: 'var(--color-paper)', strokeWidth: 2 }}
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Top 5 Books */}
        <ChartCard
          title="Top 5 sách bán chạy"
          actions={<span className="text-xs text-ink-muted">Lũy kế</span>}
          loading={loading}
          error={errors.stats}
          onRetry={refresh}
          empty={topBooks.length === 0}
        >
          <ol className="divide-y divide-border">
            {topBooks.slice(0, 5).map((book, i) => (
              <li
                key={book.id || i}
                className="flex min-h-12 items-center gap-3 py-2"
              >
                <span
                  className="w-5 shrink-0 text-center text-xs font-semibold text-ink-muted tabular-nums"
                >
                  {i + 1}
                </span>

                {(book.coverUrl || book.cover_url || book.image) ? (
                  <img
                    src={book.coverUrl || book.cover_url || book.image}
                    alt=""
                    className="h-9 w-6 shrink-0 rounded object-contain"
                    loading="lazy"
                    onError={event => { event.currentTarget.hidden = true; }}
                  />
                ) : null}

                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-ink" title={book.title || book.name}>
                    {book.title || book.name}
                  </p>
                  <p className="text-caption text-ink-muted">
                    {number.format(book.soldCount ?? book.sold_count ?? 0)} cuốn đã bán
                  </p>
                </div>

              </li>
            ))}
          </ol>
        </ChartCard>
      </div>

      {/* Recent Orders & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card shadow="none" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-heading-md text-ink dark:text-ink">
                Đơn chờ xác nhận
              </h3>
            </div>
            <Link
              to="/admin/orders?status=PENDING"
              className="text-primary hover:text-primary-dark dark:text-primary-light text-body-sm font-semibold flex items-center gap-1 group"
            >
              <span>Xem tất cả</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <Skeleton count={5} height="56px" />
          ) : errors.orders ? (
            <ErrorState message={errors.orders} onRetry={refresh} />
          ) : recentOrders.length > 0 ? (
            <div className="space-y-2.5">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between p-3.5 bg-surface hover:bg-surface-muted dark:hover:bg-surface border border-border rounded-card transition-colors shadow-2xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-body-sm text-ink dark:text-ink">
                        Đơn #{String(order.id).slice(0, 8)}
                      </p>
                      {order.customer_name && (
                        <span className="text-caption text-ink-muted truncate hidden sm:inline">
                          • {order.customer_name}
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-ink-muted mt-0.5 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(order.created_at, 'long')}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex flex-col items-end gap-1">
                    <p className="font-bold text-body-sm text-ink dark:text-ink">
                      {formatPrice(order.total_amount || 0)}
                    </p>
                    <StatusBadge type="order" value={order.status || 'PENDING'} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-surface-muted/40 rounded-card border border-dashed border-border">
              <ShoppingCart className="w-8 h-8 mx-auto text-ink-muted mb-2 opacity-50" />
              <p className="text-body-sm font-medium text-ink-muted">Không có đơn hàng nào chờ duyệt</p>
            </div>
          )}
        </Card>

        {/* Low Stock Items */}
        <Card shadow="none" className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-heading-md text-ink dark:text-ink">
                Cảnh báo tồn kho thấp
              </h3>
              <p className="text-caption text-ink-muted">Sách sắp hết cần nhập bổ sung</p>
            </div>
            <Link
              to="/admin/inventory?lowStock=true"
              className="text-primary hover:text-primary-dark dark:text-primary-light text-body-sm font-semibold flex items-center gap-1 group"
            >
              <span>Kho hàng</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <Skeleton count={5} height="56px" />
          ) : errors.inventory ? (
            <ErrorState message={errors.inventory} onRetry={refresh} />
          ) : lowStockBooks.length > 0 ? (
            <div className="space-y-2.5">
              {lowStockBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center gap-3 p-3 bg-surface hover:bg-surface-muted dark:bg-surface-muted dark:hover:bg-surface border border-danger/25 rounded-card transition-colors shadow-2xs"
                >
                  {/* Thumbnail cover */}
                  <div className="w-10 h-14 rounded overflow-hidden bg-surface-muted flex-shrink-0 border border-border">
                    {(book.coverUrl || book.cover_url || book.image) ? (
                      <img
                        src={book.coverUrl || book.cover_url || book.image}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted bg-paper">
                        <BookOpen size={16} className="text-ink-muted" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-body-sm text-ink dark:text-ink line-clamp-1" title={book.title}>
                      {book.title}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-caption">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-badge text-caption font-bold bg-danger-soft text-danger">
                        {(book.stock_quantity ?? book.stock) === 0 ? 'Hết hàng' : `Còn ${book.stock_quantity ?? book.stock ?? '—'} cuốn`}
                      </span>
                      {book.price && (
                        <span className="text-ink-muted font-medium">
                          {formatPrice(book.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Action */}
                  <Link
                    to={`/admin/inventory`}
                    className="px-3 py-1.5 rounded-button text-caption font-bold text-primary bg-primary-light hover:bg-primary hover:text-surface transition-colors flex-shrink-0"
                  >
                    Nhập kho
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-surface-muted/40 rounded-card border border-dashed border-border">
              <Sparkles className="w-8 h-8 mx-auto text-success mb-2 opacity-70" />
              <p className="text-body-sm font-medium text-ink-muted">Tất cả sản phẩm đều đủ số lượng tồn kho</p>
            </div>
          )}
        </Card>
      </div>

      {/* Refresh & Last Updated */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-surface dark:bg-surface-muted border border-border rounded-card shadow-2xs">
        <p className="text-body-sm text-ink-muted dark:text-ink-muted flex items-center gap-2">
          <span>Thời điểm cập nhật:</span>
          <span className="font-semibold text-ink dark:text-ink">
            {lastUpdated.toLocaleTimeString('vi-VN')} - {lastUpdated.toLocaleDateString('vi-VN')}
          </span>
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Làm mới dữ liệu</span>
        </Button>
      </div>
    </div>
  );
};

export default DashboardPage;
