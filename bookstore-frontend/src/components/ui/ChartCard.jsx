import React from 'react';
import Card from './Card';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * ChartCard Component
 * Card wrapper for charts with loading/error states
 */
const ChartCard = ({
  title,
  children,
  loading = false,
  error = null,
  empty = false,
  onRetry,
  className = '',
}) => {
  return (
    <Card className={`p-6 ${className}`.trim()}>
      {title && (
        <h3 className="text-heading-md font-semibold text-ink dark:text-ink mb-4">
          {title}
        </h3>
      )}

      {loading && <Skeleton count={3} height="12rem" />}
      {error && <ErrorState message={error} onRetry={onRetry} />}
      {empty && <EmptyState title="Chưa có dữ liệu" />}
      {!loading && !error && !empty && children}
    </Card>
  );
};

export default ChartCard;
