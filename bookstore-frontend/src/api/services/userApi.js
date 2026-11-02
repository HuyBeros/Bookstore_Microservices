import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
import { mapUser } from '../normalizers';
export { changePassword, updateProfile as updateUserProfile } from './authApi';
export const getUsers = (params = {}) => makeRequest('getUsers', [params], () =>
  axiosClient.get(ENDPOINTS.USERS.LIST, { params: {
    pageNo: Math.max(0, (params.page ?? 1) - 1), pageSize: params.limit ?? params.size ?? 50,
    keyword: params.search ?? params.keyword ?? params.q, role: params.role, status: params.status,
  } })
).then(res => ({ data: (res.items ?? res.data ?? res).map(mapUser), total: res.totalElements ?? res.total, totalPages: res.totalPages }));
export const getUserDetail = (id) => makeRequest('getUsers', [], () => axiosClient.get(ENDPOINTS.USERS.DETAIL(id)))
  .then(res => mapUser(Array.isArray(res.data) ? res.data.find(u => String(u.id) === String(id)) : res));
export const updateUserRole = (id, data) => makeRequest('updateUserRole', [id, data?.role ?? data], () =>
  axiosClient.patch(ENDPOINTS.USERS.UPDATE_ROLE(id), { role: data?.role ?? data })).then(mapUser);
export const updateUserStatus = (id, data) => makeRequest('updateUserStatus', [id, data?.status ?? data], () =>
  axiosClient.patch(ENDPOINTS.USERS.UPDATE_STATUS(id), { status: data?.status ?? data })).then(mapUser);
export const deleteUser = (id) => updateUserStatus(id, 'LOCKED');
