import { describe, it, expect, vi, afterEach } from 'vitest';
import { todayLocalISO, parseLocalDate } from '@/lib/utils/local-date';

afterEach(() => {
  vi.useRealTimers();
});

describe('parseLocalDate', () => {
  it('parses a YYYY-MM-DD string as local midnight, not UTC midnight', () => {
    const d = parseLocalDate('2026-03-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // 0-indexed: March
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });

  it('round-trips with todayLocalISO regardless of the host timezone offset', () => {
    // The bug this guards: `new Date('2026-01-01')` parses as UTC midnight,
    // which in a negative-offset zone (e.g. UTC-5) is still Dec 31 locally —
    // a silent off-by-one once re-interpreted as a local Date.
    const iso = '2026-01-01';
    const parsed = parseLocalDate(iso);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(0);
    expect(parsed.getDate()).toBe(1);
  });
});

describe('todayLocalISO', () => {
  it('formats the current local date as YYYY-MM-DD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 7, 23, 45)); // Jun 7 2026, 23:45 local
    expect(todayLocalISO()).toBe('2026-06-07');
  });

  it('pads single-digit month and day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 10, 0)); // Jan 5 2026
    expect(todayLocalISO()).toBe('2026-01-05');
  });

  it('never drifts a day via a UTC round-trip, even late in the local day', () => {
    // This is the exact failure mode the bug had: toISOString() renders the
    // UTC date, which is already "tomorrow" locally once UTC has rolled over.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 10, 23, 59)); // Mar 10 2026, 23:59 local
    expect(todayLocalISO()).toBe('2026-03-10');
  });
});
