import type { Metadata } from "next";
import ClientProvider from "../context/ClientContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import "./globals.css";

// Applies the persisted (or OS-preferred) theme to <html> synchronously,
// before first paint, so there is no flash of the wrong theme. ThemeProvider
// later seeds its React state from the attribute this script sets.
//
// The storage key below is intentionally a literal duplicate of
// THEME_STORAGE_KEY in ThemeProvider.tsx rather than an import: this file is
// a Server Component, and importing a plain value (not a component) from a
// 'use client' module here resolves to a server/RSC client-reference proxy,
// not the actual string — interpolating it silently serializes garbage into
// the script. Keep both literals in sync if the key ever changes.
const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem('fitmetrik-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    // localStorage/matchMedia can throw in restrictive contexts — fall back
    // to the CSS's unattributed :root default (light).
  }
})();
`;

export const metadata: Metadata = {
  title: "FitMetrik",
  description: "Plataforma de gestión para nutricionistas y clientes",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
        {/* Global icon font for the whole app, loaded once from the root layout — the
            rule's "loads for a single page only" concern does not apply here. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        <ClientProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClientProvider>
      </body>
    </html>
  );
}