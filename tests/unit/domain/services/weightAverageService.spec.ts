import { describe, it, expect } from 'vitest';
import {
  calculateWeeklyAverage,
  getWeightMetrics,
  summarizeWeights,
} from '@/domain/services/weightAverageService';
import type { DailyWeight } from '@/domain/types/DailyWeight';

describe('calculateWeeklyAverage', () => {
  it('should calculate average when all 7 days have entries', () => {
    const weights: DailyWeight[] = [
      { date: new Date('2026-04-13'), weight: 80 },
      { date: new Date('2026-04-14'), weight: 80.5 },
      { date: new Date('2026-04-15'), weight: 81 },
      { date: new Date('2026-04-16'), weight: 81.5 },
      { date: new Date('2026-04-17'), weight: 82 },
      { date: new Date('2026-04-18'), weight: 82.5 },
      { date: new Date('2026-04-19'), weight: 83 },
    ];
    const avg = calculateWeeklyAverage(
      weights,
      new Date('2026-04-13'),
      new Date('2026-04-19')
    );
    // (80 + 80.5 + 81 + 81.5 + 82 + 82.5 + 83) / 7 = 570.5 / 7 ≈ 81.5
    expect(avg).toBeCloseTo(81.5, 1);
  });

  it('should forward-fill missing days with previous day weight', () => {
    const weights: DailyWeight[] = [
      { date: new Date('2026-04-13'), weight: 80 },
      // 2026-04-14 is missing → forward-fill from 80
      { date: new Date('2026-04-15'), weight: 82 },
      // 2026-04-16 through 2026-04-19 missing → forward-fill from 82
    ];
    // Filled: 80, 80, 82, 82, 82, 82, 82 = 570 / 7 ≈ 81.43
    const avg = calculateWeeklyAverage(
      weights,
      new Date('2026-04-13'),
      new Date('2026-04-19')
    );
    expect(avg).toBeCloseTo(81.43, 1);
  });

  it('should return null when no weights in period', () => {
    const avg = calculateWeeklyAverage(
      [],
      new Date('2026-04-13'),
      new Date('2026-04-19')
    );
    expect(avg).toBeNull();
  });

  it('should fill with 0 when no previous weight exists before an entry', () => {
    // Only entry is on day 5 of a 7-day period
    // Days 1-4: 0 (no prior), Days 5-7: 80 (forward-fill)
    // Sum: 0 + 0 + 0 + 0 + 80 + 80 + 80 = 240 / 7 ≈ 34.286... wait
    // Per spec: fill with 0 when no previous — REQ-DWT-03
    // Apr13=0, Apr14=0, Apr15=0, Apr16=0, Apr17=80, Apr18=80, Apr19=80
    // Sum = 0+0+0+0+80+80+80 = 240 / 7 ≈ 34.29
    const weights: DailyWeight[] = [
      { date: new Date('2026-04-17'), weight: 80 },
    ];
    const avg = calculateWeeklyAverage(
      weights,
      new Date('2026-04-13'),
      new Date('2026-04-19')
    );
    expect(avg).toBeCloseTo(34.29, 1);
  });

  it('should handle a single entry on the first day', () => {
    const weights: DailyWeight[] = [
      { date: new Date('2026-04-13'), weight: 70 },
    ];
    // Forward-fill: 70 × 7 = 490 / 7 = 70
    const avg = calculateWeeklyAverage(
      weights,
      new Date('2026-04-13'),
      new Date('2026-04-19')
    );
    expect(avg).toBeCloseTo(70, 1);
  });

  it('should ignore entries outside the date range', () => {
    const weights: DailyWeight[] = [
      { date: new Date('2026-04-10'), weight: 999 }, // Before range — ignored
      { date: new Date('2026-04-13'), weight: 70 },
      { date: new Date('2026-04-25'), weight: 999 }, // After range — ignored
    ];
    const avg = calculateWeeklyAverage(
      weights,
      new Date('2026-04-13'),
      new Date('2026-04-19')
    );
    expect(avg).toBeCloseTo(70, 1);
  });
});

describe('getWeightMetrics', () => {
  it('should return min, max, and avg for a set of entries', () => {
    const weights: DailyWeight[] = [
      { date: new Date('2026-04-19'), weight: 80 },
      { date: new Date('2026-04-18'), weight: 85 },
      { date: new Date('2026-04-17'), weight: 75 },
    ];
    const metrics = getWeightMetrics(weights);
    expect(metrics.min).toBe(75);
    expect(metrics.max).toBe(85);
    expect(metrics.avg).toBeCloseTo(80, 1);
  });

  it('should return null for all metrics when array is empty', () => {
    const metrics = getWeightMetrics([]);
    expect(metrics.min).toBeNull();
    expect(metrics.max).toBeNull();
    expect(metrics.avg).toBeNull();
  });

  it('should handle a single entry', () => {
    const weights: DailyWeight[] = [
      { date: new Date('2026-04-19'), weight: 72.5 },
    ];
    const metrics = getWeightMetrics(weights);
    expect(metrics.min).toBe(72.5);
    expect(metrics.max).toBe(72.5);
    expect(metrics.avg).toBeCloseTo(72.5, 1);
  });
});

describe('summarizeWeights', () => {
  const at = (day: number, weight: number) => ({ date: new Date(2026, 3, day), weight });

  it('returns the latest (last recorded), lightest and heaviest weights', () => {
    expect(summarizeWeights([at(1, 80), at(2, 78.5), at(3, 79)])).toEqual({
      latest: 79,
      lightest: 78.5,
      heaviest: 80,
    });
  });

  it('returns null when there are no weights', () => {
    expect(summarizeWeights([])).toBeNull();
  });
});
