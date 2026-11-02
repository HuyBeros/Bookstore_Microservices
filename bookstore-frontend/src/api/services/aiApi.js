import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
export const chatWithAI = (data) => makeRequest('chatWithAI', [data], () => axiosClient.post(ENDPOINTS.AI.CHAT, data, { timeout: 45000 }));
export const sendChatMessage = chatWithAI;
export const suggestBooks = (params = {}) => makeRequest('suggestBooks', [params], () =>
  axiosClient.post(ENDPOINTS.AI.SUGGEST_BOOKS, { message: params.message ?? 'Gợi ý sách cho tôi', ...params }, { timeout: 45000 }));
export const getSuggestedBooks = suggestBooks;
export const recordInteraction = (bookId, type = 'VIEW') => axiosClient.post(ENDPOINTS.AI.INTERACTIONS, { bookId, type });
