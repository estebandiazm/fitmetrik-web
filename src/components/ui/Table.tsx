import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm text-text-primary">{children}</table>
    </div>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
}

export function TableHead({ children }: TableHeadProps) {
  return <thead>{children}</thead>;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}

export function TableRow({ children, className = '', header = false }: TableRowProps) {
  const base = header
    ? 'text-text-muted text-xs uppercase tracking-wider'
    : 'hover:bg-row-border transition-colors';
  const border = header ? 'border-border' : 'border-row-border';
  return <tr className={`border-b ${border} ${base} ${className}`}>{children}</tr>;
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
