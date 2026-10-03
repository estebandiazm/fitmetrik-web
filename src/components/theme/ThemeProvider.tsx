'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

// src/app/layout.tsx's pre-paint inline script duplicates this exact string
// as a literal rather than importing it — that file is a Server Component,
// and importing a plain value (not a component) from this 'use client'
// module there resolves to an RSC client-reference proxy, not the actual
// string. Keep both literals in sync if this key ever changes.
export const THEME_STORAGE_KEY = 'fitmetrik-theme';

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

function isTheme(value: string | null): value is Theme {
  return value === THEMES.LIGHT || value === THEMES.DARK;
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage can throw in restrictive contexts (private browsing,
    // disabled storage) — the attribute is still applied for this session.
  }
}

function readAppliedTheme(): Theme {
  // `document` is unavailable during SSR, so this (and the initial React
  // state below) is always 'light' on the server — matching the CSS's
  // unattributed :root default. On the client it reads the attribute the
  // no-flash inline script already set before hydration, which may be
  // 'dark'. Consumers of `theme` must not branch their *rendered markup* on
  // it directly (that would be a real server/client hydration mismatch for
  // dark-theme users) — drive visual differences from the `data-theme`
  // attribute via CSS instead, and reserve `theme` for behavior/ARIA text,
  // guarded with `suppressHydrationWarning` where needed (see ThemeToggle).
  if (typeof document === 'undefined') {
    return THEMES.LIGHT;
  }
  const current = document.documentElement.getAttribute('data-theme');
  return isTheme(current) ? current : THEMES.LIGHT;
}

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provides the current light/dark theme and persists changes.
 *
 * The inline script in `src/app/layout.tsx` already sets
 * `document.documentElement[data-theme]` synchronously before paint (reading
 * localStorage, falling back to `prefers-color-scheme`), so there is no
 * flash of the wrong theme. This provider seeds its state from that
 * already-applied attribute via a lazy initializer (not an effect) so no
 * extra render is needed to pick it up.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(readAppliedTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  // Derives `next` from the current `theme` closure rather than inside the
  // setState updater — updater functions must stay pure (React may invoke
  // them more than once), so the `applyTheme` side effect runs alongside the
  // state update instead, the same way `setTheme` already does it.
  const toggleTheme = useCallback(() => {
    const next = theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setThemeState(next);
    applyTheme(next);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
