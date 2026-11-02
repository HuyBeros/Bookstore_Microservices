import React from 'react';
import TopProgressBar from '../common/TopProgressBar';

/**
 * RouteLoadingFallback: Dùng cho Suspense khi chuyển trang con (route transition).
 * Không dùng màn chào toàn màn hình!
 * Thay vào đó:
 * 1. Thanh 2px Terracotta chạy ở mép trên cùng trình duyệt.
 * 2. Khung skeleton màu giấy ấm với hiệu ứng shimmer nhẹ nhàng trong khu vực nội dung.
 */
const RouteLoadingFallback = ({ isAdmin = false }) => {
  const isCurrentAdmin = isAdmin || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  return (
    <>
      <TopProgressBar active={true} />

      <div
        className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-pulse-soft"
        role="status"
        aria-busy="true"
        aria-label="Đang nạp dữ liệu trang..."
      >
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-lg shimmer-warm" />
          <div className="h-4 w-72 rounded-md shimmer-warm opacity-80" />
        </div>

        {/* Content Skeleton Grid / Cards */}
        {isCurrentAdmin ? (
          // Admin Table / Stat Skeleton
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl shimmer-warm p-4 border border-[#ede3d5]/50" />
              ))}
            </div>
            <div className="h-80 rounded-xl shimmer-warm border border-[#ede3d5]/50" />
          </div>
        ) : (
          // Customer Book Grid Skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 pt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] w-full rounded-xl shimmer-warm border border-[#ede3d5]/50" />
                <div className="h-4 w-3/4 rounded shimmer-warm" />
                <div className="h-3 w-1/2 rounded shimmer-warm opacity-75" />
                <div className="h-4 w-1/3 rounded shimmer-warm font-semibold" />
              </div>
            ))}
          </div>
        )}

        <span className="sr-only">Đang nạp trang...</span>
      </div>
    </>
  );
};

export default RouteLoadingFallback;
