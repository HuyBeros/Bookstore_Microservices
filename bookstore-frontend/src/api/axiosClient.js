import axios from 'axios';
import { BASE_URL, ENDPOINTS } from './endpoints';

const axiosClient = axios.create({
  baseURL: BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== REQUEST INTERCEPTOR ==========
axiosClient.interceptors.request.use(
  (config) => {
    // Gắn token vào header nếu có
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error)
);

// ========== RESPONSE INTERCEPTOR ==========
axiosClient.interceptors.response.use(
  (response) => {
    // Trả về data trực tiếp thay vì toàn bộ response
    const body = response.data;
    return body && typeof body.success === 'boolean' && 'data' in body ? body.data : body;
  },
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    // Chuẩn hóa lỗi thành { status, message }
    let errorResponse = {
      status: error.response?.status || 500,
      message: 'Có lỗi xảy ra',
    };

    console.error('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (error.response?.data?.message) {
      // Lỗi từ backend
      errorResponse.message = error.response.data.message;
      errorResponse.data = error.response.data;
    } else if (error.code === 'ECONNABORTED') {
      // Timeout
      errorResponse.message = 'Máy chủ phản hồi quá lâu';
      errorResponse.status = 408;
    } else if (!error.response) {
      // Mất mạng
      errorResponse.message = 'Không thể kết nối máy chủ';
      errorResponse.status = 0;
    }

    // Xử lý 401 - token hết hạn
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Chuyển về login kèm redirect (trừ khi đang gọi API login)
      if (!error.config?.url?.includes(ENDPOINTS.AUTH.LOGIN)) {
        const redirectUrl = window.location.pathname + window.location.search;
        if (!redirectUrl.includes('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
        }
      }
    }

    // Xử lý 403 - phát sự kiện để hiện Toast
    if (error.response?.status === 403) {
      const event = new CustomEvent('showForbiddenToast', {
        detail: { message: 'Bạn không có quyền thực hiện thao tác này' },
      });
      window.dispatchEvent(event);
    }

    return Promise.reject(errorResponse);
  }
);

export default axiosClient;
