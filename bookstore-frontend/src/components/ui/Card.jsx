import React from 'react';

/**
 * Card Component
 * Wrapper for content with proper spacing and shadows
 */
const Card = React.forwardRef(({
  children,
  className = '',
  shadow = 'md',
  interactive = false,
  ...props
}, ref) => {
  const shadowStyles = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    none: '',
  };

  const baseStyles = 'bg-surface rounded-card border border-border transition-smooth dark:bg-surface-muted dark:border-border';
  const interactiveStyles = interactive ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' : '';

  const cardClass = `${baseStyles} ${shadowStyles[shadow]} ${interactiveStyles} ${className}`.trim();

  return (
    <div ref={ref} className={cardClass} {...props}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
