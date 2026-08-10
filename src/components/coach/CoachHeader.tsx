'use client';

import { Input } from '../ui/Input';

interface CoachHeaderProps {
  coachName: string;
  coachEmail: string;
}

export function CoachHeader({ coachName, coachEmail }: CoachHeaderProps) {
  return (
    <header className="bg-surface-container border-b border-[var(--surface-border)] px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-on-surface tracking-tight">
          Fit<span className="text-primary">Metrik</span>
        </span>
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8">
        <Input type="search" placeholder="Search clients..." className="w-full" />
      </div>

      {/* Profile */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-on-surface">{coachName}</p>
          <p className="text-xs text-on-surface-muted">{coachEmail}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-semibold text-sm">
          {coachName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
