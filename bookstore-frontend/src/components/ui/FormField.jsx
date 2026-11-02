import React from 'react';
import Input from './Input';

/**
 * FormField Component
 * Wrapper for input with label and error message
 * Works with react-hook-form
 */
const FormField = React.forwardRef(({
  label,
  error,
  required = false,
  helperText,
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-1 ${className}`.trim()} {...props}>
      {label && (
        <label className="block text-body-sm font-medium text-ink dark:text-ink">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div ref={ref}>
        {children}
      </div>
      {error && (
        <p className="text-caption text-danger dark:text-danger" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-caption text-ink-muted dark:text-ink-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
