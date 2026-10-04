import { describe, it, expect } from 'vitest';
import {
  parseDailyStepInput,
  parseDailyWeightInput,
  parseStepGoal,
  parseTargetWeight,
} from '@/domain/services/activityInputs';

const NOW = new Date(2026, 3, 15, 10, 30);

describe('parseDailyStepInput', () => {
  it('accepts today with a valid step count, normalized to local midnight', () => {
    const result = parseDailyStepInput('2026-04-15', '8000', NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.steps).toBe(8000);
    expect(result.date.getDate()).toBe(15);
    expect(result.date.getHours()).toBe(0);
    expect(result.date.getMinutes()).toBe(0);
  });

  it('rejects a future date before checking steps', () => {
    expect(parseDailyStepInput('2026-04-20', 'abc', NOW)).toEqual({
      ok: false,
      reason: 'Date cannot be in the future',
    });
  });

  it('rejects non-numeric steps', () => {
    expect(parseDailyStepInput('2026-04-10', 'abc', NOW)).toEqual({
      ok: false,
      reason: 'Steps must be between 0 and 100,000',
    });
  });

  it('rejects steps outside 0–100,000', () => {
    expect(parseDailyStepInput('2026-04-10', '-1', NOW).ok).toBe(false);
    expect(parseDailyStepInput('2026-04-10', '100001', NOW).ok).toBe(false);
  });

  it('accepts the 0 and 100,000 bounds', () => {
    expect(parseDailyStepInput('2026-04-10', '0', NOW).ok).toBe(true);
    expect(parseDailyStepInput('2026-04-10', '100000', NOW).ok).toBe(true);
  });

  it('parses steps as an integer', () => {
    const result = parseDailyStepInput('2026-04-10', '1234.9', NOW);
    expect(result.ok && result.steps).toBe(1234);
  });
});

describe('parseStepGoal', () => {
  it('accepts a positive integer', () => {
    expect(parseStepGoal('10000')).toEqual({ ok: true, value: 10000 });
  });

  it('truncates decimals like parseInt', () => {
    expect(parseStepGoal('7500.8')).toEqual({ ok: true, value: 7500 });
  });

  it('rejects zero, negatives and non-numbers', () => {
    const error = { ok: false, reason: 'Goal must be a positive number' };
    expect(parseStepGoal('0')).toEqual(error);
    expect(parseStepGoal('-5')).toEqual(error);
    expect(parseStepGoal('abc')).toEqual(error);
  });
});

describe('parseTargetWeight', () => {
  it('accepts a positive decimal', () => {
    expect(parseTargetWeight('70.5')).toEqual({ ok: true, value: 70.5 });
  });

  it('rejects zero, negatives and non-numbers', () => {
    const error = { ok: false, reason: 'Target weight must be a positive number' };
    expect(parseTargetWeight('0')).toEqual(error);
    expect(parseTargetWeight('-1')).toEqual(error);
    expect(parseTargetWeight('')).toEqual(error);
  });
});


describe('parseDailyWeightInput', () => {
  it('accepts today with a valid weight, as local midnight', () => {
    const result = parseDailyWeightInput('2026-04-15', '80.5', NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.weight).toBe(80.5);
    expect([result.date.getMonth(), result.date.getDate(), result.date.getHours()]).toEqual([3, 15, 0]);
  });

  it('rejects a future date', () => {
    expect(parseDailyWeightInput('2026-04-16', '80', NOW)).toEqual({
      ok: false,
      reason: 'Date cannot be in the future',
    });
  });

  it.each(['', 'abc', '0', '0.05', '500.1'])('rejects weight %j outside 0.1–500 kg', (raw) => {
    expect(parseDailyWeightInput('2026-04-15', raw, NOW)).toEqual({
      ok: false,
      reason: 'Weight must be between 0.1 and 500 kg',
    });
  });

  it.each(['0.1', '500'])('accepts the boundary weight %s', (raw) => {
    expect(parseDailyWeightInput('2026-04-15', raw, NOW).ok).toBe(true);
  });
});

describe('date input validation', () => {
  it.each(['', 'abc', '2026-xx-01'])('rejects an invalid date %j', (dateISO) => {
    const invalid = { ok: false, reason: 'Invalid date' };
    expect(parseDailyStepInput(dateISO, '8000', NOW)).toEqual(invalid);
    expect(parseDailyWeightInput(dateISO, '80', NOW)).toEqual(invalid);
  });
});
