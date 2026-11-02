/**
 * Tất cả đường dẫn API định nghĩa tại đây
 * Kết nối trực tiếp qua API Gateway (Port 8080)
 */

export const BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '/api';

export const ENDPOINTS = {
  // ========== AUTH ==========
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/users/me',
  },

  // ========== BOOKS ==========
  BOOKS: {
    LIST: '/catalog/books',
    DETAIL: (id) => `/catalog/books/${id}`,
    SEARCH: '/catalog/books',
  },

  // ========== CATEGORIES ==========
  CATEGORIES: {
    LIST: '/catalog/categories',
    DETAIL: (id) => `/catalog/categories/${id}`,
    CREATE: '/catalog/categories',
    UPDATE: (id) => `/catalog/categories/${id}`,
    DELETE: (id) => `/catalog/categories/${id}`,
  },

  // ========== AUTHORS ==========
  AUTHORS: {
    LIST: '/catalog/authors',
    DETAIL: (id) => `/catalog/authors/${id}`,
    CREATE: '/catalog/authors',
    UPDATE: (id) => `/catalog/authors/${id}`,
    DELETE: (id) => `/catalog/authors/${id}`,
  },

  // ========== PUBLISHERS ==========
  PUBLISHERS: {
    LIST: '/catalog/publishers',
    DETAIL: (id) => `/catalog/publishers/${id}`,
    CREATE: '/catalog/publishers',
    UPDATE: (id) => `/catalog/publishers/${id}`,
    DELETE: (id) => `/catalog/publishers/${id}`,
  },

  // ========== CART ==========
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (bookId) => `/cart/items/${bookId}`,
    REMOVE_ITEM: (bookId) => `/cart/items/${bookId}`,
    CLEAR: '/cart',
  },

  // ========== ORDERS ==========
  ORDERS: {
    LIST: '/orders',
    MY: '/orders/my',
    DETAIL: (id) => `/orders/${id}`,
    CREATE: '/orders',
    CANCEL: (id) => `/orders/${id}/cancel`,
    STATUS: (id) => `/orders/${id}/status`,
    HISTORY: (id) => `/orders/${id}/status-history`,
  },

  // ========== PAYMENTS ==========
  PAYMENTS: {
    CREATE: (id) => `/orders/${id}/payments`,
    HISTORY: (id) => `/orders/${id}/payments`,
  },

  // ========== INVENTORY ==========
  INVENTORY: {
    LIST: '/inventory',
    DETAIL: (id) => `/inventory/${id}`,
    IMPORT: '/inventory/import',
    HISTORY: '/inventory/transactions',
    ADJUST: '/inventory/adjust',
  },

  // ========== USERS ==========
  USERS: {
    LIST: '/admin/users',
    DETAIL: (id) => `/admin/users/${id}`,
    CREATE: '/admin/users',
    UPDATE: (id) => `/admin/users/${id}`,
    UPDATE_ROLE: (id) => `/admin/users/${id}/role`,
    UPDATE_STATUS: (id) => `/admin/users/${id}/status`,
    DELETE: (id) => `/admin/users/${id}`,
    UPDATE_PASSWORD: '/users/change-password',
  },

  // ========== STATISTICS ==========
  STATS: {
    DASHBOARD: '/stats/dashboard',
    OVERVIEW: '/stats/overview',
    REVENUE: '/stats/revenue',
    TOP_BOOKS: '/stats/top-books',
    EXPORT: '/stats/export',
  },
  AI: {
    CHAT: '/ai/chat',
    SUGGEST_BOOKS: '/ai/recommendations',
    INTERACTIONS: '/ai/interactions',
  },
};

export default ENDPOINTS;
