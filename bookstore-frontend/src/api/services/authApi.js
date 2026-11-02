import axiosClient from '../axiosClient';
import { ENDPOINTS } from '../endpoints';
import { makeRequest } from '../request';
import { mapUser } from '../normalizers';
export const login = (username, password) => makeRequest('login', [username, password], () =>
  axiosClient.post(ENDPOINTS.AUTH.LOGIN, { usernameOrEmail: username, password }));
export const register = (data) => makeRequest('register', [data], () =>
  axiosClient.post(ENDPOINTS.AUTH.REGISTER, { ...data, fullName: data.fullName ?? data.full_name }));
export const getMe = () => makeRequest('getMe', [], () => axiosClient.get(ENDPOINTS.AUTH.ME))
  .then(res => mapUser(res.data ?? res));
export const changePassword = (data) => makeRequest('changePassword', [data], () =>
  axiosClient.put(ENDPOINTS.USERS.UPDATE_PASSWORD, {
    oldPassword: data.oldPassword ?? data.currentPassword ?? data.current_password,
    newPassword: data.newPassword ?? data.new_password,
  }));
export const updateProfile = (data) => makeRequest('updateProfile', [data], () =>
  axiosClient.put('/users/profile', { ...data, fullName: data.fullName ?? data.full_name }))
  .then(res => mapUser(res.data ?? res));
export const logout = () => {
  const token = localStorage.getItem('accessToken') ?? localStorage.getItem('token');
  return makeRequest('logout', [], () => axiosClient.post('/auth/logout', null, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }));
};
