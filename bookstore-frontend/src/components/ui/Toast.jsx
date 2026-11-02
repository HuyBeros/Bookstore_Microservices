import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * Toast Component
 * Notification message with auto-dismiss
 */
const Toast = ({
  id,
  type = 'info',
  message,
  onClose,
  duration = 4000,
  className = '',
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const bgColors = {
    success: 'bg-success-soft dark:bg-success-soft/20',
    error: 'bg-danger-soft dark:bg-danger-soft/20',
    warning: 'bg-warning-soft dark:bg-warning-soft/20',
    info: 'bg-info-soft dark:bg-info-soft/20',
  };

  const textColors = {
    success: 'text-success',
    error: 'text-danger',
    warning: 'text-warning',
    info: 'text-info',
  };

  const Icon = icons[type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-card ${bgColors[type]} animate-slide-up shadow-md ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${textColors[type]}`} />
      <p className="flex-1 text-body-sm text-ink dark:text-ink">{message}</p>
      <button
        onClick={onClose}
        className={`p-1 rounded-button hover:bg-black/10 transition-smooth ${textColors[type]}`}
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
