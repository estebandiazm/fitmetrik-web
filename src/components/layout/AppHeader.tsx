'use client';

import { useTransition, type ReactNode } from 'react';

import { logout } from '@/app/actions/authActions';

interface AppHeaderProps {
  /** Display name shown next to the avatar. */
  userName: string;
  /** Optional secondary line under the name (e.g. the coach's email). */
  userSubtitle?: string;
  /** Optional center content — a search field, contextual nav, etc. */
  center?: ReactNode;
}

/**
 * Shared top bar for both the coach dashboard and the client portal.
 * Chrome (surface, wordmark, profile, sign-out) is identical across surfaces;
 * only the `center` slot differs.
 */
export function AppHeader({ userName, userSubtitle, center }: AppHeaderProps) {
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-[var(--surface-border)] bg-surface-container px-6 py-4">
      {/* Wordmark */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xl font-bold tracking-tight text-on-surface">
          Fit<span className="text-primary">Metrik</span>
        </span>
      </div>

      {/* Center slot */}
      {center ? (
        <div className="flex min-w-0 flex-1 justify-center">{center}</div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Profile */}
      <div className="flex shrink-0 items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-on-surface">{userName}</p>
          {userSubtitle && (
            <p className="text-xs text-on-surface-muted">{userSubtitle}</p>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
          {userName.charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => startSignOut(() => logout())}
          disabled={isSigningOut}
          aria-label="Sign out"
          title="Sign out"
          className="flex items-center gap-1.5 rounded-[var(--radius-control)] border border-[var(--surface-border)] px-3 py-1.5 text-sm font-medium text-on-surface-muted transition-colors hover:bg-surface-container-high hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span className="hidden sm:inline">
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </span>
        </button>
      </div>
    </header>
  );
}
