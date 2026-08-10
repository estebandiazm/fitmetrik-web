import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...rest }: InputProps) {
  return (
    <input
      className={`neu-inset rounded-[var(--radius-control)] border border-transparent px-4 py-2 text-sm text-on-surface placeholder-on-surface-muted focus:outline-none focus:border-primary ${className}`}
      {...rest}
    />
  );
}
