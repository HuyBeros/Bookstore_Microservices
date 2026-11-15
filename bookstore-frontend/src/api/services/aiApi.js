import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
import { getDashboardStats } from './statsApi';
import { getLowStockBooks } from './bookApi';

const STOCK_THRESHOLD = 5;

export async function getAdminBriefing(signal) {
  try {
    const result = await axiosClient.post(ENDPOINTS.AI.ADMIN_BRIEFING, undefined, { signal, timeout: 22000 });
    if (Array.isArray(result?.lowStockBooks) && Number.isFinite(Date.parse(result.checkedAt))
      && (result.pendingOrders != null || result.lowStockCount != null)) return result;
  } catch (error) {
    if (signal?.aborted || ![0, 404, 405, 408, 500, 501, 502, 503, 504].includes(error?.status)) throw error;
  }

  const [orders, stock] = await Promise.allSettled([
    getDashboardStats({ signal }),
    getLowStockBooks({ threshold: STOCK_THRESHOLD }, { signal }),
  ]);
  if (signal?.aborted) throw signal.reason;
  for (const source of [orders, stock]) {
    if (source.status === 'rejected' && [401, 403].includes(source.reason?.status)) throw source.reason;
  }
  const stats = orders.value?.data ?? orders.value;
  const pending = stats?.pending_orders_count ?? stats?.pendingOrders ?? stats?.summary?.pendingOrders;
  const pendingOrders = Number.isSafeInteger(pending) && pending >= 0 ? pending : null;
  const books = stock.value?.data ?? stock.value;
  const lowStockCount = Array.isArray(books) ? books.length : null;
  if (pendingOrders == null && lowStockCount == null) throw new Error('Briefing data unavailable');
  const lowStockBooks = (Array.isArray(books) ? books : [])
    .map(book => ({ bookId: book.id, title: book.title, quantity: book.stock_quantity ?? book.stock }))
    .filter(book => Number.isInteger(book.quantity) && book.quantity >= 0)
    .sort((left, right) => left.quantity - right.quantity)
    .slice(0, 5);
  return {
    checkedAt: new Date().toISOString(), pendingOrders, lowStockCount, lowStockBooks,
    stockThreshold: STOCK_THRESHOLD, priority: pendingOrders > 0 ? 'ORDERS' : lowStockCount > 0 ? 'STOCK' : 'NONE',
    aiAssisted: false,
  };
}
export const chatWithAI = (data) => makeRequest('chatWithAI', [data], () => axiosClient.post(ENDPOINTS.AI.CHAT, data, { timeout: 45000 }));
export const sendChatMessage = chatWithAI;
export const suggestBooks = (params = {}) => makeRequest('suggestBooks', [params], () =>
  axiosClient.post(ENDPOINTS.AI.SUGGEST_BOOKS, { message: params.message ?? 'Gợi ý sách cho tôi', ...params }, { timeout: 45000 }));
export const getSuggestedBooks = suggestBooks;
export const recordInteraction = (bookId, type = 'VIEW') => axiosClient.post(ENDPOINTS.AI.INTERACTIONS, { bookId, type });
