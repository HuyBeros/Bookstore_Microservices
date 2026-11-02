import { Outlet, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen, ArrowLeft, Bookmark, PackageCheck } from 'lucide-react';
import { ErrorBoundary } from '../components/ui';
import { authLink } from '../utils/authFeedback';
import LiteraryQuote from '../components/common/LiteraryQuote';

const AuthLayout = () => {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const isLogin = pathname === '/login';
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-paper font-body text-ink lg:grid lg:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.15fr)]">
        <aside className="relative hidden flex-col justify-between border-r border-border bg-[#f7f1e8] px-10 py-10 lg:flex xl:px-16">
          <Link to="/" className="inline-flex w-fit items-center gap-2 rounded-lg text-sm text-ink-body transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
            <ArrowLeft size={17} aria-hidden="true" /> Về nhà sách
          </Link>
          <div className="max-w-md py-12">
            <BookOpen size={42} strokeWidth={1.3} className="mb-8 text-primary" aria-hidden="true" />
            <Link to="/" className="font-serif text-4xl font-semibold tracking-tight text-primary xl:text-5xl">Phương Anh</Link>
            <p className="mt-3 text-sm tracking-wide text-ink-muted">Nhà sách trực tuyến</p>
            <h2 className="mt-10 max-w-sm font-serif text-3xl font-medium leading-snug text-ink xl:text-4xl">Mỗi trang sách,<br />một góc nhìn mới.</h2>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-ink-body">Một tài khoản để lưu sách yêu thích và theo dõi hành trình những cuốn sách đến tay bạn.</p>
            <div className="mt-8">
              <LiteraryQuote variant="card" random={true} className="border-[#ded3c4] bg-white/70 backdrop-blur-xs" />
            </div>
            <div className="mt-7 space-y-3.5 border-t border-[#ded3c4] pt-6 text-sm text-ink-body">
              <p className="flex items-center gap-3"><Bookmark size={18} className="text-primary" aria-hidden="true" /> Lưu những cuốn sách bạn muốn đọc</p>
              <p className="flex items-center gap-3"><PackageCheck size={18} className="text-primary" aria-hidden="true" /> Xem lại và theo dõi đơn hàng</p>
            </div>
          </div>
          <p className="text-xs text-ink-muted">© {new Date().getFullYear()} Nhà sách Phương Anh</p>
        </aside>
        <main className="mx-auto flex w-full max-w-2xl flex-col justify-center px-5 py-7 sm:px-10 sm:py-10 xl:px-14">
          <header className="mb-7 flex items-center justify-between lg:hidden">
            <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-ink-body"><ArrowLeft size={17} aria-hidden="true" /> Nhà sách</Link>
            <Link to="/" className="font-serif text-xl font-semibold text-primary">Phương Anh</Link>
          </header>
          <nav aria-label="Tài khoản" className="mb-8 grid grid-cols-2 border-b border-border">
            {[['/login', 'Đăng nhập', isLogin], ['/register', 'Đăng ký', !isLogin]].map(([path, label, active]) => (
              <Link key={path} to={authLink(path, params.get('redirect'))} aria-current={active ? 'page' : undefined}
                className={`-mb-px min-h-12 border-b-2 px-4 py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary ${active ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-primary'}`}>{label}</Link>
            ))}
          </nav>
          <Outlet />
          <div className="mt-8 border-t border-border/60 pt-5 text-center lg:hidden">
            <LiteraryQuote variant="inline" random={true} />
          </div>
          <p className="mt-6 text-center text-xs leading-relaxed text-ink-muted">Nhà sách trực tuyến Phương Anh · Cùng bạn chọn cuốn sách tiếp theo</p>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default AuthLayout;
