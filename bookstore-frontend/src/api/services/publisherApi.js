import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';

export const getPublishers = (params = {}) => {
  return makeRequest('getPublishers', [params], () =>
    axiosClient.get(ENDPOINTS.PUBLISHERS.LIST, { params: { ...params, page: Math.max(0, (params.page ?? 1) - 1), q: params.search ?? params.q, size: params.limit ?? params.size ?? 100 } }).then(res => ({ data: (res.content ?? res).map(item => ({ ...item, biography: item.bio })), total: res.totalElements, totalPages: res.totalPages }))
  );
};

export const getPublisherDetail = (id) => {
  return makeRequest('getPublisherDetail', [id], () =>
    axiosClient.get(ENDPOINTS.PUBLISHERS.DETAIL(id))
  );
};

export const createPublisher = (data) => {
  return makeRequest('createPublisher', [data], () =>
    axiosClient.post(ENDPOINTS.PUBLISHERS.CREATE, data)
  );
};

export const updatePublisher = (id, data) => {
  return makeRequest('updatePublisher', [id, data], () =>
    axiosClient.put(ENDPOINTS.PUBLISHERS.UPDATE(id), data)
  );
};

export const deletePublisher = (id) => {
  return makeRequest('deletePublisher', [id], () =>
    axiosClient.delete(ENDPOINTS.PUBLISHERS.DELETE(id))
  );
};
