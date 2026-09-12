import { describe, it, expect } from 'vitest';
import { calculateDailyAverage } from '@/domain/services/stepsAverageService';
import type { DailyStep } from '@/domain/types/DailySteps';

describe('calculateDailyAverage', () => {
  it('returns 0 for an empty list', () => {
    expect(calculateDailyAverage([])).toBe(0);
  });

  it('averages a single entry', () => {
    const steps: DailyStep[] = [{ date: new Date('2026-04-13'), steps: 5000 }];
    expect(calculateDailyAverage(steps)).toBe(5000);
  });

  it('averages multiple entries and rounds to the nearest step', () => {
    const steps: DailyStep[] = [
      { date: new Date('2026-04-13'), steps: 5000 },
      { date: new Date('2026-04-14'), steps: 6000 },
      { date: new Date('2026-04-15'), steps: 7500 },
    ];
    // (5000 + 6000 + 7500) / 3 = 6166.67 → 6167
    expect(calculateDailyAverage(steps)).toBe(6167);
  });
});
