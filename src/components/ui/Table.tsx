import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead>{children}</thead>;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}

export function TableRow({ children, className = '', header = false }: TableRowProps) {
  const base = header
    ? 'text-on-surface-muted text-xs uppercase tracking-wider'
    : 'hover:bg-surface-container-high/40 transition-colors';
  return <tr className={`border-b border-[var(--surface-border)] ${base} ${className}`}>{children}</tr>;
}

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  as?: 'td' | 'th';
}

export function TableCell({ children, className = '', as: Tag = 'td', ...rest }: TableCellProps) {
  const basePadding = Tag === 'th' ? 'px-5 py-3' : 'px-5 py-4';
  return (
    <Tag className={`${basePadding} text-left ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
