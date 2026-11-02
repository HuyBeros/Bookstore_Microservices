import React from 'react';

/**
 * IconButton Component
 * Button with just an icon
 */
const IconButton = React.forwardRef(({
  icon: Icon,
  disabled = false,
  className = '',
  variant = 'ghost',
  size = 'md',
  ariaLabel,
  ...props
}, ref) => {
  const sizeStyles = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const variantStyles = {
    ghost: 'text-ink hover:bg-surface-muted dark:text-ink dark:hover:bg-surface',
    primary: 'text-primary hover:text-primary-dark dark:text-primary-light dark:hover:text-primary',
    danger: 'text-danger hover:text-danger-dark dark:text-danger dark:hover:text-danger-dark',
  };

  const buttonClass = `inline-flex items-center justify-center rounded-button transition-smooth focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim();

  return (
    <button
      ref={ref}
      className={buttonClass}
      disabled={disabled}
      aria-label={ariaLabel}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
});

IconButton.displayName = 'IconButton';

export default IconButton;
