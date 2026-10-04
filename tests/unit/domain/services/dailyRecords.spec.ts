import { describe, it, expect } from 'vitest';
import { formatUTCDate, sortRecordsByDateDesc } from '@/domain/services/dailyRecords';

describe('formatUTCDate', () => {
  it('formats an ISO date string as a short UTC weekday/month/day label', () => {
    expect(formatUTCDate('2026-04-13T00:00:00.000Z')).toBe('Mon, Apr 13');
  });

  it('formats a Date using its UTC calendar day', () => {
    expect(formatUTCDate(new Date('2026-04-13T23:30:00.000Z'))).toBe('Mon, Apr 13');
  });

  it('ignores the time portion of a date-only string', () => {
    expect(formatUTCDate('2025-12-31')).toBe('Wed, Dec 31');
  });
});

describe('sortRecordsByDateDesc', () => {
  it('returns records newest first', () => {
    const records = [
      { date: new Date('2026-04-13'), id: 'a' },
      { date: new Date('2026-04-15'), id: 'c' },
      { date: new Date('2026-04-14'), id: 'b' },
    ];
    expect(sortRecordsByDateDesc(records).map((r) => r.id)).toEqual(['c', 'b', 'a']);
  });

  it('accepts string dates', () => {
    const records = [
      { date: '2026-04-13T00:00:00.000Z', id: 'a' },
      { date: '2026-04-14T00:00:00.000Z', id: 'b' },
    ];
    expect(sortRecordsByDateDesc(records).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('does not mutate the input array', () => {
    const records = [
      { date: new Date('2026-04-13'), id: 'a' },
      { date: new Date('2026-04-14'), id: 'b' },
    ];
    sortRecordsByDateDesc(records);
    expect(records.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('returns an empty array for no records', () => {
    expect(sortRecordsByDateDesc([])).toEqual([]);
  });
});
