import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const variants = {
  success: { icon: CheckCircle2, title: 'Thành công', color: 'border-green/25 bg-[#f1f8f4] text-[#28513f]' },
  error: { icon: AlertCircle, title: 'Chưa thể hoàn tất', color: 'border-red-200 bg-red-50 text-red-800' },
  info: { icon: Info, title: 'Thông báo', color: 'border-border bg-surface text-ink-body' },
};

const Toast = ({ type, message, onClose }) => {
  const { icon: Icon, title, color } = variants[type] || variants.info;
  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-[0_8px_30px_rgba(74,62,57,0.12)] ${color}`}
      role={type === 'error' ? 'alert' : 'status'} aria-atomic="true">
      <Icon size={21} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 break-words text-sm leading-relaxed">{message}</p>
      </div>
      <button type="button" onClick={onClose} className="-mr-2 -mt-2 flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" aria-label="Đóng thông báo">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] max-h-[70dvh] space-y-3 overflow-y-auto sm:left-auto sm:w-96" aria-label="Thông báo">
      {toasts.map(toast => <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />)}
    </div>
  );
};

export default Toast;
