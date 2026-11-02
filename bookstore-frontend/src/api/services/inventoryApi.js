import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
export const getInventory = (params = {}) => makeRequest('getInventory', [params], () =>
  axiosClient.get(ENDPOINTS.INVENTORY.LIST, { params }));
export const importInventory = (data) => makeRequest('importStock', [data], () =>
  axiosClient.post(ENDPOINTS.INVENTORY.IMPORT, { ...data, bookId: data.bookId ?? data.book_id }));
export const importStock = importInventory;
export const getInventoryHistory = (params = {}) => makeRequest('getInventoryHistory', [params], () =>
  axiosClient.get(ENDPOINTS.INVENTORY.HISTORY, { params: { bookId: params.bookId ?? params.book_id } }));
export const adjustInventory = (data) => makeRequest('adjustInventory', [data], () =>
  axiosClient.post(ENDPOINTS.INVENTORY.ADJUST, {
    bookId: data.bookId ?? data.book_id, newQuantity: Number(data.newQuantity ?? data.new_quantity), note: data.note,
  }));
