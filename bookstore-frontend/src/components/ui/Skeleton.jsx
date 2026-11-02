import React from 'react';

/**
 * Skeleton Component
 * Loading placeholder with warm parchment shimmer effect
 */
const Skeleton = ({
  type = 'text',
  count = 1,
  width = '100%',
  height = '1rem',
  className = '',
  circle = false,
  ...props
}) => {
  const baseStyles = 'shimmer-warm rounded-md';
  const skeletonClass = `${baseStyles} ${className}`.trim();

  if (type === 'circle') {
    return (
      <div
        className={`${skeletonClass} rounded-full`}
        style={{ width: height, height, minWidth: height }}
        {...props}
      />
    );
  }

  if (type === 'rect' || type === 'rectangle') {
    return (
      <div
        className={skeletonClass}
        style={{ width, height }}
        {...props}
      />
    );
  }

  // Default text skeleton
  return (
    <div className="space-y-2" {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={skeletonClass}
          style={{ width: i === count - 1 ? '80%' : '100%', height }}
        />
      ))}
    </div>
  );
};

export default Skeleton;

/**
 * BookCardSkeleton - Skeleton for book card layout
 */
export const BookCardSkeleton = ({ className = '' }) => (
  <div className={`space-y-3 ${className}`.trim()}>
    <Skeleton type="rect" width="100%" height="13rem" className="rounded-xl border border-border/40" />
    <Skeleton count={2} height="0.875rem" />
    <Skeleton type="text" height="0.8125rem" width="50%" />
    <Skeleton type="text" height="1.125rem" width="60%" />
  </div>
);

/**
 * TableRowSkeleton - Skeleton for table rows
 */
export const TableRowSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 p-3 bg-surface-muted/60 dark:bg-surface rounded-lg border border-border/30">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} type="text" height="1rem" />
        ))}
      </div>
    ))}
  </div>
);

/**
 * DetailSkeleton - Skeleton for detail page (hero + sections)
 */
export const DetailSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton type="rect" width="100%" height="22rem" className="md:col-span-1 rounded-xl" />
      <div className="md:col-span-2 space-y-4">
        <Skeleton count={1} height="2rem" width="75%" />
        <Skeleton count={3} height="1rem" />
        <Skeleton count={1} height="1.5rem" width="40%" />
      </div>
    </div>
    <div className="space-y-3 pt-4">
      <Skeleton count={6} height="1rem" />
    </div>
  </div>
);
