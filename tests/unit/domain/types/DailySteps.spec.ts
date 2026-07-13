import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyStepSchema } from '@/domain/types/DailySteps';

describe('DailyStepSchema', () => {
  it('should accept a valid step entry with notes', () => {
    const valid = {
      date: new Date('2026-04-19'),
      steps: 8000,
      notes: 'Morning walk',
    };
    expect(() => DailyStepSchema.parse(valid)).not.toThrow();
  });

  it('should accept a valid step entry without notes', () => {
    const noNotes = {
      date: new Date('2026-04-19'),
      steps: 8000,
    };
    expect(() => DailyStepSchema.parse(noNotes)).not.toThrow();
  });

  it('should accept today date', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expect(() => DailyStepSchema.parse({ date: today, steps: 8000 })).not.toThrow();
  });

  it('should reject future dates', () => {
    const future = {
      date: new Date('2099-01-01'),
      steps: 8000,
    };
    expect(() => DailyStepSchema.parse(future)).toThrow();
  });

  it('should reject negative steps', () => {
    expect(() =>
      DailyStepSchema.parse({ date: new Date('2026-04-19'), steps: -1 })
    ).toThrow();
  });

  it('should accept 0 steps', () => {
    expect(() =>
      DailyStepSchema.parse({ date: new Date('2026-04-19'), steps: 0 })
    ).not.toThrow();
  });

  it('should reject steps above 100000', () => {
    expect(() =>
      DailyStepSchema.parse({ date: new Date('2026-04-19'), steps: 100001 })
    ).toThrow();
  });

  it('should accept exactly 100000 steps', () => {
    expect(() =>
      DailyStepSchema.parse({ date: new Date('2026-04-19'), steps: 100000 })
    ).not.toThrow();
  });

  it('should make notes optional (undefined is fine)', () => {
    const result = DailyStepSchema.parse({
      date: new Date('2026-04-19'),
      steps: 8000,
    });
    expect(result.notes).toBeUndefined();
  });

  describe('module-load-time freeze regression (Bug 2)', () => {
    beforeEach(() => {
      vi.useRealTimers();
    });

    it('should validate "today" correctly even when system clock has advanced significantly since module import', async () => {
      // Simulate the schema module being loaded once at server boot.
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      vi.resetModules();
      const { DailyStepSchema: FrozenAtBoot } = await import('@/domain/types/DailySteps');

      // Simulate real wall-clock time passing in a long-running server
      // process while the already-loaded module instance stays in memory.
      vi.setSystemTime(new Date('2026-07-13T12:00:00Z'));

      // Submit "today" (per the new current time) using the module
      // instance that was loaded when "today" was still 2026-01-01.
      const today = new Date('2026-07-13T12:00:00Z');
      const result = FrozenAtBoot.safeParse({ date: today, steps: 5000 });

      expect(result.success).toBe(true);

      vi.useRealTimers();
    });
  });
});
