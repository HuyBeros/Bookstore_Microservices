import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const sequence = useRef(0);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach(clearTimeout); pending.clear(); };
  }, []);

  const showToast = useCallback((options, legacyMessage) => {
    const { type = 'info', message, duration = type === 'error' ? 8000 : 5000 } = typeof options === 'string'
      ? { type: options, message: legacyMessage } : options;
    const id = ++sequence.current;
    setToasts(prev => [...prev, { id, type, message }]);
    if (duration > 0) timers.current.set(id, setTimeout(() => removeToast(id), duration));
    return id;
  }, [removeToast]);

  return <ToastContext.Provider value={{ toasts, showToast, removeToast }}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast phải được dùng bên trong ToastProvider');
  return context;
};
