import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'success' | 'error';
}

const TONE_CLASSES: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'text-text-muted bg-locked-bg',
  // Brand-accent touchpoint (StatusPill's "has a plan" state renders through
  // this tone) — uses the new theme-aware accent-teal token, not the old
  // non-theme-aware --color-success, so dark mode theming works correctly.
  success: 'text-text-primary bg-accent-teal/20',
  // True negative/error semantic (unrelated to brand accent) — the theme's
  // warm clay danger token, same one the roster uses for low adherence.
  error: 'text-danger bg-danger/10',
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
