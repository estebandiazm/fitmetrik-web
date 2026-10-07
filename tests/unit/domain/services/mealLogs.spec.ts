import { describe, it, expect } from 'vitest';
import {
  buildCarbPoolDay,
  expressInOptions,
  findPreviousLog,
  getCarbPoolOptions,
  isWithinLogWindow,
  previewWithLog,
  remainingForMeal,
  usedByMeal,
  removeMealLog,
  roundAmount,
  shiftISODate,
  suggestAmounts,
  upsertMealLog,
} from '@/domain/services/mealLogs';
import type { DietPlan } from '@/domain/types/DietPlan';
import type { MealLog } from '@/domain/types/MealLog';

const PLAN: DietPlan = {
  meals: [
    {
      mealName: 'Comida 1',
      blocks: [{ blockType: 'ACOMPAÑAMIENTO', options: [{ foodName: 'Avena', grams: 110, measureUnit: 'g' }] }],
    },
    {
      mealName: 'Comida 2',
      blocks: [
        { blockType: 'BASE', options: [{ foodName: 'Pechuga de pollo', grams: 165, measureUnit: 'g' }] },
        {
          blockType: 'ACOMPAÑAMIENTO',
          options: [
            { foodName: 'Arroz (peso cocido)', grams: 322, measureUnit: 'g' },
            { foodName: 'Papa (peso cocido)', grams: 478, measureUnit: 'g' },
            { foodName: 'Tortillas', grams: 3, measureUnit: 'ud' },
          ],
        },
      ],
    },
    {
      mealName: 'Comida 3',
      blocks: [{ blockType: 'BASE', options: [{ foodName: 'Pechuga de pollo', grams: 165, measureUnit: 'g' }] }],
    },
  ],
  carbPool: {
    referenceFood: 'Arroz (peso cocido)',
    totalGrams: 322,
    mealNames: ['Comida 2', 'Comida 3'],
    tolerancePct: 10,
  },
};

const TODAY = '2026-10-07';
const log = (overrides: Partial<MealLog>): MealLog => ({
  date: TODAY,
  mealName: 'Comida 2',
  foodName: 'Arroz (peso cocido)',
  grams: 100,
  ...overrides,
});

