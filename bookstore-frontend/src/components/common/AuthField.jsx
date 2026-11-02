import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const AuthField = forwardRef(function AuthField({ id, label, icon: Icon, type = 'text', error, hint, optional = false, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`, props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-ink">
        {label}{optional && <span className="ml-1 font-normal text-ink-muted">(tùy chọn)</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />}
        <input {...props} ref={ref} id={id} type={password && visible ? 'text' : type} aria-invalid={!!error} aria-describedby={describedBy}
          className={`min-h-12 w-full rounded-xl border bg-white py-3 text-base text-ink outline-none transition-colors placeholder:text-ink-muted/80 focus:ring-2 disabled:cursor-wait disabled:bg-surface-muted ${Icon ? 'pl-11' : 'pl-3.5'} ${password ? 'pr-12' : 'pr-3.5'} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-[#dcd5cd] focus:border-primary focus:ring-primary/15'}`} />
        {password && <button type="button" disabled={props.disabled} onClick={() => setVisible(value => !value)}
          className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label.toLowerCase()}`} aria-pressed={visible}>
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-ink-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm leading-relaxed text-red-700">{error.message || error}</p>}
    </div>
  );
});

export default AuthField;
