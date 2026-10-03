'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'accent' | 'surface' | 'ghost';
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  accent: 'neu-btn-accent',
  surface: 'neu-btn text-text-primary',
  ghost: 'bg-transparent text-text-muted hover:text-text-primary',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-5 py-3 text-sm',
};

export function Button({
  children,
  className = '',
  variant = 'accent',
  size = 'md',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold active:scale-95 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-teal disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
