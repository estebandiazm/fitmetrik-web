import React from 'react';
import { Card } from '@/components/ui/Card';
import styles from './AuthShell.module.css';

interface AuthShellProps {
  children: React.ReactNode;
  footerText?: string;
}

/**
 * Shared shell for auth pages (login, reset-password, update-password).
 * Renders the blurred background blobs and wraps children in the
 * design system's `.neu-card` (via `Card`), replacing the legacy
 * glassmorphism `.card` (backdrop-filter blur) each page used to own.
 */
export function AuthShell({
  children,
  footerText = `© ${new Date().getFullYear()} FitMetrik. All rights reserved.`,
}: AuthShellProps) {
  return (
    <div className={styles.page}>
      {/* BEGIN: Background Elements */}
      <div className={styles.bgElements}>
        <div className={`${styles.blobTeal} animate-pulse-slow`}></div>
        <div
          className={`${styles.blobBlue} animate-pulse-slow`}
          style={{ animationDelay: '2s' }}
        ></div>
      </div>
      {/* END: Background Elements */}

      <main className={styles.mainContent}>
        <Card as="section" padding="default" className="relative z-10">
          {children}
        </Card>

        <footer className={styles.pageFooter}>{footerText}</footer>
      </main>
    </div>
  );
}
