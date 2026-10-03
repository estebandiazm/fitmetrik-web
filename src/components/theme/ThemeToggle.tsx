'use client';

import { THEMES, useTheme } from './ThemeProvider';

/**
 * Icon button that flips the app between light and dark theme.
 *
 * Both the sun and moon SVGs always render — which one is visible is decided
 * by plain CSS keyed off the already-applied `data-theme` attribute (see
 * `.theme-toggle-icon` in globals.css), not by React state. That keeps the
 * markup identical between server and client render (no hydration
 * mismatch) and shows the correct icon before any JS runs (no flash).
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === THEMES.DARK;
  const label = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      // `theme` is always 'light' during SSR and may already be 'dark' on
      // the client (read from the attribute the no-flash script set before
      // hydration), so this label/title can legitimately differ between the
      // server and client render for dark-theme users — an expected,
      // harmless mismatch, same as React's own documented
      // locale/timestamp example for this prop.
      suppressHydrationWarning
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-border-strong bg-transparent text-text-faint transition-colors hover:text-text-primary"
    >
      <svg
        className="theme-toggle-icon"
        data-icon="moon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
      </svg>
      <svg
        className="theme-toggle-icon"
        data-icon="sun"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
        <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
      </svg>
    </button>
  );
}
