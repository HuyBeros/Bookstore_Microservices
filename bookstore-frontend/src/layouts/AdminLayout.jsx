import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import RouteLoadingFallback from '../components/system/RouteLoadingFallback';
import {
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  PenTool,
  Building2,
  Boxes,
  ShoppingCart,
  Users,
  ShieldCheck,
  TrendingUp,
  LogOut,
  ExternalLink,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { ErrorBoundary, IconButton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks';

/**
 * AdminLayout: Admin Dashboard Layout
 * Responsive desktop/tablet/mobile with dark mode support
 */
const AdminLayout = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useDarkMode();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Close mobile sidebar on route change
    setMobileSidebarOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAdmin = user?.role === 'ADMIN';

  const menuItems = [
    { label: 'Tổng quan', to: '/admin', icon: LayoutDashboard },
    { label: 'Quản lý sách', to: '/admin/books', icon: BookOpen },
    isAdmin && { label: 'Thể loại sách', to: '/admin/categories', icon: FolderOpen },
    isAdmin && { label: 'Tác giả', to: '/admin/authors', icon: PenTool },
    isAdmin && { label: 'Nhà xuất bản', to: '/admin/publishers', icon: Building2 },
    { label: 'Kho hàng', to: '/admin/inventory', icon: Boxes },
    { label: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart },
    isAdmin && { label: 'Khách hàng', to: '/admin/customers', icon: Users },
    isAdmin && { label: 'Tài khoản & Phân quyền', to: '/admin/users', icon: ShieldCheck },
    isAdmin && { label: 'Báo cáo thống kê', to: '/admin/statistics', icon: TrendingUp },
  ].filter(Boolean);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-paper dark:bg-paper flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-ink dark:bg-ink text-surface dark:text-surface border-r border-border dark:border-border flex-shrink-0 h-screen sticky top-0 z-30">
          {/* Brand */}
          <div className="flex items-center justify-between p-4 border-b border-border dark:border-border h-16">
            <Link to="/admin" className="flex items-center gap-2.5 font-bold text-sm text-surface dark:text-surface">
              <div className="w-8 h-8 rounded-card bg-primary flex items-center justify-center font-bold text-surface dark:text-surface shadow">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-playfair font-bold text-base">Phương Anh</span>
                <span className="text-label text-primary dark:text-primary-light uppercase font-bold">Admin</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.to);

              return (
                <Link
                  key={idx}
                  to={item.to}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-button font-medium text-body-sm transition-smooth ${
                    isActive
                      ? 'bg-primary text-surface dark:bg-primary-light dark:text-ink font-semibold'
                      : 'text-ink-muted hover:bg-surface-muted hover:text-ink dark:text-ink-muted dark:hover:bg-surface dark:hover:text-surface'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} />}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-3 border-t border-border dark:border-border space-y-2">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 text-body-sm font-semibold rounded-button text-ink-muted hover:text-ink hover:bg-surface-muted transition dark:text-ink-muted dark:hover:text-surface dark:hover:bg-surface"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} />
                Xem cửa hàng
              </span>
              <span className="text-label bg-surface-muted dark:bg-surface px-1.5 py-0.5 rounded text-ink-muted dark:text-ink-muted">
                Trực tiếp
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-body-sm font-semibold rounded-button text-danger hover:bg-danger-soft transition"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileSidebarOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-72 max-w-xs bg-ink text-surface dark:bg-ink dark:text-surface h-full flex flex-col z-10 shadow-lg animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-border h-16">
                <div className="flex items-center gap-2 font-bold text-surface dark:text-surface">
                  <div className="w-8 h-8 rounded-card bg-primary flex items-center justify-center font-bold">
                    P
                  </div>
                  <span className="font-playfair font-bold text-base">Phương Anh Admin</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 text-ink-muted hover:text-surface rounded-button hover:bg-surface-muted"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
                {menuItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive =
                    item.to === '/admin'
                      ? location.pathname === '/admin'
                      : location.pathname.startsWith(item.to);

                  return (
                    <Link
                      key={idx}
                      to={item.to}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-button font-medium text-body-sm transition-smooth ${
                        isActive
                          ? 'bg-primary text-surface dark:bg-primary-light dark:text-ink font-semibold'
                          : 'text-ink-muted hover:bg-surface-muted dark:text-ink-muted dark:hover:bg-surface'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-border space-y-2">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-body-sm text-primary dark:text-primary-light font-semibold"
                >
                  <ExternalLink size={14} />
                  Xem cửa hàng
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-body-sm font-semibold rounded-button text-danger hover:bg-danger-soft"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="bg-surface dark:bg-surface-muted border-b border-border dark:border-border sticky top-0 z-20 h-16 flex items-center px-4 sm:px-6 lg:px-8 shadow-sm">
            <div className="flex items-center justify-between w-full">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-2 text-ink-muted dark:text-ink-muted hover:bg-surface-muted dark:hover:bg-surface rounded-button"
                aria-label="Mở menu điều hướng"
              >
                <Menu size={22} />
              </button>

              <h2 className="hidden sm:block text-body-md font-bold text-ink dark:text-ink">
                Hệ thống quản trị Nhà sách Phương Anh
              </h2>

              {/* Right Actions */}
              <div className="flex items-center gap-3 ml-auto">
                {/* Dark Mode Toggle */}
                <IconButton
                  icon={isDark ? Sun : Moon}
                  onClick={toggleDarkMode}
                  variant="ghost"
                  aria-label={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
                />

                {/* User Profile */}
                <div className="text-right hidden sm:block">
                  <p className="text-body-sm font-bold text-ink dark:text-ink leading-tight">
                    {user?.full_name || 'Quản trị viên'}
                  </p>
                  <p className="text-caption text-ink-muted leading-tight">
                    {user?.role === 'ADMIN' ? 'Toàn quyền quản trị' : 'Nhân viên'}
                  </p>
                </div>

                <div className="w-9 h-9 rounded-full bg-primary text-surface flex items-center justify-center font-bold text-body-sm shadow-sm">
                  P
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
            <Suspense fallback={<RouteLoadingFallback isAdmin={true} />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminLayout;
