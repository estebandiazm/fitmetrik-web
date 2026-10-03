import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...rest }: InputProps) {
  return (
    <input
      className={`rounded-[var(--radius-control)] border border-border bg-panel px-4 py-2.5 text-sm text-text-primary placeholder:text-text-faint transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20 ${className}`}
      {...rest}
    />
  );
}
