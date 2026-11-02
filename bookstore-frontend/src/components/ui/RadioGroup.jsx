import React from 'react';

/**
 * RadioGroup Component
 * Group of radio buttons
 */
const RadioGroup = ({
  options = [],
  value,
  onChange,
  name,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {options.map((option) => (
        <label
          key={option.value}
          className="flex items-center p-3 border border-border rounded-button hover:bg-surface-muted cursor-pointer transition-smooth dark:border-border dark:hover:bg-surface"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="mr-3 accent-primary dark:accent-primary-light"
          />
          <div className="flex-1">
            <p className="font-medium text-body-sm text-ink dark:text-ink">
              {option.label}
            </p>
            {option.description && (
              <p className="text-caption text-ink-muted dark:text-ink-muted">
                {option.description}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

export default RadioGroup;
