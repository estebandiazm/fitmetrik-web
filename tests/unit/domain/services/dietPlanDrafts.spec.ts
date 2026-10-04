import { describe, it, expect } from 'vitest';
import {
  buildDietPlansFromDrafts,
  createDefaultPlanDraft,
  getDraftCardTitle,
  getDraftPlanLabel,
} from '@/domain/services/dietPlanDrafts';

const draft = (days: string) => ({ days, proteins: 20, carbs: 20, fruits: 0, fats: 0 });

describe('getDraftPlanLabel', () => {
  it('uses the trimmed days when present', () => {
    expect(getDraftPlanLabel('  L-V ', 0)).toBe('Plan L-V');
  });

  it('falls back to the 1-based position when days is blank', () => {
    expect(getDraftPlanLabel('   ', 2)).toBe('Plan 3');
  });
});

describe('buildDietPlansFromDrafts', () => {
  it('generates one plan per draft with label and raw days', () => {
    const plans = buildDietPlansFromDrafts([draft('6 días'), draft('')], 'Ana');
    expect(plans).toHaveLength(2);
    expect(plans[0]).toMatchObject({ label: 'Plan 6 días', days: '6 días' });
    expect(plans[1]).toMatchObject({ label: 'Plan 2', days: '' });
  });

  it('returns an empty list for no drafts', () => {
    expect(buildDietPlansFromDrafts([], 'Ana')).toEqual([]);
  });
});

describe('getDraftCardTitle', () => {
  it('shows the trimmed days when present', () => {
    expect(getDraftCardTitle(' 6 ', 0)).toBe('Plan | 6 days');
  });

  it('falls back to the 1-based position when days is blank', () => {
    expect(getDraftCardTitle('', 1)).toBe('Plan | 2');
  });
});

describe('createDefaultPlanDraft', () => {
  it('starts with the creator defaults and the given id', () => {
    expect(createDefaultPlanDraft('abc')).toEqual({
      id: 'abc',
      label: '',
      days: '',
      proteins: 20,
      carbs: 20,
      fruits: 0,
      fats: 0,
      foods: [],
    });
  });
});
