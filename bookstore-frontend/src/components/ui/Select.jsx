import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Select Component
 * Dropdown select input
 */
const Select = React.forwardRef(({
  options = [],
  placeholder = 'Chọn...',
  disabled = false,
  error = false,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'w-full px-3 py-2.5 border border-border rounded-input bg-surface text-ink placeholder-ink-muted transition-smooth focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed appearance-none dark:bg-surface-muted dark:border-border dark:text-ink dark:placeholder-ink-muted dark:focus-visible:outline-primary-light pr-10';

  const errorStyles = error ? 'border-danger focus-visible:outline-danger dark:focus-visible:outline-danger' : '';

  const selectClass = `${baseStyles} ${errorStyles} ${className}`.trim();

  return (
    <div className="relative">
      <select ref={ref} disabled={disabled} className={selectClass} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-ink-muted pointer-events-none dark:text-ink-muted" />
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
