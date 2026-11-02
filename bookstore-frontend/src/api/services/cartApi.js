import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
import { mapCart } from '../normalizers';

export const getCart = () => {
  return makeRequest('getCart', [], () => axiosClient.get(ENDPOINTS.CART.GET)).then(mapCart);
};

export const addToCart = (bookId, quantity = 1) => {
  return makeRequest('addItem', [bookId, quantity], () =>
    axiosClient.post(ENDPOINTS.CART.ADD_ITEM, {
      bookId,
      quantity,
    })
  ).then(mapCart);
};

export const updateCartItem = (bookId, quantity) => {
  return makeRequest('updateItem', [bookId, quantity], () =>
    axiosClient.put(ENDPOINTS.CART.UPDATE_ITEM(bookId), {
      quantity,
    })
  ).then(mapCart);
};

export const removeFromCart = (bookId) => {
  return makeRequest('removeItem', [bookId], () =>
    axiosClient.delete(ENDPOINTS.CART.REMOVE_ITEM(bookId))
  ).then(mapCart);
};

export const clearCart = () => {
  return makeRequest('clearCart', [], () =>
    axiosClient.delete(ENDPOINTS.CART.CLEAR)
  );
};
