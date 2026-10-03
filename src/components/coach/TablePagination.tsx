'use client';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const BUTTON_CLASSES =
  'rounded-[var(--radius-control)] border border-border px-3 py-1.5 text-text-muted transition-colors hover:bg-locked-bg hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40';

export function TablePagination({ page, totalPages, onPageChange }: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between text-sm text-text-muted">
      <span className="font-mono text-xs">
        {page + 1}/{totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 0} className={BUTTON_CLASSES}>
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages - 1}
          className={BUTTON_CLASSES}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
