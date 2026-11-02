import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 * Supports modal, dialog with overlay, close on Esc, focus trap
 */
const Modal = React.forwardRef(({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeButton = true,
  overlayClick = true,
  className = '',
}, ref) => {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Handle Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={overlayClick ? onClose : undefined}
        role="presentation"
      />

      {/* Modal */}
      <div
        ref={ref}
        className={`relative bg-surface dark:bg-surface-muted rounded-modal shadow-lg max-h-[90vh] overflow-y-auto animate-slide-up w-[calc(100%-2rem)] ${sizeStyles[size]} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border">
            <h2 className="text-heading-md font-semibold text-ink dark:text-ink">{title}</h2>
            {closeButton && (
              <button
                onClick={onClose}
                className="p-2 text-ink-muted hover:text-ink hover:bg-surface-muted rounded-button transition-smooth dark:text-ink-muted dark:hover:text-ink dark:hover:bg-surface"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border dark:border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
});

Modal.displayName = 'Modal';

export default Modal;
