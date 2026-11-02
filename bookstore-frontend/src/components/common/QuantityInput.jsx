import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * QuantityInput: nhập số lượng với nút +/-
 */
const QuantityInput = ({
  value = 1,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [quantity, setQuantity] = useState(value);

  useEffect(() => {
    setQuantity(value);
  }, [value]);

  const handleChange = (newValue) => {
    if (newValue >= min && newValue <= max) {
      setQuantity(newValue);
      onChange?.(newValue);
    }
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue)) {
      handleChange(newValue);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => handleChange(quantity - 1)}
        disabled={disabled || quantity <= min}
        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Giảm số lượng"
      >
        <Minus size={16} />
      </button>

      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="w-16 text-center border border-gray-300 rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        aria-label="Số lượng"
      />

      <button
        onClick={() => handleChange(quantity + 1)}
        disabled={disabled || quantity >= max}
        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Tăng số lượng"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};

export default QuantityInput;
