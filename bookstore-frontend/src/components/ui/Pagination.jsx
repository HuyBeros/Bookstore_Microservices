import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination Component
 * Shows page numbers with abbreviated format (1 ... 4 5 6 ... 20)
 */
const Pagination = ({
  page = 1,
  totalPages = 1,
  onChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Show ellipsis if needed
      if (page > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(totalPages - 1, page + 1);

      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      // Show ellipsis if needed
      if (page < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onChange?.(newPage);
    }
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`.trim()}>
      {/* Previous button */}
      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center justify-center w-8 h-8 border border-border rounded-button hover:bg-surface-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed dark:border-border dark:hover:bg-surface"
        aria-label="Trang trước"
      >
        <ChevronLeft className="w-4 h-4 text-ink dark:text-ink" />
      </button>

      {/* Page numbers */}
      {pages.map((p, idx) => (
        <React.Fragment key={idx}>
          {p === '...' ? (
            <span className="px-2 text-ink-muted dark:text-ink-muted">...</span>
          ) : (
            <button
              onClick={() => handlePageChange(p)}
              className={`w-8 h-8 rounded-button transition-smooth font-medium ${
                p === page
                  ? 'bg-primary text-surface dark:bg-primary-light dark:text-ink'
                  : 'border border-border hover:bg-surface-muted dark:border-border dark:hover:bg-surface text-ink dark:text-ink'
              }`}
              aria-label={`Trang ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )}
        </React.Fragment>
      ))}

      {/* Next button */}
      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center justify-center w-8 h-8 border border-border rounded-button hover:bg-surface-muted transition-smooth disabled:opacity-50 disabled:cursor-not-allowed dark:border-border dark:hover:bg-surface"
        aria-label="Trang sau"
      >
        <ChevronRight className="w-4 h-4 text-ink dark:text-ink" />
      </button>
    </div>
  );
};

export default Pagination;
