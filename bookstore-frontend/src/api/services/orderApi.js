import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
import { mapOrder } from '../normalizers';

const listOrders = (endpoint, params) => makeRequest('getOrders', [params], () =>
  axiosClient.get(endpoint, { params: params.status && params.status !== 'all' ? { status: params.status.toUpperCase() } : {} })
).then((res) => {
  let orders = (Array.isArray(res) ? res : res.data ?? []).map(mapOrder);
  if (params.status && params.status !== 'all') orders = orders.filter(o => o.status === params.status.toUpperCase());
  if (params.search) orders = orders.filter(o => `${o.id} ${o.user_id}`.includes(params.search));
  return params.limit ? orders.slice(0, params.limit) : orders;
});
export const getOrders = (params = {}) => listOrders(ENDPOINTS.ORDERS.LIST, params);
export const getMyOrders = (params = {}) => listOrders(ENDPOINTS.ORDERS.MY, params);
export const getOrderDetail = (id) => makeRequest('getOrderDetail', [id], () =>
  axiosClient.get(ENDPOINTS.ORDERS.DETAIL(id))
).then(res => mapOrder(res.data ?? res));
export const createOrder = (data) => makeRequest('createOrder', [data], () =>
  axiosClient.post(ENDPOINTS.ORDERS.CREATE, {
    shippingAddress: data.shippingAddress ?? data.shipping_address,
    paymentMethod: data.paymentMethod ?? data.payment_method,
    customerName: data.customerName ?? data.customer_name,
    customerPhone: data.customerPhone ?? data.customer_phone,
    note: data.note,
  })
).then(res => mapOrder(res.data ?? res));
export const cancelOrder = (id, data = {}) => makeRequest('cancelOrder', [id, data.reason], () =>
  axiosClient.post(ENDPOINTS.ORDERS.CANCEL(id))
).then(mapOrder);
export const updateOrderStatus = (id, data) => makeRequest(
  'updateOrderStatus', [id, data?.status ?? data, data?.note ?? data?.notes], () =>
    axiosClient.patch(ENDPOINTS.ORDERS.STATUS(id), { status: data?.status ?? data })
).then(mapOrder);
export const confirmOrder = (id) => updateOrderStatus(id, { status: 'CONFIRMED' });
export const getOrderStatusHistory = (id) => makeRequest('getOrderDetail', [id], () =>
  axiosClient.get(ENDPOINTS.ORDERS.HISTORY(id))
).then(res => ({ data: Array.isArray(res) ? res : res.status_history ?? [] }));
