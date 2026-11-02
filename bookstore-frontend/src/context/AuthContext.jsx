import { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from '../api/services/authApi';

const AuthContext = createContext(null);

/**
 * AuthProvider: quản lý trạng thái xác thực
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || localStorage.getItem('accessToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Khởi tạo: lấy ME nếu có token
  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (!active) return;
        const payload = res?.data || res;
        const rawUser = payload?.user || payload;
        const userData = {
          ...rawUser,
          id: rawUser.userId || rawUser.id,
          user_id: rawUser.userId || rawUser.user_id || rawUser.id,
          username: rawUser.username,
          role: rawUser.role,
          full_name: rawUser.fullName || rawUser.full_name,
          email: rawUser.email,
        };
        setUser(userData);
        setError(null);
      } catch (err) {
        if (!active) return;
        // Token không hợp lệ
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        setToken(null);
        setUser(null);
        setError(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initAuth();
    return () => { active = false; };
  }, [token]);

  // Đăng nhập
  const login = async (username, password) => {
    try {
      const res = await authApi.login(username, password);
      const payload = res?.data || res;
      const newToken = payload?.accessToken || payload?.token;
      if (!newToken) throw new Error('Máy chủ chưa trả về phiên đăng nhập. Vui lòng thử lại.');
      const rawUser = payload?.user || payload;
      const userData = {
        ...rawUser,
        id: rawUser.userId || rawUser.id,
        user_id: rawUser.userId || rawUser.user_id || rawUser.id,
        username: rawUser.username,
        role: rawUser.role,
        full_name: rawUser.fullName || rawUser.full_name,
        email: rawUser.email,
      };

      if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
      if (newToken) {
        localStorage.setItem('token', newToken);
        localStorage.setItem('accessToken', newToken);
        setToken(newToken);
      }
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', String(userData.id));
      setUser(userData);
      setError(null);

      return userData;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Đăng xuất
  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
    setError(null);
  };

  // Đăng ký
  const register = async (data) => {
    try {
      const result = await authApi.register(data);
      setError(null);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  // Cập nhật hồ sơ
  const updateProfile = async (data) => {
    const result = await authApi.updateProfile(data);
    setUser(prev => ({ ...prev, ...result }));
    return result;
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!token,
    userRole: user?.role,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook: useAuth
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
};
