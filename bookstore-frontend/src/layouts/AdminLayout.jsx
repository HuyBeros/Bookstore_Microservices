import { useState, useEffect, Suspense } from 'react';
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
import AdminBriefing from '../components/features/AdminBriefing/AdminBriefing';

const navigation = [
  { label: 'Vận hành', items: [
    { label: 'Tổng quan', to: '/admin', icon: LayoutDashboard },
    { label: 'Đơn hàng', to: '/admin/orders', icon: ShoppingCart },
    { label: 'Kho hàng', to: '/admin/inventory', icon: Boxes },
    { label: 'Báo cáo thống kê', to: '/admin/statistics', icon: TrendingUp, admin: true },
  ] },
  { label: 'Danh mục', items: [
    { label: 'Quản lý sách', to: '/admin/books', icon: BookOpen },
    { label: 'Thể loại sách', to: '/admin/categories', icon: FolderOpen, admin: true },
    { label: 'Tác giả', to: '/admin/authors', icon: PenTool, admin: true },
    { label: 'Nhà xuất bản', to: '/admin/publishers', icon: Building2, admin: true },
  ] },
  { label: 'Quản trị', items: [
    { label: 'Khách hàng', to: '/admin/customers', icon: Users, admin: true },
    { label: 'Tài khoản & Phân quyền', to: '/admin/users', icon: ShieldCheck, admin: true },
  ] },
];

function AdminNavigation({ pathname, isAdmin, onNavigate }) {
  return <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
    {navigation.map(group => {
      const items = group.items.filter(item => isAdmin || !item.admin);
      if (!items.length) return null;
      return <div key={group.label}>
        <p className="mb-1 px-3 text-xs font-semibold text-slate-400">{group.label}</p>
        <ul className="space-y-0.5">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== '/admin' && pathname.startsWith(to + '/'));
            return <li key={to}>
              <Link to={to} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-white ${active
                  ? 'bg-[#973d25] text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={17} className="shrink-0" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="shrink-0" aria-hidden="true" />}
              </Link>
            </li>;
          })}
        </ul>
      </div>;
    })}
  </nav>;
}

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
  const [sidebarPath, setSidebarPath] = useState(location.pathname);

  if (sidebarPath !== location.pathname) {
    setSidebarPath(location.pathname);
    setMobileSidebarOpen(false);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#faf7f2] dark:bg-paper flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden h-dvh w-60 shrink-0 flex-col bg-[#141d2a] text-white md:sticky md:top-0 md:z-30 md:flex">
          {/* Brand */}
          <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
            <Link to="/admin" className="flex items-center gap-2.5 font-bold text-sm text-white">
              <div className="grid size-8 place-items-center rounded-lg bg-[#973d25] font-bold text-white">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-playfair font-bold text-base">Phương Anh</span>
                <span className="text-xs text-slate-300">Quản trị nhà sách</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <AdminNavigation pathname={location.pathname} isAdmin={isAdmin} />

          {/* Footer Actions */}
          <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <ExternalLink size={14} />
                Xem cửa hàng
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-300 hover:bg-white/10"
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
            <div className="relative z-10 flex h-full w-72 max-w-xs flex-col bg-[#141d2a] text-white shadow-lg animate-slide-up">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
                <div className="flex items-center gap-2 font-bold text-white">
                  <div className="grid size-8 place-items-center rounded-lg bg-[#973d25] font-bold text-white">
                    P
                  </div>
                  <span className="font-playfair font-bold text-base">Phương Anh Admin</span>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Đóng điều hướng"
                  className="grid size-10 place-items-center rounded-lg text-slate-200 hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              <AdminNavigation pathname={location.pathname} isAdmin={isAdmin} onNavigate={() => setMobileSidebarOpen(false)} />

              <div className="shrink-0 space-y-1 border-t border-white/10 p-3">
                <Link
                  to="/"
                  className="flex items-center gap-2 text-body-sm text-primary dark:text-primary-light font-semibold"
                >
                  <ExternalLink size={14} />
                  Xem cửa hàng
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-300 hover:bg-white/10"
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
        {isAdmin && <AdminBriefing key={user.id ?? user.username} />}
      </div>
    </ErrorBoundary>
  );
};

export default AdminLayout;
