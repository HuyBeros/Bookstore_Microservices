import { mockApi } from '../mock/mockApi';

/**
 * Kiểm tra xem chế độ mock data có đang được kích hoạt hay không
 * Mặc định: TẮT (gọi API backend thực qua Gateway)
 */
export const isMockEnabled = () => {
  // Nếu .env cấu hình rõ false thì ưu tiên tắt mock hoàn toàn
  if (import.meta.env.VITE_USE_MOCK === 'false') {
    return false;
  }
  const localSetting = localStorage.getItem('VITE_USE_MOCK');
  if (localSetting !== null) {
    return localSetting === 'true';
  }
  return import.meta.env.VITE_USE_MOCK === 'true';
};

/**
 * Hàm điều hướng trung tâm: Tự động chuyển đổi giữa mockApi và axiosClient thật
 * @param {string} mockMethod - Tên phương thức trong mockApi
 * @param {Array} mockArgs - Danh sách đối số truyền vào hàm mock
 * @param {Function} realCall - Hàm gọi axiosClient thật
 */
export async function makeRequest(mockMethod, mockArgs = [], realCall = () => { }) {
  if (isMockEnabled() && typeof mockApi[mockMethod] === 'function') {
    return mockApi[mockMethod](...mockArgs);
  }
  return realCall();
}

export default makeRequest;
