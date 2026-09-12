/**
 * Pure, framework-free helpers backing the `ui/Modal` primitive.
 *
 * Everything DOM-behavioural in `Modal.tsx` (focus trap, portal, event
 * wiring) has no unit-test harness in this project (Vitest runs in `node`
 * with no jsdom/RTL — see design D-testing). The logic that CAN be made
 * pure lives here so it stays covered by `yarn test:unit`.
 */

/** Overflow-bearing style target — `document.body` satisfies this structurally. */
interface ScrollLockTarget {
  style: { overflow: string };
}

/**
 * Height, in CSS pixels, of the layout viewport currently hidden behind the
 * on-screen keyboard / browser chrome.
 *
 * `dvh` units do not shrink for the iOS software keyboard, so a sticky
 * footer would sit under it. We subscribe to `visualViewport` and pad the
 * overlay by this amount instead.
 */
export function computeKeyboardInset(
  windowInnerHeight: number,
  visualViewportHeight: number,
  visualViewportOffsetTop: number,
): number {
  return Math.max(0, windowInnerHeight - (visualViewportHeight + visualViewportOffsetTop));
}

/**
 * Resolve which surface-scope class the portal root should carry.
 *
 * An explicit `surfaceScope` prop always wins; otherwise we use the class
 * detected by walking up from the in-place sentinel; otherwise `null`
 * (nothing to re-apply).
 */
export function resolveSurfaceScope(
  explicit: string | undefined,
  detected: string | null | undefined,
): string | null {
  return explicit ?? detected ?? null;
}

/**
 * Reference-counted body scroll lock.
 *
 * The primitive targets multiple concurrent adopters; a naive per-instance
 * lock would unlock the page while a second modal is still open. The count
 * is shared across every `Modal` instance via the module-level
 * `bodyScrollLock` singleton below. `getTarget` is injectable so the
 * counter logic stays testable without a DOM.
 */
export function createScrollLock(getTarget: () => ScrollLockTarget | null) {
  let count = 0;
  let previousOverflow = '';

  return {
    lock(): void {
      const target = getTarget();
      if (!target) return;
      if (count === 0) {
        previousOverflow = target.style.overflow;
        target.style.overflow = 'hidden';
      }
      count += 1;
    },
    unlock(): void {
      const target = getTarget();
      if (!target || count === 0) return;
      count -= 1;
      if (count === 0) {
        target.style.overflow = previousOverflow;
      }
    },
    get count(): number {
      return count;
    },
  };
}

/** Process-wide scroll lock shared by every `Modal` instance. */
export const bodyScrollLock = createScrollLock(() =>
  typeof document !== 'undefined' ? document.body : null,
);
