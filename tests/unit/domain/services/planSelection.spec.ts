import { describe, it, expect } from 'vitest';
import { selectPlansByIndex } from '@/domain/services/planSelection';

const plans = ['A', 'B', 'C'];

describe('selectPlansByIndex', () => {
  it('returns only the plan at a valid index', () => {
    expect(selectPlansByIndex(plans, '1')).toEqual(['B']);
    expect(selectPlansByIndex(plans, '0')).toEqual(['A']);
  });

  it('returns every plan when no index is given', () => {
    expect(selectPlansByIndex(plans, null)).toEqual(plans);
    expect(selectPlansByIndex(plans, undefined)).toEqual(plans);
  });

  it.each(['-1', '3', 'abc', ''])('falls back to every plan for an invalid index %j', (raw) => {
    expect(selectPlansByIndex(plans, raw)).toEqual(plans);
  });
});
