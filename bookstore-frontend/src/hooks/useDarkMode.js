import { useEffect, useState } from 'react';

/**
 * useDarkMode Hook
 * Quản lý chế độ sáng/tối với localStorage persistence
 * Mặc định giao diện sáng (Pure White Canvas #ffffff) theo chuẩn thiết kế Figma BookZone
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      // Mặc định giao diện sáng chuẩn Figma
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
    setIsLoaded(true);
  }, []);

  const applyDarkMode = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    setIsDark(prev => {
      const newValue = !prev;
      applyDarkMode(newValue);
      localStorage.setItem('darkMode', String(newValue));
      return newValue;
    });
  };

  return { isDark, toggleDarkMode, isLoaded };
};
