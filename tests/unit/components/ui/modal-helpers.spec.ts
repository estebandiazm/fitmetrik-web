import { describe, it, expect } from 'vitest';
import {
  computeKeyboardInset,
  resolveSurfaceScope,
  createScrollLock,
} from '@/components/ui/modal-helpers';

describe('computeKeyboardInset', () => {
  it('returns the hidden viewport height when the keyboard is open', () => {
    // 800px layout viewport, 500px visible → 300px covered by the keyboard
    expect(computeKeyboardInset(800, 500, 0)).toBe(300);
  });

  it('returns 0 when the visual viewport fills the layout viewport', () => {
    expect(computeKeyboardInset(800, 800, 0)).toBe(0);
  });

  it('clamps to 0 when the visual viewport is reported larger than the window', () => {
    expect(computeKeyboardInset(800, 900, 0)).toBe(0);
  });

  it('accounts for the visual viewport vertical offset', () => {
    // 800 - (600 + 100) = 100
    expect(computeKeyboardInset(800, 600, 100)).toBe(100);
  });
});

describe('resolveSurfaceScope', () => {
  it('prefers the explicit scope over the detected one', () => {
    expect(resolveSurfaceScope('surface-coach', 'surface-client')).toBe('surface-coach');
  });

  it('falls back to the detected scope when no explicit scope is given', () => {
    expect(resolveSurfaceScope(undefined, 'surface-client')).toBe('surface-client');
  });

  it('returns null when neither an explicit nor a detected scope exists', () => {
    expect(resolveSurfaceScope(undefined, null)).toBeNull();
    expect(resolveSurfaceScope(undefined, undefined)).toBeNull();
  });
});

describe('createScrollLock', () => {
  it('sets overflow hidden on the first lock and stores the previous inline value', () => {
    const target = { style: { overflow: 'scroll' } };
    const lock = createScrollLock(() => target);

    lock.lock();

    expect(target.style.overflow).toBe('hidden');
    expect(lock.count).toBe(1);
  });

  it('keeps the page locked while any holder is still open and restores the previous value at zero', () => {
    const target = { style: { overflow: 'scroll' } };
    const lock = createScrollLock(() => target);

    lock.lock();
    lock.lock();
    lock.unlock();

    expect(target.style.overflow).toBe('hidden');
    expect(lock.count).toBe(1);

    lock.unlock();

    expect(target.style.overflow).toBe('scroll');
    expect(lock.count).toBe(0);
  });

  it('is a no-op when unlocking without a matching lock', () => {
    const target = { style: { overflow: '' } };
    const lock = createScrollLock(() => target);

    lock.unlock();

    expect(target.style.overflow).toBe('');
    expect(lock.count).toBe(0);
  });

  it('does nothing when the target is unavailable', () => {
    const lock = createScrollLock(() => null);
    expect(() => lock.lock()).not.toThrow();
    expect(lock.count).toBe(0);
  });
});
