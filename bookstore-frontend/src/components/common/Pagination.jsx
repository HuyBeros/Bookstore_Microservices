import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

/**
 * Pagination: điều hướng trang
 */
const Pagination = ({ page = 1, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        icon={ChevronLeft}
        iconPosition="left"
      >
        Trước
      </Button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="px-2 py-1 text-ink-muted">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`min-w-[40px] h-10 rounded-lg font-medium transition-colors ${
              page === p
                ? 'bg-primary text-white shadow-sm'
                : 'bg-paper text-ink-muted hover:bg-parchment hover:text-ink border border-border'
            }`}
          >
            {p}
          </button>
        )
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        icon={ChevronRight}
        iconPosition="right"
      >
        Sau
      </Button>
    </div>
  );
};

export default Pagination;
