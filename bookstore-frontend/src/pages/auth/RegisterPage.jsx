import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, LoaderCircle, Check, Circle } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthField from '../../components/common/AuthField';
import AuthNotice from '../../components/common/AuthNotice';
import { useAuth } from '../../context/AuthContext';
import { registerSchema, passwordRules, authFailure, authLink } from '../../utils/authFeedback';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [notice, setNotice] = useState(null);
  const noticeRef = useRef(null);
  const { register: registerUser } = useAuth();
  const { register, control, handleSubmit, setError, setFocus, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema), mode: 'onBlur',
    defaultValues: { full_name: '', username: '', email: '', phone: '', password: '', password_confirm: '' },
  });
  const password = useWatch({ control, name: 'password', defaultValue: '' });

  useEffect(() => {
    if (notice?.type !== 'error' || isSubmitting) return;
    const firstField = Object.keys(notice.fieldErrors || {})[0];
    if (firstField) setFocus(firstField);
    else noticeRef.current?.focus();
  }, [notice, isSubmitting, setFocus]);

  const onSubmit = async data => {
    setNotice(null);
    try {
      await registerUser({ username: data.username, password: data.password, full_name: data.full_name, email: data.email, phone: data.phone || null });
      navigate(authLink('/login', params.get('redirect')), { replace: true, state: { registration: { username: data.username } } });
    } catch (error) {
      const feedback = authFailure(error, 'register');
      setNotice(feedback);
      Object.entries(feedback.fieldErrors).forEach(([field, message]) => setError(field, { type: 'server', message }));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Tạo tài khoản của bạn</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">Điền thông tin bên dưới. Sau khi tạo tài khoản, bạn có thể đăng nhập ngay.</p>
      </div>
      {notice && <AuthNotice ref={noticeRef} {...notice} />}
      <form noValidate onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <AuthField {...register('full_name')} id="register-full-name" label="Họ và tên" icon={User} autoComplete="name" placeholder="Họ và tên của bạn" error={errors.full_name} required />
            <AuthField {...register('username')} id="register-username" label="Tên đăng nhập" icon={User} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Từ 3 đến 50 ký tự" error={errors.username} required />
            <AuthField {...register('email')} id="register-email" label="Email" icon={Mail} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="ban@example.com" error={errors.email} required />
            <AuthField {...register('phone')} id="register-phone" label="Số điện thoại" icon={Phone} type="tel" autoComplete="tel" inputMode="tel" placeholder="0912345678" error={errors.phone} optional />
            <AuthField {...register('password')} id="register-password" label="Mật khẩu" icon={Lock} type="password" autoComplete="new-password" placeholder="Tạo mật khẩu" error={errors.password} aria-describedby="password-requirements" required />
            <AuthField {...register('password_confirm')} id="register-password-confirm" label="Xác nhận mật khẩu" icon={Lock} type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu" error={errors.password_confirm} required />
          </div>
          <div id="password-requirements" className="rounded-xl bg-surface-muted p-4">
            <p className="mb-2 text-xs font-semibold text-ink-body">Mật khẩu cần đáp ứng</p>
            <ul className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              {passwordRules.map(rule => {
                const passed = rule.test(password);
                const Icon = passed ? Check : Circle;
                return <li key={rule.label} className={`flex items-start gap-2 text-xs leading-relaxed ${passed ? 'text-[#28513f]' : 'text-ink-muted'}`}><Icon size={14} className="mt-0.5 shrink-0" aria-hidden="true" /><span><span className="sr-only">{passed ? 'Đã đạt: ' : 'Chưa đạt: '}</span>{rule.label}</span></li>;
              })}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">Chỉ dùng chữ cái không dấu, số và các ký tự đặc biệt nêu trên.</p>
          </div>
          <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cta px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary active:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70">
            {isSubmitting ? <><LoaderCircle size={19} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Đang tạo tài khoản…</> : <>Tạo tài khoản<ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </fieldset>
        <p role="status" className="sr-only">{isSubmitting ? 'Đang tạo tài khoản, vui lòng chờ.' : ''}</p>
      </form>
      <p className="mt-6 text-center text-sm text-ink-body">Đã có tài khoản? <Link to={authLink('/login', params.get('redirect'))} className="font-semibold text-primary hover:underline">Đăng nhập</Link></p>
    </div>
  );
};

export default RegisterPage;
