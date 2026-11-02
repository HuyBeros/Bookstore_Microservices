import React from 'react';

/**
 * Textarea Component
 * Multi-line text input
 */
const Textarea = React.forwardRef(({
  placeholder = '',
  disabled = false,
  error = false,
  className = '',
  rows = 4,
  ...props
}, ref) => {
  const baseStyles = 'w-full px-3 py-2.5 border border-border rounded-input bg-surface text-ink placeholder-ink-muted transition-smooth focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed dark:bg-surface-muted dark:border-border dark:text-ink dark:placeholder-ink-muted dark:focus-visible:outline-primary-light resize-vertical';

  const errorStyles = error ? 'border-danger focus-visible:outline-danger dark:focus-visible:outline-danger' : '';

  const textareaClass = `${baseStyles} ${errorStyles} ${className}`.trim();

  return (
    <textarea
      ref={ref}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={textareaClass}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
