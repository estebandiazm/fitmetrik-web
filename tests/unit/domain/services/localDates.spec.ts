import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { parseLocalISODate, toLocalISODate } from '@/domain/services/localDates';
import { buildMeasurementSeries } from '@/domain/services/bodyMeasurements';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';

// Pin a timezone west of UTC (UTC−5, no DST) — where UTC parsing of a
// date-only string lands on the previous local day.
const originalTZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'America/Bogota';
});
afterAll(() => {
  if (originalTZ === undefined) delete process.env.TZ;
  else process.env.TZ = originalTZ;
});

describe('parseLocalISODate', () => {
  it('returns local midnight of the same calendar day west of UTC', () => {
    const date = parseLocalISODate('2026-10-03');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(3);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
  });

  it('handles month and year boundaries', () => {
    const date = parseLocalISODate('2026-01-01');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 0, 1]);
  });
});

describe('toLocalISODate', () => {
  it('uses the local calendar day late in the evening west of UTC', () => {
    expect(toLocalISODate(new Date(2026, 9, 3, 21, 30))).toBe('2026-10-03');
  });

  it('zero-pads month and day', () => {
    expect(toLocalISODate(new Date(2026, 0, 5, 8))).toBe('2026-01-05');
  });

  it('round-trips with parseLocalISODate', () => {
    expect(toLocalISODate(parseLocalISODate('2026-12-31'))).toBe('2026-12-31');
  });
});

describe('buildMeasurementSeries (west of UTC)', () => {
  it('buckets a local-midnight entry on its local day, even late in the evening', () => {
    const now = new Date(2026, 9, 3, 21, 30);
    const data: BodyMeasurement[] = [
      { date: parseLocalISODate('2026-10-03'), pointSlug: 'cintura', valueCm: 80 },
      { date: parseLocalISODate('2026-10-02'), pointSlug: 'cintura', valueCm: 81 },
    ];
    const series = buildMeasurementSeries(data, 'cintura', 3, now);
    expect(series.map((p) => p.value)).toEqual([null, 81, 80]);
  });

  it('buckets by the local calendar day, not the UTC day', () => {
    const now = new Date(2026, 9, 3, 12);
    // 21:00 local on Oct 2 is already Oct 3 in UTC.
    const data: BodyMeasurement[] = [
      { date: new Date(2026, 9, 2, 21, 0), pointSlug: 'cintura', valueCm: 79 },
    ];
    const series = buildMeasurementSeries(data, 'cintura', 2, now);
    expect(series.map((p) => p.value)).toEqual([79, null]);
  });
});
