import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
export const createPayment = (data) => axiosClient.post(
  ENDPOINTS.PAYMENTS.CREATE(data.orderId ?? data.order_id), { method: data.method ?? data.payment_method });
export const getPaymentHistory = (orderId) => axiosClient.get(ENDPOINTS.PAYMENTS.HISTORY(orderId));
