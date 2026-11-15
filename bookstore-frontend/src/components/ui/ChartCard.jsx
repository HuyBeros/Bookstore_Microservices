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
  actions,
  children,
  loading = false,
  error = null,
  empty = false,
  onRetry,
  className = '',
}) => {
  return (
    <Card shadow="none" className={`p-5 sm:p-6 ${className}`.trim()}>
      {title && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-heading-md font-semibold text-ink">{title}</h3>
          {actions}
        </div>
      )}

      {loading ? <Skeleton height="13rem" />
        : error ? <ErrorState message={error} onRetry={onRetry} />
        : empty ? <EmptyState title="Chưa có dữ liệu" />
        : children}
    </Card>
  );
};

export default ChartCard;
