import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Spinner from './Spinner';

/**
 * SearchInput Component
 * Search input with debounce and clear button
 */
const SearchInput = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Tìm kiếm...',
  debounceMs = 400,
  loading = false,
  disabled = false,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch?.(inputValue);
      onChange?.(inputValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, onChange, onSearch]);

  const handleClear = () => {
    setInputValue('');
  };

  return (
    <div className={`relative flex items-center ${className}`.trim()}>
      <Search className="absolute left-3 w-4 h-4 text-ink-muted dark:text-ink-muted pointer-events-none" />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full pl-9 pr-10 py-2.5 border border-border rounded-input bg-surface text-ink placeholder-ink-muted transition-smooth focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed dark:bg-surface-muted dark:border-border dark:text-ink dark:placeholder-ink-muted dark:focus-visible:outline-primary-light"
      />
      {loading && (
        <Spinner size="sm" className="absolute right-3" />
      )}
      {!loading && inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 text-ink-muted hover:text-ink transition-smooth dark:text-ink-muted dark:hover:text-ink"
          aria-label="Xóa"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
