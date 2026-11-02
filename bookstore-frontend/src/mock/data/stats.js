import { initialOrders } from './orders';
import { initialBooks } from './books';

/**
 * Tính toán doanh thu thực tế từ các đơn hàng DELIVERED
 */
export const calculateStats = (orders = initialOrders, books = initialBooks) => {
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const completedOrders = deliveredOrders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const lowStockBooks = books.filter((b) => b.stock <= 5);

  // Doanh thu theo 30 ngày gần đây
  const revenueByDayMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    revenueByDayMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
  }

  deliveredOrders.forEach((o) => {
    const dateStr = (o.created_at || '').split('T')[0];
    if (revenueByDayMap[dateStr]) {
      revenueByDayMap[dateStr].revenue += o.total_amount || 0;
      revenueByDayMap[dateStr].orders += 1;
    }
  });

  const revenue30Days = Object.values(revenueByDayMap);

  // Top sách bán chạy
  const bookSalesMap = {};
  orders.forEach((o) => {
    if (o.status !== 'CANCELLED') {
      (o.items || []).forEach((item) => {
        bookSalesMap[item.book_id] = (bookSalesMap[item.book_id] || 0) + item.quantity;
      });
    }
  });

  const topBooks = books
    .map((b) => ({
      id: b.id,
      title: b.title,
      price: b.price,
      image: b.image,
      soldCount: bookSalesMap[b.id] || b.soldCount || 10,
    }))
    .sort((a, b) => b.soldCount - a.soldCount)
    .slice(0, 5);

  return {
    summary: {
      totalRevenue,
      monthlyRevenue: Math.round(totalRevenue * 0.45),
      totalOrders,
      completedOrders,
      pendingOrders,
      lowStockCount: lowStockBooks.length,
      averageOrderValue: completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0,
    },
    revenue30Days,
    topBooks,
    lowStockBooks: lowStockBooks.slice(0, 5),
    recentOrders: orders.slice(0, 5),
  };
};

