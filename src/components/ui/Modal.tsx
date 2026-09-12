'use client';

import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  bodyScrollLock,
  computeKeyboardInset,
  resolveSurfaceScope,
} from './modal-helpers';

export const SURFACE_SCOPE = {
  client: 'surface-client',
  coach: 'surface-coach',
} as const;

export type SurfaceScope = (typeof SURFACE_SCOPE)[keyof typeof SURFACE_SCOPE];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Wired to `aria-labelledby`. */
  title: string;
  /** Scrollable body. */
  children: ReactNode;
  /** Sticky footer, offset above the on-screen keyboard. */
  footer?: ReactNode;
  /** Omitted → auto-detected from the nearest `.surface-*` ancestor. */
  surfaceScope?: SurfaceScope;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  size?: 'sm' | 'md' | 'lg';
  testId?: string;
}

const SIZE_CLASSES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

const subscribeNoop = () => () => {};

function detectSurfaceScope(anchor: Element | null): string | null {
  const scoped = anchor?.closest(`.${SURFACE_SCOPE.client}, .${SURFACE_SCOPE.coach}`);
  if (!scoped) return null;
  return scoped.classList.contains(SURFACE_SCOPE.client)
    ? SURFACE_SCOPE.client
    : SURFACE_SCOPE.coach;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  surfaceScope,
  initialFocusRef,
  closeOnBackdrop = true,
  closeOnEscape = true,
  size = 'md',
  testId,
}: ModalProps) {
  const [scopeClass, setScopeClass] = useState<string | null>(surfaceScope ?? null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // `document` is absent during SSR under Next 16 — defer the portal to the
  // client without an effect or a hydration mismatch.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  // Re-apply the active surface-scope token context on the portal root so
  // scoped tokens (`--radius-card`, `--space-card-p`, …) resolve identically
  // to an in-tree render.
  useEffect(() => {
    if (!open) return;
    setScopeClass(resolveSurfaceScope(surfaceScope, detectSurfaceScope(anchorRef.current)));
  }, [open, surfaceScope]);

  // Reference-counted body scroll lock.
  useEffect(() => {
    if (!open) return;
    bodyScrollLock.lock();
    return () => bodyScrollLock.unlock();
  }, [open]);

  // Focus trap: capture the trigger, focus into the panel, restore on close.
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const target = initialFocusRef?.current ?? getFocusable(panelRef.current)[0] ?? panelRef.current;
    target?.focus();

    return () => {
      previouslyFocused.current?.focus();
    };
  }, [open, initialFocusRef]);

  // iOS keyboard inset — `dvh` alone does not shrink for the software keyboard.
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      setKeyboardInset(computeKeyboardInset(window.innerHeight, vv.height, vv.offsetTop));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      setKeyboardInset(0);
    };
  }, [open]);

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      if (closeOnEscape) {
        event.stopPropagation();
        onClose();
      }
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusable(panelRef.current);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || !panelRef.current?.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const overlayStyle: CSSProperties | undefined = keyboardInset
    ? { paddingBottom: keyboardInset }
    : undefined;

  const panelClassName = [
    'neu-card',
    'flex w-full flex-col overflow-hidden',
    'max-h-[85dvh] sm:max-h-[90dvh]',
    'max-sm:rounded-b-none',
    SIZE_CLASSES[size],
  ].join(' ');

  const overlayClassName = [
    'fixed inset-0 z-50 flex justify-center items-end sm:items-center',
    'bg-black/50 p-0 sm:p-4',
    scopeClass,
  ]
    .filter(Boolean)
    .join(' ');

  const portal =
    mounted && open
      ? createPortal(
          <div
            className={overlayClassName}
            style={overlayStyle}
            onClick={closeOnBackdrop ? onClose : undefined}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid={testId}
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={handlePanelKeyDown}
              className={panelClassName}
            >
              <div className="border-b border-[var(--surface-border)] p-[var(--space-card-p)]">
                <h2 id={titleId} className="text-lg font-bold text-on-surface">
                  {title}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-[var(--space-card-p)]">{children}</div>

              {footer ? (
                <div className="border-t border-[var(--surface-border)] p-[var(--space-card-p)]">
                  {footer}
                </div>
              ) : null}
            </div>
          </div>,
          document.body,
        )
      : null;

  // The sentinel stays in place (NOT inside the portal) so `closest()` can
  // walk the real ancestor chain to find the active surface scope.
  return (
    <>
      <span ref={anchorRef} hidden aria-hidden="true" />
      {portal}
    </>
  );
}
