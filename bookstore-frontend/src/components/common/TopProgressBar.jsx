import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * TopProgressBar Component
 * Thanh tải 2px màu Terracotta (#c2410c) ở mép trên cùng trình duyệt.
 * Tự động kích hoạt khi chuyển trang (route change) và tự tắt sau khi tải xong.
 * Hỗ trợ chế độ tải vô định (indeterminate) và tôn trọng prefers-reduced-motion.
 */
const TopProgressBar = ({ active: externalActive }) => {
  const location = useLocation();
  const [internalActive, setInternalActive] = useState(false);

  // Kích hoạt nhẹ nhàng mỗi khi thay đổi URL đường dẫn
  useEffect(() => {
    setInternalActive(true);
    const timer = setTimeout(() => {
      setInternalActive(false);
    }, 450); // Đủ thời gian cho route chuyển mượt mà

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  const isActive = externalActive !== undefined ? externalActive : internalActive;

  if (!isActive) return null;

  return (
    <div
      role="progressbar"
      aria-label="Đang tải trang"
      aria-busy="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none bg-transparent overflow-hidden"
    >
      {/* Thanh trượt indeterminate 2px màu Terracotta */}
      <div className="absolute top-0 bottom-0 bg-[#c2410c] shadow-[0_0_8px_rgba(194,65,12,0.6)] animate-top-bar" />
    </div>
  );
};

export default TopProgressBar;
