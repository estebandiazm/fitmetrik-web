import { describe, it, expect } from 'vitest';
import {
  validateMeasurement,
  groupByPoint,
  getDeltaForLast,
  seedCatalog,
  MEASUREMENT_POINTS_CATALOG,
  MEASUREMENT_GROUPS,
  toPersistableEntries,
  buildMeasurementEntries,
  validateMeasurementEntries,
  groupPoints,
  sanitizeDecimalInput,
  stepMeasurementValue,
  formatMeasurementReference,
  isFutureDate,
  isNoDataValue,
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

// ── validateMeasurement (REQ-BMT-07 removed — finite, non-negative only) ───────

describe('validateMeasurement', () => {
  const cinturaPoint: MeasurementPoint = {
    slug: 'cintura',
    label: 'Cintura',
    bodyCoords: { x: 50, y: 45 },
    active: true,
    minCm: 50,
    maxCm: 200,
  };

  it('returns { ok: true } for a normal value', () => {
    expect(validateMeasurement(cinturaPoint, 85).ok).toBe(true);
  });

  it('returns { ok: true } for a value far above the legacy maxCm (no upper bound)', () => {
    expect(validateMeasurement(cinturaPoint, 450).ok).toBe(true);
  });

  it('returns { ok: true } for a value below the legacy minCm (no lower range bound)', () => {
    expect(validateMeasurement(cinturaPoint, 5).ok).toBe(true);
  });

  it('returns { ok: true } for 0 (no-data is filtered elsewhere, not a validation error)', () => {
    expect(validateMeasurement(cinturaPoint, 0).ok).toBe(true);
  });

  it('returns { ok: false } with a reason for a negative value', () => {
    const result = validateMeasurement(cinturaPoint, -1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('Cintura');
  });

  it('returns { ok: false } for a non-finite value (NaN)', () => {
    const result = validateMeasurement(cinturaPoint, NaN);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('Cintura');
  });

  it('returns { ok: false } for Infinity', () => {
    expect(validateMeasurement(cinturaPoint, Infinity).ok).toBe(false);
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

// ── isNoDataValue (REQ-BMT-04: single source of truth for "blank or 0") ───────

describe('isNoDataValue', () => {
  it('treats a blank string as no-data', () => {
    expect(isNoDataValue('')).toBe(true);
    expect(isNoDataValue('   ')).toBe(true);
  });

  it('treats a value that parses to exactly 0 as no-data', () => {
    expect(isNoDataValue('0')).toBe(true);
    expect(isNoDataValue('0,0')).toBe(true);
  });

  it('does not treat a positive or negative value as no-data', () => {
    expect(isNoDataValue('82')).toBe(false);
    expect(isNoDataValue('-1')).toBe(false);
  });

  it('does not treat an unparseable value as no-data', () => {
    expect(isNoDataValue('1.2.3')).toBe(false);
  });
});

// ── isFutureDate ────────────────────────────────────────────────────────────

describe('isFutureDate', () => {
  it('returns true for a date after today', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isFutureDate(tomorrow)).toBe(true);
  });

  it('returns false for today, ignoring time-of-day', () => {
    const now = new Date();
    expect(isFutureDate(now)).toBe(false);
  });

  it('returns false for a date in the past', () => {
    expect(isFutureDate(new Date('2020-01-01'))).toBe(false);
  });
});

// ── toPersistableEntries (REQ-BMT-04: 0/blank never persisted) ────────────────

describe('toPersistableEntries', () => {
  it('drops every entry with valueCm 0 and keeps the positive ones', () => {
    const result = toPersistableEntries([
      { pointSlug: 'cintura', valueCm: 0 },
      { pointSlug: 'pecho', valueCm: 82 },
      { pointSlug: 'gluteo', valueCm: 0.1 },
    ]);
    expect(result).toEqual([
      { pointSlug: 'pecho', valueCm: 82 },
      { pointSlug: 'gluteo', valueCm: 0.1 },
    ]);
  });

  it('excludes non-positive values (0 and negatives) and keeps large positives', () => {
    const result = toPersistableEntries([
      { valueCm: -1 },
      { valueCm: 0 },
      { valueCm: 450 },
    ]);
    expect(result).toEqual([{ valueCm: 450 }]);
  });

  it('returns an empty array when every entry is 0', () => {
    expect(toPersistableEntries([{ valueCm: 0 }, { valueCm: 0 }])).toEqual([]);
  });
});

// ── buildMeasurementEntries (REQ-BMT-02 partial-save fork) ────────────────────

describe('buildMeasurementEntries', () => {
  const points: MeasurementPoint[] = [
    { slug: 'cintura', label: 'Cintura', bodyCoords: { x: 50, y: 45 }, active: true, minCm: 50, maxCm: 200 },
    { slug: 'pecho', label: 'Pecho', bodyCoords: { x: 50, y: 28 }, active: true, minCm: 50, maxCm: 200 },
    { slug: 'gluteo', label: 'Glúteo', bodyCoords: { x: 50, y: 56 }, active: true, minCm: 10, maxCm: 100 },
  ];
  const date = new Date('2026-05-01');

  it('drops blank and 0 fields, keeps valid siblings', () => {
    const { entries, fieldErrors } = buildMeasurementEntries(
      points,
      { cintura: '82', pecho: '', gluteo: '0' },
      date
    );
    expect(entries).toEqual([{ date, pointSlug: 'cintura', valueCm: 82 }]);
    expect(fieldErrors).toEqual({});
  });

  it('flags an unparseable value ("1.2.3") but still returns the valid siblings', () => {
    const { entries, fieldErrors } = buildMeasurementEntries(
      points,
      { cintura: '1.2.3', pecho: '97', gluteo: '90' },
      date
    );
    expect(fieldErrors.cintura).toBeTruthy();
    expect(entries).toEqual([
      { date, pointSlug: 'pecho', valueCm: 97 },
      { date, pointSlug: 'gluteo', valueCm: 90 },
    ]);
  });

  it('parses a comma decimal separator as a dot', () => {
    const { entries, fieldErrors } = buildMeasurementEntries(
      points,
      { cintura: '82,5' },
      date
    );
    expect(fieldErrors).toEqual({});
    expect(entries).toEqual([{ date, pointSlug: 'cintura', valueCm: 82.5 }]);
  });

  it('flags a negative value and does not persist it', () => {
    const { entries, fieldErrors } = buildMeasurementEntries(
      points,
      { cintura: '-3', pecho: '95' },
      date
    );
    expect(fieldErrors.cintura).toBeTruthy();
    expect(entries).toEqual([{ date, pointSlug: 'pecho', valueCm: 95 }]);
  });
});

// ── validateMeasurementEntries (REQ-UTA-04 pre-persist validation) ────────────

describe('validateMeasurementEntries', () => {
  const points: MeasurementPoint[] = [
    { slug: 'cintura', label: 'Cintura', bodyCoords: { x: 50, y: 45 }, active: true, minCm: 50, maxCm: 200 },
    { slug: 'pecho', label: 'Pecho', bodyCoords: { x: 50, y: 28 }, active: true, minCm: 50, maxCm: 200 },
  ];

  it('returns { ok: true } for a valid batch', () => {
    const result = validateMeasurementEntries(points, [
      { pointSlug: 'cintura', valueCm: 82 },
      { pointSlug: 'pecho', valueCm: 450 },
    ]);
    expect(result.ok).toBe(true);
  });

  it('returns { ok: false } when any entry is negative', () => {
    const result = validateMeasurementEntries(points, [
      { pointSlug: 'cintura', valueCm: 82 },
      { pointSlug: 'pecho', valueCm: -4 },
    ]);
    expect(result.ok).toBe(false);
  });

  it('returns { ok: false } when any entry is non-finite', () => {
    const result = validateMeasurementEntries(points, [
      { pointSlug: 'cintura', valueCm: NaN },
    ]);
    expect(result.ok).toBe(false);
  });

  it('returns { ok: false } for an unknown point slug', () => {
    const result = validateMeasurementEntries(points, [
      { pointSlug: 'unknown-slug', valueCm: 80 },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('unknown-slug');
  });
});

// ── MEASUREMENT_GROUPS + groupPoints (grouped tile grid; drift guard) ─────────

describe('MEASUREMENT_GROUPS / groupPoints', () => {
  it('maps every catalog slug to a group (drift guard)', () => {
    for (const point of MEASUREMENT_POINTS_CATALOG) {
      expect(MEASUREMENT_GROUPS[point.slug]).toBeTruthy();
    }
  });

  it('groups points and preserves the input (anatomical) order of groups and points', () => {
    const groups = groupPoints(seedCatalog());
    // first appearance order of groups follows the catalog order
    expect(groups.map((g) => g.group)).toEqual(['Tren Superior', 'Tren Inferior']);
    expect(groups[0].points.map((p) => p.slug)).toEqual([
      'pecho',
      'cintura',
      'biceps-relajado',
      'biceps-contraido',
    ]);
    expect(groups[1].points.map((p) => p.slug)).toEqual([
      'gluteo',
      'cuadriceps-alto',
      'cuadriceps-bajo',
      'pantorrilla',
    ]);
  });

  it('puts an unknown slug into the "Otros" fallback group', () => {
    const custom: MeasurementPoint = {
      slug: 'antebrazo',
      label: 'Antebrazo',
      bodyCoords: { x: 30, y: 40 },
      active: true,
      minCm: 10,
      maxCm: 100,
    };
    const groups = groupPoints([custom]);
    expect(groups).toEqual([{ group: 'Otros', points: [custom] }]);
  });
});

// ── sanitizeDecimalInput (tile input: digits + one separator) ─────────────────

describe('sanitizeDecimalInput', () => {
  it('strips non-numeric characters', () => {
    expect(sanitizeDecimalInput('12a3')).toBe('123');
  });

  it('normalizes a comma to a dot', () => {
    expect(sanitizeDecimalInput('12,5')).toBe('12.5');
  });

  it('keeps only the first separator, folding the rest', () => {
    expect(sanitizeDecimalInput('1.2.3')).toBe('1.23');
  });

  it('returns an empty string when there is nothing numeric', () => {
    expect(sanitizeDecimalInput('abc')).toBe('');
  });

  it('leaves an already-clean decimal untouched', () => {
    expect(sanitizeDecimalInput('82.5')).toBe('82.5');
  });
});

// ── stepMeasurementValue (−/+ steppers, step 0.5, clamped at 0) ───────────────

describe('stepMeasurementValue', () => {
  it('adds the delta to the current numeric value', () => {
    expect(stepMeasurementValue('85', 0.5)).toBe('85.5');
  });

  it('treats a blank value as 0', () => {
    expect(stepMeasurementValue('', 0.5)).toBe('0.5');
  });

  it('clamps at 0 and never goes negative', () => {
    expect(stepMeasurementValue('0.3', -0.5)).toBe('0');
  });

  it('parses a comma separator before stepping', () => {
    expect(stepMeasurementValue('85,5', 0.5)).toBe('86');
  });

  it('treats an unparseable value as 0', () => {
    expect(stepMeasurementValue('abc', 0.5)).toBe('0.5');
  });
});

// ── formatMeasurementReference ("última: 85 cm (Δ -1.2)") ─────────────────────

describe('formatMeasurementReference', () => {
  it('returns null when the point has no history', () => {
    expect(formatMeasurementReference([], 'cintura')).toBeNull();
  });

  it('shows only the last value when there is a single entry', () => {
    const measurements: BodyMeasurement[] = [
      { date: new Date('2026-01-01'), pointSlug: 'cintura', valueCm: 85 },
    ];
    expect(formatMeasurementReference(measurements, 'cintura')).toBe('última: 85 cm');
  });

  it('shows the last value and a signed delta for two or more entries', () => {
    const measurements: BodyMeasurement[] = [
      { date: new Date('2026-01-01'), pointSlug: 'cintura', valueCm: 85 },
      { date: new Date('2026-01-15'), pointSlug: 'cintura', valueCm: 83.8 },
    ];
    expect(formatMeasurementReference(measurements, 'cintura')).toBe('última: 83.8 cm (Δ -1.2)');
  });

  it('prefixes a positive delta with +', () => {
    const measurements: BodyMeasurement[] = [
      { date: new Date('2026-01-01'), pointSlug: 'pecho', valueCm: 100 },
      { date: new Date('2026-01-15'), pointSlug: 'pecho', valueCm: 102 },
    ];
    expect(formatMeasurementReference(measurements, 'pecho')).toBe('última: 102 cm (Δ +2)');
  });
});