describe('date helpers', () => {
  it('shifts across month boundaries', () => {
    expect(shiftISODate('2026-10-01', -1)).toBe('2026-09-30');
    expect(shiftISODate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('accepts logs from two days back to one day ahead of the server day', () => {
    expect(isWithinLogWindow('2026-10-05', TODAY)).toBe(true);
    expect(isWithinLogWindow('2026-10-08', TODAY)).toBe(true);
    expect(isWithinLogWindow('2026-10-04', TODAY)).toBe(false);
    expect(isWithinLogWindow('2026-10-09', TODAY)).toBe(false);
  });
});

describe('roundAmount', () => {
  it('rounds grams to 5 and units to halves', () => {
    expect(roundAmount(221.7, 'g')).toBe(220);
    expect(roundAmount(2.07, 'ud')).toBe(2);
    expect(roundAmount(2.3, 'ud')).toBe(2.5);
  });
});

describe('getCarbPoolOptions', () => {
  it('takes the carb block of the first pool meal', () => {
    expect(getCarbPoolOptions(PLAN).map((o) => o.name)).toEqual([
      'Arroz (peso cocido)',
      'Papa (peso cocido)',
      'Tortillas',
    ]);
  });

  it('is empty without a pool', () => {
    expect(getCarbPoolOptions({ ...PLAN, carbPool: undefined })).toEqual([]);
  });

  it('is empty when the reference food is not an option', () => {
    expect(getCarbPoolOptions({ ...PLAN, carbPool: { ...PLAN.carbPool!, referenceFood: 'Quinua' } })).toEqual([]);
  });
});

describe('log list helpers', () => {
  it('upserts one entry per date and meal', () => {
    const logs = upsertMealLog([log({ grams: 100 })], log({ grams: 150 }));
    expect(logs).toEqual([log({ grams: 150 })]);
    expect(upsertMealLog(logs, log({ mealName: 'Comida 3' }))).toHaveLength(2);
  });

  it('removes only the given date and meal', () => {
    const logs = [log({}), log({ mealName: 'Comida 3' }), log({ date: '2026-10-06' })];
    expect(removeMealLog(logs, TODAY, 'Comida 2')).toEqual([log({ mealName: 'Comida 3' }), log({ date: '2026-10-06' })]);
  });

  it('finds the latest earlier log of a meal ("Repetir ayer")', () => {
    const logs = [
      log({ date: '2026-10-04', grams: 90 }),
      log({ date: '2026-10-06', grams: 120 }),
      log({ date: TODAY, grams: 200 }),
    ];
    expect(findPreviousLog(logs, 'Comida 2', TODAY)?.grams).toBe(120);
    expect(findPreviousLog(logs, 'Comida 3', TODAY)).toBeUndefined();
  });
});

describe('buildCarbPoolDay', () => {
  it('returns null for a plan without a usable pool', () => {
    expect(buildCarbPoolDay({ ...PLAN, carbPool: undefined }, [], TODAY)).toBeNull();
  });

  it('starts a new day with the whole pool, ignoring other days', () => {
    const day = buildCarbPoolDay(PLAN, [log({ date: '2026-10-06', grams: 322 })], TODAY)!;
    expect(day.progress.remainingGrams).toBe(322);
    expect(day.meals).toEqual([{ mealName: 'Comida 2', log: undefined }, { mealName: 'Comida 3', log: undefined }]);
  });

  it('tracks 100 g of rice in Comida 2 and what is left for Comida 3', () => {
    const day = buildCarbPoolDay(PLAN, [log({ grams: 100 })], TODAY)!;
    expect(day.progress.usedGrams).toBe(100);
    expect(day.progress.remainingGrams).toBe(222);
    expect(expressInOptions(day, day.progress.remainingGrams)).toEqual([
      { foodName: 'Arroz (peso cocido)', amount: 220, measureUnit: 'g' },
      { foodName: 'Papa (peso cocido)', amount: 330, measureUnit: 'g' },
      { foodName: 'Tortillas', amount: 2, measureUnit: 'ud' },
    ]);
  });

  it('ignores logs of foods no longer in the plan', () => {
    const day = buildCarbPoolDay(PLAN, [log({ foodName: 'Quinua', grams: 100 })], TODAY)!;
    expect(day.progress.usedGrams).toBe(0);
  });
});

describe('suggestions and preview', () => {
  it('suggests half the pool and everything left, in the chosen food', () => {
    const day = buildCarbPoolDay(PLAN, [log({ mealName: 'Comida 3', grams: 100 })], TODAY)!;
    expect(remainingForMeal(day, 'Comida 2')).toBe(222);
    expect(suggestAmounts(day, 'Comida 2', 'Arroz (peso cocido)')).toEqual([
      { amount: 160, kind: 'half' },
      { amount: 220, kind: 'rest' },
    ]);
    expect(suggestAmounts(day, 'Comida 2', 'Papa (peso cocido)')).toEqual([
      { amount: 240, kind: 'half' },
      { amount: 330, kind: 'rest' },
    ]);
  });

  it('only offers what is left once less than half remains', () => {
    const day = buildCarbPoolDay(PLAN, [log({ grams: 250 })], TODAY)!;
    expect(suggestAmounts(day, 'Comida 3', 'Arroz (peso cocido)')).toEqual([{ amount: 70, kind: 'rest' }]);
  });

  it('offers nothing when the pool is used up', () => {
    const day = buildCarbPoolDay(PLAN, [log({ grams: 322 })], TODAY)!;
    expect(suggestAmounts(day, 'Comida 3', 'Arroz (peso cocido)')).toEqual([]);
  });

  it('reports what each meal used, in reference grams', () => {
    const day = buildCarbPoolDay(PLAN, [log({ foodName: 'Papa (peso cocido)', grams: 478 })], TODAY)!;
    expect(usedByMeal(day, 'Comida 2')).toBe(322);
    expect(usedByMeal(day, 'Comida 3')).toBe(0);
  });

  it("does not count the meal's own log as already eaten when re-logging it", () => {
    const day = buildCarbPoolDay(PLAN, [log({ grams: 300 })], TODAY)!;
    expect(remainingForMeal(day, 'Comida 2')).toBe(322);
  });

  it('previews the pool with a candidate amount', () => {
    const day = buildCarbPoolDay(PLAN, [log({ grams: 100 })], TODAY)!;
    expect(previewWithLog(day, 'Comida 2', 'Arroz (peso cocido)', 161).remainingGrams).toBe(161);
    expect(previewWithLog(day, 'Comida 3', 'Arroz (peso cocido)', 300).status).toBe('over');
  });
});
