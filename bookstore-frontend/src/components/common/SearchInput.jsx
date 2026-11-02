import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import Spinner from './Spinner';

/**
 * SearchInput: ô tìm kiếm với debounce
 */
const SearchInput = ({ placeholder = 'Tìm kiếm...', value, onChange, loading = false, className = '' }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      onChange?.(newValue);
    }, 400);

    setDebounceTimer(timer);
  };

  const handleClear = () => {
    setInputValue('');
    clearTimeout(debounceTimer);
    onChange?.('');
  };

  return (
    <div className={`relative ${className}`}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Ô tìm kiếm"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Xóa nội dung tìm kiếm"
        >
          <X size={18} className="text-gray-400" />
        </button>
      )}
      {loading && (
        <Spinner size="sm" className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400" />
      )}
    </div>
  );
};

export default SearchInput;
