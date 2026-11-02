import React from 'react';
import { TableRowSkeleton } from './Skeleton';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import Pagination from './Pagination';

/**
 * DataTable: Bảng hiển thị dữ liệu chuẩn Responsive
 * Bọc trong khung bo góc bóng nhẹ và có cuộn ngang mượt mà trên mobile
 */
const DataTable = ({
  columns,
  data,
  loading = false,
  error = null,
  emptyText = 'Không có dữ liệu',
  onRetry,
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
}) => {
  if (loading && !data?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse ${className}`}>
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-wider text-gray-500">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3.5 text-left font-bold"
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <TableRowSkeleton rows={5} cols={columns.length} />
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!data?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-8 shadow-sm">
        <EmptyState title={emptyText} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse ${className}`}>
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3.5 text-left whitespace-nowrap"
                    style={{ width: col.width }}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-xs sm:text-sm">
              {data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/60 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={`${rowIdx}-${col.key}`}
                      className="px-4 py-3.5 text-gray-700 dark:text-gray-200 whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(row[col.accessor || col.key], row)
                        : row[col.accessor || col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={onPageChange} />
      )}
    </div>
  );
};

export default DataTable;
