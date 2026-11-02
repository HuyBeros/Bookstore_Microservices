import React from 'react';
import { Eye, EyeOff, X } from 'lucide-react';

/**
 * Input Component
 * Supports text, password, number, email, etc.
 * Includes clearable option and password visibility toggle
 */
const Input = React.forwardRef(({
  type = 'text',
  placeholder = '',
  disabled = false,
  error = false,
  clearable = false,
  onClear,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';

  const baseStyles = 'w-full px-3 py-2.5 border border-border rounded-input bg-surface text-ink placeholder-ink-muted transition-smooth focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed dark:bg-surface-muted dark:border-border dark:text-ink dark:placeholder-ink-muted dark:focus-visible:outline-primary-light';

  const errorStyles = error ? 'border-danger focus-visible:outline-danger dark:focus-visible:outline-danger' : '';

  const inputClass = `${baseStyles} ${errorStyles} ${className}`.trim();

  return (
    <div className="relative flex items-center">
      <input
        ref={ref}
        type={isPassword && showPassword ? 'text' : type}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
        {...props}
      />

      {/* Password visibility toggle */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 p-1 text-ink-muted hover:text-ink transition-smooth dark:text-ink-muted dark:hover:text-ink"
          tabIndex={-1}
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}

      {/* Clearable button */}
      {clearable && !isPassword && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 p-1 text-ink-muted hover:text-ink transition-smooth dark:text-ink-muted dark:hover:text-ink"
          tabIndex={-1}
          aria-label="Xóa"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
