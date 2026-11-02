import React from 'react';

/**
 * Skeleton: hiệu ứng shimmer màu giấy ấm (Warm Parchment Shimmer) cho loading states
 */
const shimmerClass = 'shimmer-warm rounded-md';

export const TextSkeleton = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array(lines)
      .fill(0)
      .map((_, i) => (
        <div key={i} className={`h-4 ${shimmerClass}`} />
      ))}
  </div>
);

export const RectangleSkeleton = ({ width = 'w-full', height = 'h-40', className = '' }) => (
  <div className={`${width} ${height} rounded-lg ${shimmerClass} ${className}`} />
);

export const CircleSkeleton = ({ size = 'w-10 h-10', className = '' }) => (
  <div className={`${size} rounded-full ${shimmerClass} ${className}`} />
);

export const BookCardSkeleton = () => (
  <div className="bg-white rounded-xl shadow-xs border border-border/60 overflow-hidden">
    <RectangleSkeleton width="w-full" height="h-56" className="rounded-b-none" />
    <div className="p-3.5 space-y-2.5">
      <TextSkeleton lines={2} />
      <TextSkeleton lines={1} className="w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <TextSkeleton className="w-1/3" />
        <TextSkeleton className="w-1/4" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton = ({ rows = 5, cols = 5 }) => (
  <tbody>
    {Array(rows)
      .fill(0)
      .map((_, rowIdx) => (
        <tr key={rowIdx} className="border-b border-border/40">
          {Array(cols)
            .fill(0)
            .map((_, colIdx) => (
              <td key={colIdx} className="px-4 py-3.5">
                <TextSkeleton />
              </td>
            ))}
        </tr>
      ))}
  </tbody>
);

export const DetailSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-1">
      <RectangleSkeleton width="w-full" height="h-80" />
    </div>
    <div className="md:col-span-2 space-y-4">
      <TextSkeleton lines={2} />
      <TextSkeleton lines={1} className="w-1/2" />
      <div className="space-y-2 pt-4">
        <TextSkeleton lines={4} />
      </div>
    </div>
  </div>
);
