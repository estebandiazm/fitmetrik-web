import { describe, it, expect } from 'vitest';
import {
  validateMeasurement,
  groupByPoint,
  getDeltaForLast,
  seedCatalog,
  MEASUREMENT_POINTS_CATALOG,
} from '@/domain/services/bodyMeasurements';
import type { BodyMeasurement } from '@/domain/types/BodyMeasurement';
import type { MeasurementPoint } from '@/domain/types/MeasurementPoint';

// ── MEASUREMENT_POINTS_CATALOG ────────────────────────────────────────────────

describe('MEASUREMENT_POINTS_CATALOG', () => {
  it('should contain exactly 8 catalog points', () => {
    expect(MEASUREMENT_POINTS_CATALOG).toHaveLength(8);
  });

  it('should have required slugs', () => {
    const slugs = MEASUREMENT_POINTS_CATALOG.map((p) => p.slug);
    expect(slugs).toContain('pecho');
    expect(slugs).toContain('cintura');
    expect(slugs).toContain('gluteo');
    expect(slugs).toContain('pantorrilla');
  });

  it('should have bodyCoords within 0–100 range for every entry', () => {
    for (const point of MEASUREMENT_POINTS_CATALOG) {
      expect(point.bodyCoords.x).toBeGreaterThanOrEqual(0);
      expect(point.bodyCoords.x).toBeLessThanOrEqual(100);
      expect(point.bodyCoords.y).toBeGreaterThanOrEqual(0);
      expect(point.bodyCoords.y).toBeLessThanOrEqual(100);
    }
  });

  it('should have maxCm > minCm for every entry', () => {
    for (const point of MEASUREMENT_POINTS_CATALOG) {
      expect(point.maxCm).toBeGreaterThan(point.minCm);
    }
  });
});

// ── seedCatalog ────────────────────────────────────────────────────────────────

describe('seedCatalog', () => {
  it('should return 8 points all with active: false', () => {
    const seed = seedCatalog();
    expect(seed).toHaveLength(8);
    expect(seed.every((p) => p.active === false)).toBe(true);
  });

  it('should include slug and label for each point', () => {
    const seed = seedCatalog();
    for (const point of seed) {
      expect(typeof point.slug).toBe('string');
      expect(point.slug.length).toBeGreaterThan(0);
      expect(typeof point.label).toBe('string');
      expect(point.label.length).toBeGreaterThan(0);
    }
  });
});

// ── validateMeasurement ────────────────────────────────────────────────────────

describe('validateMeasurement', () => {
  const cinturaPoint: MeasurementPoint = {
    slug: 'cintura',
    label: 'Cintura',
    bodyCoords: { x: 50, y: 45 },
    active: true,
    minCm: 50,
    maxCm: 200,
  };

  const pantorrillaPoint: MeasurementPoint = {
    slug: 'pantorrilla',
    label: 'Pantorrilla',
    bodyCoords: { x: 40, y: 88 },
    active: true,
    minCm: 20,
    maxCm: 70,
  };

  it('should return { ok: true } for a value within range', () => {
    const result = validateMeasurement(cinturaPoint, 85);
    expect(result.ok).toBe(true);
  });

  it('should return { ok: false } with a reason when value exceeds maxCm', () => {
    const result = validateMeasurement(cinturaPoint, 250);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBeTruthy();
    }
  });

  it('should return { ok: false } when value is below minCm', () => {
    const result = validateMeasurement(pantorrillaPoint, 10);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBeTruthy();
    }
  });

  it('should return { ok: true } for a value exactly at the boundary (maxCm)', () => {
    const result = validateMeasurement(cinturaPoint, 200);
    expect(result.ok).toBe(true);
  });
});

// ── groupByPoint ────────────────────────────────────────────────────────────────

describe('groupByPoint', () => {
  const measurements: BodyMeasurement[] = [
    { date: new Date('2026-01-01'), pointSlug: 'cintura', valueCm: 85 },
    { date: new Date('2026-01-02'), pointSlug: 'cintura', valueCm: 84 },
    { date: new Date('2026-01-01'), pointSlug: 'pecho', valueCm: 100 },
  ];

  it('should group measurements by pointSlug', () => {
    const result = groupByPoint(measurements);
    expect(result['cintura']).toHaveLength(2);
    expect(result['pecho']).toHaveLength(1);
  });

  it('should return an empty object for an empty array', () => {
    const result = groupByPoint([]);
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ── getDeltaForLast ────────────────────────────────────────────────────────────

describe('getDeltaForLast', () => {
  it('should return null when fewer than 2 entries exist for the slug', () => {
    const measurements: BodyMeasurement[] = [
      { date: new Date('2026-01-01'), pointSlug: 'cintura', valueCm: 85 },
    ];
    const result = getDeltaForLast(measurements, 'cintura');
    expect(result).toBeNull();
  });

  it('should return the difference between the two most recent entries', () => {
    const measurements: BodyMeasurement[] = [
      { date: new Date('2026-01-01'), pointSlug: 'cintura', valueCm: 85 },
      { date: new Date('2026-01-08'), pointSlug: 'cintura', valueCm: 83 },
    ];
    // Most recent is Jan 8 (83), previous is Jan 1 (85); delta = 83 - 85 = -2
    const result = getDeltaForLast(measurements, 'cintura');
    expect(result).toBe(-2);
  });

  it('should return null when the slug has no entries', () => {
    const measurements: BodyMeasurement[] = [
      { date: new Date('2026-01-01'), pointSlug: 'pecho', valueCm: 100 },
    ];
    const result = getDeltaForLast(measurements, 'cintura');
    expect(result).toBeNull();
  });

  it('should only consider entries for the specified slug', () => {
    const measurements: BodyMeasurement[] = [
      { date: new Date('2026-01-01'), pointSlug: 'cintura', valueCm: 85 },
      { date: new Date('2026-01-08'), pointSlug: 'cintura', valueCm: 83 },
      { date: new Date('2026-01-08'), pointSlug: 'pecho', valueCm: 100 },
      { date: new Date('2026-01-15'), pointSlug: 'pecho', valueCm: 102 },
    ];
    const cinturaResult = getDeltaForLast(measurements, 'cintura');
    const pechoResult = getDeltaForLast(measurements, 'pecho');
    expect(cinturaResult).toBe(-2);
    expect(pechoResult).toBe(2);
  });
});
