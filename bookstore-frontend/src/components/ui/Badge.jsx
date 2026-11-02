import React from 'react';

/**
 * Badge Component
 * Used for status, labels, tags
 */
const Badge = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const variantStyles = {
    primary: 'bg-primary-light text-primary dark:bg-primary-dark dark:text-primary-light',
    accent: 'bg-accent-light text-accent dark:bg-accent-dark dark:text-accent-light',
    success: 'bg-success-soft text-success dark:bg-success-soft dark:text-success',
    warning: 'bg-warning-soft text-warning dark:bg-warning-soft dark:text-warning',
    danger: 'bg-danger-soft text-danger dark:bg-danger-soft dark:text-danger',
    info: 'bg-info-soft text-info dark:bg-info-soft dark:text-info',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-label',
    md: 'px-2.5 py-1.5 text-caption',
    lg: 'px-3 py-2 text-body-sm',
  };

  const badgeClass = `inline-flex items-center justify-center rounded-badge font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

  return (
    <span ref={ref} className={badgeClass} {...props}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;
