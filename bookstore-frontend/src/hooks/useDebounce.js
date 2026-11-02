import { useEffect, useState } from 'react';

/**
 * Hook: useDebounce
 * Debounce một giá trị
 *
 * @param {*} value - giá trị cần debounce
 * @param {number} ms - thời gian delay (ms)
 * @returns {*} - giá trị đã debounce
 */
export const useDebounce = (value, ms = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, ms);

    return () => clearTimeout(timer);
  }, [value, ms]);

  return debouncedValue;
};
