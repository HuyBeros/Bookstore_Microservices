import React from 'react';

/**
 * Spinner Component
 * Animated loading indicator
 */
const Spinner = React.forwardRef(({
  size = 'md',
  className = '',
}, ref) => {
  const sizeStyles = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const spinnerClass = `inline-block rounded-full border-primary border-t-transparent dark:border-primary-light dark:border-t-transparent animate-spin ${sizeStyles[size]} ${className}`.trim();

  return <div ref={ref} className={spinnerClass} aria-label="Đang tải..." />;
});

Spinner.displayName = 'Spinner';

export default Spinner;
