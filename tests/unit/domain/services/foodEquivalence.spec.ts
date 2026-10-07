import { describe, it, expect } from 'vitest';
import {
  convertEquivalent,
  findFood,
  listEquivalents,
  roundToStep,
} from '@/domain/services/foodEquivalence';

// Portions mirror `domain/data/foods.ts` (cooked weight of one equivalent portion).
const ARROZ = { name: 'Arroz', grams: 200 };
const PAPA = { name: 'Papa', grams: 275 };
const PASTA = { name: 'Pasta', grams: 210 };
const POLLO = { name: 'Pollo', grams: 253 };
const TILAPIA = { name: 'Tilapia', grams: 310 };

describe('findFood', () => {
  it('matches ignoring case and surrounding whitespace', () => {
    expect(findFood([ARROZ, PAPA], '  papa ')).toBe(PAPA);
  });

  it('throws on a food missing from the table', () => {
    expect(() => findFood([ARROZ], 'Quinoa')).toThrow('Quinoa');
  });
});

describe('convertEquivalent', () => {
  it('converts by the ratio of portions (150 g arroz → papa)', () => {
    expect(convertEquivalent(150, ARROZ, PAPA)).toBeCloseTo(206.25);
  });

  it('is the identity for the same food', () => {
    expect(convertEquivalent(150, ARROZ, ARROZ)).toBe(150);
  });

  it('round-trips back to the original amount', () => {
    const papa = convertEquivalent(150, ARROZ, PAPA);
    expect(convertEquivalent(papa, PAPA, ARROZ)).toBeCloseTo(150);
  });

  it('works for protein swaps too (pollo → tilapia)', () => {
    expect(convertEquivalent(253, POLLO, TILAPIA)).toBe(310);
  });

  it('refuses to swap across categories (cooked carbs ↔ raw protein)', () => {
    const arroz = { ...ARROZ, category: 'COMPLEMENT' };
    const pollo = { ...POLLO, category: 'BASE' };
    expect(() => convertEquivalent(150, arroz, pollo)).toThrow('categories');
  });

  it('allows swaps within the same category', () => {
    const arroz = { ...ARROZ, category: 'COMPLEMENT' };
    const papa = { ...PAPA, category: 'COMPLEMENT' };
    expect(convertEquivalent(200, arroz, papa)).toBe(275);
  });

  it('rejects a non-positive portion', () => {
    expect(() => convertEquivalent(100, { name: 'X', grams: 0 }, ARROZ)).toThrow();
  });
});

describe('roundToStep', () => {
  it('rounds to the nearest 5 g by default', () => {
    expect(roundToStep(206.25)).toBe(205);
    expect(roundToStep(157.5)).toBe(160);
  });

  it('accepts a custom step', () => {
    expect(roundToStep(206.25, 10)).toBe(210);
  });
});

describe('listEquivalents', () => {
  it('lists the amount in each option, rounded to 5 g', () => {
    expect(listEquivalents(150, ARROZ, [ARROZ, PAPA, PASTA])).toEqual([
      { foodName: 'Arroz', grams: 150 },
      { foodName: 'Papa', grams: 205 },
      { foodName: 'Pasta', grams: 160 },
    ]);
  });
});
