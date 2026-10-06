import { describe, it, expect } from 'vitest';
import { buildPlanCards, resolveActivePlanIndex } from '@/domain/services/planView';
import type { DietPlan } from '@/domain/types/DietPlan';

const plan = (over: Partial<DietPlan> = {}): DietPlan => ({ meals: [], ...over });

describe('buildPlanCards', () => {
  it('returns no cards for a plan without meals or snacks', () => {
    expect(buildPlanCards(plan())).toEqual([]);
    expect(buildPlanCards(plan({ snacks: [] }))).toEqual([]);
  });

  it('maps a meal to a card', () => {
    const [card] = buildPlanCards(
      plan({
        meals: [
          {
            mealName: 'Desayuno',
            blocks: [
              { blockType: 'BASE', options: [{ foodName: 'Huevos', grams: 150, measureUnit: 'g' }] },
              { blockType: 'FRUTA', options: [{ foodName: 'Manzana', grams: 1, measureUnit: 'ud' }] },
            ],
          },
        ],
      }),
    );
    expect(card.title).toBe('Desayuno');
    expect(card.description).toBe('Huevos · Manzana');
    expect(card.totalWeight).toBe('2 bloques');
    expect(card.variant).toBeUndefined();
    expect(card.foods.map(({ name, category, amount }) => ({ name, category, amount }))).toEqual([
      { name: 'Huevos', category: 'BASE', amount: '150 g' },
      { name: 'Manzana', category: 'FRUTA', amount: '1 ud' },
    ]);
  });

  it('handles a meal with no blocks', () => {
    const [card] = buildPlanCards(plan({ meals: [{ mealName: 'Vacía', blocks: [] }] }));
    expect(card).toMatchObject({ description: '', totalWeight: '0 bloques', foods: [] });
  });

  it('flattens multiple options within a block', () => {
    const [card] = buildPlanCards(
      plan({
        meals: [
          {
            mealName: 'Almuerzo',
            blocks: [
              {
                blockType: 'BASE',
                options: [
                  { foodName: 'Pollo', grams: 200, measureUnit: 'g' },
                  { foodName: 'Pavo', grams: 180, measureUnit: 'g' },
                ],
              },
            ],
          },
        ],
      }),
    );
    expect(card.foods).toHaveLength(2);
    expect(card.totalWeight).toBe('1 bloques');
    expect(card.description).toBe('Pollo · Pavo');
  });

  it('appends a snack card when snacks are present', () => {
    const cards = buildPlanCards(
      plan({
        meals: [{ mealName: 'Cena', blocks: [] }],
        snacks: [
          { optionNumber: 1, description: 'Yogurt' },
          { optionNumber: 2, description: 'Batido' },
        ],
      }),
    );
    expect(cards).toHaveLength(2);
    expect(cards[1]).toEqual({
      title: 'Snacks',
      description: 'Elige una opción por día',
      totalWeight: '2 opciones',
      variant: 'snack',
      foods: [
        { id: 'snack-1', name: 'Yogurt', category: 'Opción 1', amount: '' },
        { id: 'snack-2', name: 'Batido', category: 'Opción 2', amount: '' },
      ],
    });
  });

  it('omits the snack card when snacks are absent', () => {
    const cards = buildPlanCards(plan({ meals: [{ mealName: 'Cena', blocks: [] }] }));
    expect(cards.some((c) => c.variant === 'snack')).toBe(false);
  });

  it('generates unique food ids even when the same food repeats', () => {
    const [card] = buildPlanCards(
      plan({
        meals: [
          {
            mealName: 'Comida',
            blocks: [
              {
                blockType: 'BASE',
                options: [
                  { foodName: 'Arroz', grams: 100, measureUnit: 'g' },
                  { foodName: 'Arroz', grams: 150, measureUnit: 'g' },
                ],
              },
              { blockType: 'BASE', options: [{ foodName: 'Arroz', grams: 100, measureUnit: 'g' }] },
            ],
          },
        ],
      }),
    );
    const ids = card.foods.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resolveActivePlanIndex', () => {
  it('defaults to the last plan', () => {
    expect(resolveActivePlanIndex(3, undefined)).toBe(2);
  });

  it('returns a valid index', () => {
    expect(resolveActivePlanIndex(3, '0')).toBe(0);
    expect(resolveActivePlanIndex(3, '1')).toBe(1);
  });

  it('falls back to the last plan for invalid or out-of-range values', () => {
    expect(resolveActivePlanIndex(3, 'abc')).toBe(2);
    expect(resolveActivePlanIndex(3, '')).toBe(2);
    expect(resolveActivePlanIndex(3, '-1')).toBe(2);
    expect(resolveActivePlanIndex(3, '3')).toBe(2);
    expect(resolveActivePlanIndex(3, ['0', '1'])).toBe(2);
  });

  it('returns 0 when there are no plans', () => {
    expect(resolveActivePlanIndex(0, undefined)).toBe(0);
    expect(resolveActivePlanIndex(0, '2')).toBe(0);
  });
});
