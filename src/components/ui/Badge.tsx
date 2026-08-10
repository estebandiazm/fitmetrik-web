import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'success' | 'error';
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'text-on-surface-muted bg-surface-container-high',
  success: 'text-success bg-success/10',
  error: 'text-error bg-error/10',
};

export function Badge({ children, className = '', tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
