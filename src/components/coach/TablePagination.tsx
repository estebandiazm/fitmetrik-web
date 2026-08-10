'use client';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({ page, totalPages, onPageChange }: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between text-sm text-on-surface-muted">
      <span>
        Page {page + 1} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--surface-border)] text-on-surface-muted hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages - 1}
          className="px-3 py-1.5 rounded-[var(--radius-control)] border border-[var(--surface-border)] text-on-surface-muted hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
