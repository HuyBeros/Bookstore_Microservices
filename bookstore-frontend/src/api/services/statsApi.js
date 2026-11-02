import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
export const getDashboardStats = () => makeRequest('getDashboardStats', [], () => axiosClient.get(ENDPOINTS.STATS.DASHBOARD));
export const getStats = () => makeRequest('getStats', [], () => axiosClient.get(ENDPOINTS.STATS.OVERVIEW));
export const getRevenue = () => getStats().then(res => ({ data: (res.data ?? res).revenueData ?? [] }));
export const getTopBooks = () => getStats().then(res => ({ data: (res.data ?? res).topProducts ?? [] }));
export const exportStats = async () => {
  const result = await getStats();
  const stats = result.data ?? result;
  return new Blob([`date,amount\n${(stats.revenueData ?? []).map(day => `${day.date},${day.amount}`).join('\n')}`], { type: 'text/csv;charset=utf-8' });
};
