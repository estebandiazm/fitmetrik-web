import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...rest }: InputProps) {
  return (
    <input
      className={`neu-inset rounded-[var(--radius-control)] border border-transparent px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-teal ${className}`}
      {...rest}
    />
  );
}
