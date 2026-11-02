import { forwardRef } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const AuthNotice = forwardRef(function AuthNotice({ type = 'error', title, message }, ref) {
  const Icon = type === 'success' ? CheckCircle2 : type === 'info' ? Info : AlertCircle;
  const color = type === 'success' ? 'border-green/25 bg-[#f1f8f4] text-[#28513f]' : type === 'info' ? 'border-border bg-surface-muted text-ink-body' : 'border-red-200 bg-red-50 text-red-800';
  return (
    <div ref={ref} tabIndex={-1} role={type === 'error' ? 'alert' : 'status'} aria-atomic="true"
      className={`mb-5 flex gap-3 rounded-xl border p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${color}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 text-sm leading-relaxed">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <p>{message}</p>
      </div>
    </div>
  );
});

export default AuthNotice;
