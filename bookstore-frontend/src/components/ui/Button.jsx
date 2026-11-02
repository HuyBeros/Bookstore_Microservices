import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * Variants: primary, secondary, danger, ghost
 * Supports icons, loading state, and disabled state
 */
const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}, ref) => {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-button transition-smooth focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-1.5 text-caption',
    md: 'px-4 py-2.5 text-body-sm',
    lg: 'px-6 py-3 text-body-md',
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-surface hover:bg-primary-dark focus-visible:outline-primary-dark dark:focus-visible:outline-primary-light',
    secondary: 'bg-surface border border-primary text-primary hover:bg-primary-light focus-visible:outline-primary dark:bg-surface-muted dark:border-primary dark:text-primary-light dark:hover:bg-primary-light/20',
    danger: 'bg-danger text-surface hover:bg-danger-dark focus-visible:outline-danger dark:hover:bg-danger-dark',
    ghost: 'bg-transparent text-primary hover:bg-primary-light focus-visible:outline-primary dark:text-primary-light dark:hover:bg-primary-light/10',
  };

  const buttonClass = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim();

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClass}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
