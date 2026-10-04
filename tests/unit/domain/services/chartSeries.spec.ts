import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { bucketByLocalDay } from '@/domain/services/chartSeries';

// UTC−5, no DST: 21:00 local is already the next day in UTC.
const originalTZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'America/Bogota';
});
afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

const now = () => new Date(2026, 9, 3, 12, 0); // Oct 3, 12:00 local

describe('bucketByLocalDay', () => {
  it('returns one bucket per day, oldest first, ending today', () => {
    const buckets = bucketByLocalDay([], 7, now());
    expect(buckets).toHaveLength(7);
    expect(buckets[0].label).toBe('Sep 27');
    expect(buckets[6].label).toBe('Oct 3');
    expect(buckets.every((b) => b.entry === undefined)).toBe(true);
  });

  it('puts an entry recorded at 21:00 local on its local day, not the UTC day', () => {
    const entry = { date: new Date(2026, 9, 2, 21, 0), steps: 5000 };
    const buckets = bucketByLocalDay([entry], 7, now());
    expect(buckets[5].label).toBe('Oct 2');
    expect(buckets[5].entry).toBe(entry);
    expect(buckets[6].entry).toBeUndefined();
  });

  it('accepts serialized ISO date strings', () => {
    const entry = { date: new Date(2026, 9, 2, 21, 0).toISOString(), weight: 70 };
    const buckets = bucketByLocalDay([entry], 7, now());
    expect(buckets[5].entry).toBe(entry);
  });

  it('keeps the first entry when a day has several', () => {
    const first = { date: new Date(2026, 9, 3, 8, 0), steps: 1 };
    const second = { date: new Date(2026, 9, 3, 18, 0), steps: 2 };
    expect(bucketByLocalDay([first, second], 7, now())[6].entry).toBe(first);
  });

  it('ignores entries outside the window', () => {
    const old = { date: new Date(2026, 8, 1, 10, 0), steps: 1 };
    expect(bucketByLocalDay([old], 7, now()).every((b) => b.entry === undefined)).toBe(true);
  });
});
