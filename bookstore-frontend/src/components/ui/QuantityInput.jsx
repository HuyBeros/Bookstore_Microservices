import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * QuantityInput Component
 * Input for selecting quantity with +/- buttons
 */
const QuantityInput = ({
  value = 1,
  min = 1,
  max = 999,
  onChange,
  disabled = false,
  loading = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleChange = (newValue) => {
    const num = Math.max(min, Math.min(max, newValue));
    setInputValue(String(num));
    onChange?.(num);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setInputValue('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setInputValue(String(num));
    }
  };

  const handleInputBlur = () => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < min) {
      handleChange(min);
    } else if (num > max) {
      handleChange(max);
    } else {
      handleChange(num);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      {/* Minus button */}
      <button
        type="button"
        onClick={() => handleChange(value - 1)}
        disabled={disabled || loading || value <= min}
        className="flex items-center justify-center w-9 h-9 border border-border rounded-button hover:bg-surface-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed dark:border-border dark:hover:bg-surface"
        aria-label="Giảm số lượng"
      >
        <Minus className="w-4 h-4 text-ink dark:text-ink" />
      </button>

      {/* Input */}
      <input
        type="number"
        min={min}
        max={max}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className="w-12 text-center border border-border rounded-button px-2 py-1.5 bg-surface text-ink focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed dark:bg-surface-muted dark:border-border dark:text-ink"
        aria-label="Số lượng"
      />

      {/* Plus button */}
      <button
        type="button"
        onClick={() => handleChange(value + 1)}
        disabled={disabled || loading || value >= max}
        className="flex items-center justify-center w-9 h-9 border border-border rounded-button hover:bg-surface-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed dark:border-border dark:hover:bg-surface"
        aria-label="Tăng số lượng"
      >
        <Plus className="w-4 h-4 text-ink dark:text-ink" />
      </button>
    </div>
  );
};

export default QuantityInput;
