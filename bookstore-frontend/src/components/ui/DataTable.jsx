import React from 'react';
import { TableRowSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

/**
 * DataTable Component
 * Flexible table with columns config, pagination, loading states
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  error = null,
  emptyText = 'Không có dữ liệu',
  onRetry,
  rowsPerPage = 10,
  className = '',
}) => {
  if (loading) {
    return <TableRowSkeleton rows={rowsPerPage} cols={columns.length} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyText} />;
  }

  return (
    <div className={`overflow-x-auto ${className}`.trim()}>
      <table className="w-full text-body-sm text-ink dark:text-ink">
        <thead>
          <tr className="border-b border-border dark:border-border bg-surface-muted dark:bg-surface">
            {columns.map((col) => (
              <th
                key={col.accessor}
                className="px-4 py-3 text-left font-semibold text-ink-muted dark:text-ink-muted"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-border dark:border-border hover:bg-surface-muted dark:hover:bg-surface transition-smooth"
            >
              {columns.map((col) => (
                <td key={col.accessor} className="px-4 py-3">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
