import React from 'react';
import styles from './AuthShell.module.css';

interface AuthShellProps {
  children: React.ReactNode;
  footerText?: string;
}

const SHEET_COLUMNS = 10;
const SHEET_ROWS = 9;

// Deterministic pseudo-random stagger (no Math.random → identical server and
// client markup) so the backdrop cells pop in a scattered, organic order.
const SHEET_CELLS = Array.from({ length: SHEET_COLUMNS * SHEET_ROWS }, (_, i) => ({
  delayS: ((i * 37) % 90) / 10,
}));

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const FILLED_DAYS = 4;

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * Shared shell for auth pages (login, reset-password, update-password):
 * an animated blister-sheet backdrop, a brand panel on wide screens that
 * fills a week strip cell by cell, and the form card.
 */
export function AuthShell({
  children,
  footerText = `© ${new Date().getFullYear()} FitMetrik`,
}: AuthShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.sheetWrap} aria-hidden="true">
        <div className={styles.sheet}>
          {SHEET_CELLS.map((cell, i) => (
            <span key={i} className={styles.sheetCell} style={{ animationDelay: `${cell.delayS}s` }} />
          ))}
        </div>
      </div>

      <aside className={styles.brand}>
        <div className={`${styles.wordmark} animate-enter`}>
          <span aria-hidden="true" className="blister-cell-popped h-5 w-5 rounded-[6px]" />
          FitMetrik
        </div>

        <div className={styles.brandBody}>
          <p className={`${styles.headline} animate-enter`} style={{ '--enter-delay': '120ms' } as React.CSSProperties}>
            El plan no es un documento para leer.{' '}
            <span className={styles.headlineMuted}>Es una dosis para tomar.</span>
          </p>

          <div className="animate-enter flex flex-col gap-3" style={{ '--enter-delay': '240ms' } as React.CSSProperties}>
            <ol className={styles.strip} aria-hidden="true">
              {WEEK.map((day, i) => {
                const filled = i < FILLED_DAYS;
                return (
                  <li key={i} className={styles.stripDay}>
                    {day}
                    <span
                      className={`${styles.stripCell} ${filled ? styles.stripCellFill : styles.stripCellLocked}`}
                      style={filled ? { animationDelay: `${700 + i * 260}ms` } : undefined}
                    >
                      {filled ? <CheckIcon /> : <LockIcon />}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className={styles.count}>
              <span className={styles.countValue}>{FILLED_DAYS}</span>
              <span className={styles.countRest}>/7 esta semana</span>
            </p>
          </div>
        </div>

        <p className={styles.brandFoot}>Cada día es una celda que se registra o se queda vacía.</p>
      </aside>

      <main className={styles.formColumn}>
        <section className={`${styles.card} animate-enter`} style={{ '--enter-delay': '60ms' } as React.CSSProperties}>
          {children}
        </section>
        <footer className={styles.pageFooter}>{footerText}</footer>
      </main>
    </div>
  );
}
