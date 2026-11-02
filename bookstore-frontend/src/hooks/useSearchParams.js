import { useSearchParams as useRRSearchParams } from 'react-router-dom';

/**
 * Hook: useSearchParams
 * Wrapper xung quanh React Router's useSearchParams
 * Thêm các tiện ích để làm việc với query params dễ hơn
 */
export const useSearchParams = () => {
  const [searchParams, setSearchParams] = useRRSearchParams();

  // Lấy giá trị param
  const getParam = (key, defaultValue = '') => {
    return searchParams.get(key) || defaultValue;
  };

  // Đặt giá trị param
  const setParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }
    setSearchParams(newParams);
  };

  // Đặt nhiều params cùng lúc
  const setParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  };

  // Xóa param
  const removeParam = (key) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    setSearchParams(newParams);
  };

  // Xóa tất cả params
  const clearParams = () => {
    setSearchParams({});
  };

  return {
    searchParams,
    setSearchParams,
    getParam,
    setParam,
    setParams,
    removeParam,
    clearParams,
  };
};
