import { describe, it, expect } from 'vitest';
import {
  calculatePoolProgress,
  getPoolStatus,
  listRemainingEquivalents,
} from '@/domain/services/carbPool';
import { CarbPoolSchema, type CarbPool } from '@/domain/types/CarbPool';

const FOODS = [
  { name: 'Arroz', grams: 200 },
  { name: 'Papa', grams: 275 },
  { name: 'Pasta', grams: 210 },
];

const POOL: CarbPool = {
  referenceFood: 'Arroz',
  totalGrams: 300,
  mealNames: ['Comida 2', 'Comida 3'],
  tolerancePct: 10,
};

describe('CarbPoolSchema', () => {
  it('defaults the tolerance to 10%', () => {
    const pool = CarbPoolSchema.parse({
      referenceFood: 'Arroz',
      totalGrams: 300,
      mealNames: ['Comida 2', 'Comida 3'],
    });
    expect(pool.tolerancePct).toBe(10);
  });

  it('requires at least two meals to share the pool', () => {
    const result = CarbPoolSchema.safeParse({ ...POOL, mealNames: ['Comida 2'] });
    expect(result.success).toBe(false);
  });
});

describe('calculatePoolProgress', () => {
  it('starts with the whole pool remaining', () => {
    expect(calculatePoolProgress(POOL, [], FOODS)).toEqual({
      usedGrams: 0,
      remainingGrams: 300,
      overGrams: 0,
      status: 'under',
    });
  });

  it('tracks a mid-day split (150 g arroz in Comida 2)', () => {
    const progress = calculatePoolProgress(
      POOL,
      [{ mealName: 'Comida 2', foodName: 'Arroz', grams: 150 }],
      FOODS,
    );
    expect(progress).toMatchObject({ usedGrams: 150, remainingGrams: 150, status: 'under' });
  });

  it('converts other foods to the reference before adding them', () => {
    const progress = calculatePoolProgress(
      POOL,
      [
        { mealName: 'Comida 2', foodName: 'Arroz', grams: 100 },
        { mealName: 'Comida 3', foodName: 'Papa', grams: 275 }, // ≡ 200 g arroz
      ],
      FOODS,
    );
    expect(progress).toMatchObject({ usedGrams: 300, remainingGrams: 0, overGrams: 0, status: 'within' });
  });

  it('reports the excess when the pool is exceeded', () => {
    const progress = calculatePoolProgress(
      POOL,
      [
        { mealName: 'Comida 2', foodName: 'Arroz', grams: 200 },
        { mealName: 'Comida 3', foodName: 'Arroz', grams: 200 },
      ],
      FOODS,
    );
    expect(progress).toMatchObject({ usedGrams: 400, remainingGrams: 0, overGrams: 100, status: 'over' });
  });

  it('ignores portions from meals outside the pool', () => {
    const progress = calculatePoolProgress(
      POOL,
      [{ mealName: 'Comida 1', foodName: 'Arroz', grams: 192 }],
      FOODS,
    );
    expect(progress.usedGrams).toBe(0);
  });

  it('rejects a protein logged against the carb pool', () => {
    const foods = [
      { name: 'Arroz', grams: 200, category: 'COMPLEMENT' },
      { name: 'Pollo', grams: 253, category: 'BASE' },
    ];
    expect(() =>
      calculatePoolProgress(POOL, [{ mealName: 'Comida 2', foodName: 'Pollo', grams: 150 }], foods),
    ).toThrow('categories');
  });

  it('throws when a logged food has no equivalence', () => {
    expect(() =>
      calculatePoolProgress(POOL, [{ mealName: 'Comida 2', foodName: 'Pan', grams: 50 }], FOODS),
    ).toThrow('Pan');
  });
});

describe('getPoolStatus', () => {
  it('counts the ±10% band as fulfilled, edges included', () => {
    expect(getPoolStatus(POOL, 269)).toBe('under');
    expect(getPoolStatus(POOL, 270)).toBe('within');
    expect(getPoolStatus(POOL, 330)).toBe('within');
    expect(getPoolStatus(POOL, 331)).toBe('over');
  });

  it('demands the exact amount with a 0% tolerance', () => {
    const strict = { ...POOL, tolerancePct: 0 };
    expect(getPoolStatus(strict, 299)).toBe('under');
    expect(getPoolStatus(strict, 300)).toBe('within');
    expect(getPoolStatus(strict, 301)).toBe('over');
  });
});

describe('listRemainingEquivalents', () => {
  it('expresses what is left in each option of the next meal', () => {
    const equivalents = listRemainingEquivalents(
      POOL,
      [{ mealName: 'Comida 2', foodName: 'Arroz', grams: 150 }],
      FOODS,
      FOODS,
    );
    expect(equivalents).toEqual([
      { foodName: 'Arroz', grams: 150 },
      { foodName: 'Papa', grams: 205 },
      { foodName: 'Pasta', grams: 160 },
    ]);
  });
});
