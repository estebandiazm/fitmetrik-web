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
  surface: 'neu-btn text-on-surface',
  ghost: 'bg-transparent text-on-surface-muted hover:text-on-surface',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-6 py-2.5 text-sm',
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
      className={`${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} rounded-[var(--radius-control)] font-bold active:scale-95 transition-transform ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
