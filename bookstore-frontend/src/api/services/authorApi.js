import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';

export const getAuthors = (params = {}) => {
  return makeRequest('getAuthors', [params], () =>
    axiosClient.get(ENDPOINTS.AUTHORS.LIST, { params: { ...params, page: Math.max(0, (params.page ?? 1) - 1), q: params.search ?? params.q, size: params.limit ?? params.size ?? 100 } }).then(res => ({ data: (res.content ?? res).map(item => ({ ...item, biography: item.bio })), total: res.totalElements, totalPages: res.totalPages }))
  );
};

export const getAuthorDetail = (id) => {
  return makeRequest('getAuthorDetail', [id], () =>
    axiosClient.get(ENDPOINTS.AUTHORS.DETAIL(id))
  );
};

export const createAuthor = (data) => {
  return makeRequest('createAuthor', [data], () =>
    axiosClient.post(ENDPOINTS.AUTHORS.CREATE, { ...data, bio: data.bio ?? data.biography })
  );
};

export const updateAuthor = (id, data) => {
  return makeRequest('updateAuthor', [id, data], () =>
    axiosClient.put(ENDPOINTS.AUTHORS.UPDATE(id), { ...data, bio: data.bio ?? data.biography })
  );
};

export const deleteAuthor = (id) => {
  return makeRequest('deleteAuthor', [id], () =>
    axiosClient.delete(ENDPOINTS.AUTHORS.DELETE(id))
  );
};
