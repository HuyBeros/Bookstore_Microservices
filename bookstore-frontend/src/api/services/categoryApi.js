import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';

export const getCategories = (params = {}) => {
  return makeRequest('getCategories', [params], async () => {
    const res = await axiosClient.get(ENDPOINTS.CATEGORIES.LIST, { params: { ...params, page: Math.max(0, (params.page ?? 1) - 1), size: params.limit ?? params.size ?? 20 } });
    const list = res?.content || res?.data || res;
    if (Array.isArray(list)) {
      return { data: list, total: res?.totalElements ?? list.length, totalPages: res?.totalPages ?? 1 };
    }
    return res;
  });
};

export const getCategoryDetail = (id) => {
  return makeRequest('getCategoryDetail', [id], () =>
    axiosClient.get(ENDPOINTS.CATEGORIES.DETAIL(id))
  );
};

export const createCategory = (data) => {
  return makeRequest('createCategory', [data], () =>
    axiosClient.post(ENDPOINTS.CATEGORIES.CREATE, data)
  );
};

export const updateCategory = (id, data) => {
  return makeRequest('updateCategory', [id, data], () =>
    axiosClient.put(ENDPOINTS.CATEGORIES.UPDATE(id), data)
  );
};

export const deleteCategory = (id) => {
  return makeRequest('deleteCategory', [id], () =>
    axiosClient.delete(ENDPOINTS.CATEGORIES.DELETE(id))
  );
};
