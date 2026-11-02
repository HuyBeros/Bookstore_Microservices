// Browser regression harness for the real auth forms/providers with the existing
// mock auth adapter. Omits unrelated catalog/cart APIs that require a real JWT.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ToastProvider } from '../src/context/ToastContext';
import { ToastContainer } from '../src/components/common/Toast';
import AuthLayout from '../src/layouts/AuthLayout';
import LoginPage from '../src/pages/auth/LoginPage';
import RegisterPage from '../src/pages/auth/RegisterPage';
import '../src/index.css';

export function Landing() {
  const { user, logout } = useAuth();
  return <main className="mx-auto max-w-xl space-y-5 p-8">
    <h1>Đăng nhập đã hoàn tất</h1>
    <p>Vai trò: {user?.role}</p>
    <button type="button" onClick={logout}>Đăng xuất</button>
    <Link to="/login">Về đăng nhập</Link>
  </main>;
}

export function AuthRoutesUnderTest() {
  const { loading } = useAuth();
  // This catches the regression where submit switched global loading and
  // unmounted the form, losing both its input values and failure notice.
  if (loading) return <p>Đang khôi phục phiên…</p>;
  return <Routes>
    <Route element={<AuthLayout />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
    <Route path="/" element={<Landing />} />
    <Route path="/admin" element={<Landing />} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>;
}

if (import.meta.env.VITE_USE_MOCK !== 'true') {
  createRoot(document.getElementById('root')).render(<p>Harness chỉ chạy với VITE_USE_MOCK=true; không gọi API thật.</p>);
} else {
  createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><AuthProvider><ToastProvider>
    <AuthRoutesUnderTest /><ToastContainer />
  </ToastProvider></AuthProvider></BrowserRouter></StrictMode>);
}
