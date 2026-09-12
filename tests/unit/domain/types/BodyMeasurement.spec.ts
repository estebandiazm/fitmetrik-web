import { describe, it, expect } from 'vitest';
import { BodyMeasurementSchema } from '@/domain/types/BodyMeasurement';

// ── valueCm boundary (REQ-BMT-02: finite, non-negative; no per-point range) ────

describe('BodyMeasurementSchema — valueCm boundary', () => {
  const base = { date: new Date('2026-01-01'), pointSlug: 'cintura' };

  it('accepts 0 (no-data sentinel is filtered downstream, not rejected by the schema)', () => {
    const result = BodyMeasurementSchema.safeParse({ ...base, valueCm: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects a negative value', () => {
    const result = BodyMeasurementSchema.safeParse({ ...base, valueCm: -1 });
    expect(result.success).toBe(false);
  });

  it('accepts a small fractional value (0.1)', () => {
    const result = BodyMeasurementSchema.safeParse({ ...base, valueCm: 0.1 });
    expect(result.success).toBe(true);
  });

  it('accepts a large value (450) — no upper bound', () => {
    const result = BodyMeasurementSchema.safeParse({ ...base, valueCm: 450 });
    expect(result.success).toBe(true);
  });

  it('rejects NaN', () => {
    const result = BodyMeasurementSchema.safeParse({ ...base, valueCm: NaN });
    expect(result.success).toBe(false);
  });

  it('rejects Infinity', () => {
    const result = BodyMeasurementSchema.safeParse({ ...base, valueCm: Infinity });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string', () => {
    const result = BodyMeasurementSchema.safeParse({ ...base, valueCm: '' });
    expect(result.success).toBe(false);
  });
});

// ── future-date refine still enforced ─────────────────────────────────────────

describe('BodyMeasurementSchema — date refine', () => {
  it('rejects a future date', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = BodyMeasurementSchema.safeParse({
      date: future,
      pointSlug: 'cintura',
      valueCm: 80,
    });
    expect(result.success).toBe(false);
  });

  it('accepts today', () => {
    const result = BodyMeasurementSchema.safeParse({
      date: new Date(),
      pointSlug: 'cintura',
      valueCm: 80,
    });
    expect(result.success).toBe(true);
  });
});
