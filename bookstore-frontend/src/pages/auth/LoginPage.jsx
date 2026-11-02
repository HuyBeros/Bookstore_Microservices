import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, LoaderCircle, KeyRound, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthField from '../../components/common/AuthField';
import AuthNotice from '../../components/common/AuthNotice';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { loginSchema, authFailure, authDestination, authLink } from '../../utils/authFeedback';
import { isMockEnabled } from '../../api/request';
import { DEMO_ACCOUNTS } from '../../mock/data/users';

const LoginPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const registration = location.state?.registration;
  const [notice, setNotice] = useState(() => registration ? { type: 'success', title: 'Tạo tài khoản thành công', message: 'Tên đăng nhập đã được điền sẵn. Nhập mật khẩu để bắt đầu.' } : null);
  const [showHelp, setShowHelp] = useState(false);
  const [demoExpanded, setDemoExpanded] = useState(false);
  const noticeRef = useRef(null);
  const { login, isAuthenticated, userRole, loading } = useAuth();
  const { showToast } = useToast();
  const { register, handleSubmit, setValue, setError, setFocus, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema), mode: 'onBlur',
    defaultValues: { username: registration?.username || params.get('username') || '', password: '' },
  });

  useEffect(() => {
    if (isAuthenticated && !loading) navigate(authDestination(params.get('redirect'), userRole), { replace: true });
  }, [isAuthenticated, loading, userRole, navigate, params]);

  useEffect(() => {
    if (notice?.type !== 'error' || isSubmitting) return;
    const firstField = Object.keys(notice.fieldErrors || {})[0];
    if (firstField) setFocus(firstField);
    else noticeRef.current?.focus();
  }, [notice, isSubmitting, setFocus]);

  const onSubmit = async data => {
    setNotice(null);
    try {
      await login(data.username, data.password);
      showToast({ type: 'success', message: 'Đăng nhập thành công. Chào mừng bạn trở lại.' });
    } catch (error) {
      const feedback = authFailure(error, 'login');
      setNotice(feedback);
      Object.entries(feedback.fieldErrors).forEach(([field, message]) => setError(field, { type: 'server', message }));
    }
  };

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Chào mừng bạn trở lại</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">Đăng nhập để theo dõi đơn hàng và lưu những cuốn sách bạn yêu thích.</p>
      </div>
      {notice && <AuthNotice ref={noticeRef} {...notice} />}
      <form noValidate onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-5">
          <AuthField {...register('username')} id="login-username" label="Tên đăng nhập hoặc email" icon={User} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Nhập tên đăng nhập hoặc email" error={errors.username} required />
          <AuthField {...register('password')} id="login-password" label="Mật khẩu" icon={Lock} type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" error={errors.password} required />
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowHelp(value => !value)} aria-expanded={showHelp} aria-controls="password-help" className="min-h-10 rounded text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary">Quên mật khẩu?</button>
          </div>
          {showHelp && <div id="password-help"><AuthNotice type="info" title="Hỗ trợ tài khoản" message="Vui lòng liên hệ quản trị viên nhà sách để được hỗ trợ khôi phục mật khẩu." /></div>}
          <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cta px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary active:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70">
            {isSubmitting ? <><LoaderCircle size={19} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Đang đăng nhập…</> : <>Đăng nhập<ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </fieldset>
        <p role="status" className="sr-only">{isSubmitting ? 'Đang kiểm tra thông tin đăng nhập, vui lòng chờ.' : ''}</p>
      </form>
      {isMockEnabled() && <div className="mt-6 border-t border-border pt-5">
        <button type="button" onClick={() => setDemoExpanded(value => !value)} aria-expanded={demoExpanded} className="flex min-h-11 w-full items-center gap-2 text-sm font-medium text-primary"><KeyRound size={17} aria-hidden="true" />Tài khoản trải nghiệm<ChevronDown size={16} aria-hidden="true" /></button>
        {demoExpanded && <div className="grid grid-cols-2 gap-2">{DEMO_ACCOUNTS.map(account => <button key={account.username} type="button" onClick={() => { setValue('username', account.username, { shouldValidate: true }); setValue('password', account.password, { shouldValidate: true }); setNotice(null); }} className="rounded-xl border border-border p-3 text-left text-sm hover:bg-surface-muted"><span className="font-medium">{account.username}</span><span className="mt-1 block text-xs text-ink-muted">{account.label}</span></button>)}</div>}
      </div>}
      <p className="mt-7 text-center text-sm text-ink-body">Chưa có tài khoản? <Link to={authLink('/register', params.get('redirect'))} className="font-semibold text-primary hover:underline">Đăng ký ngay</Link></p>
    </div>
  );
};

export default LoginPage;
