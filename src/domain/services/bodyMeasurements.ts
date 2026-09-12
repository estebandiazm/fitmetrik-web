import type { MeasurementPoint } from "../types/MeasurementPoint";
import type { BodyMeasurement } from "../types/BodyMeasurement";

// ── Catalog ───────────────────────────────────────────────────────────────────

// minCm/maxCm are legacy, unenforced metadata (REQ-BMT-07 removed). They remain
// on the type/schema (no migration) but MUST NOT feed placeholders, stepper hints,
// or validation — that would re-advertise a bound no layer enforces.
export const MEASUREMENT_POINTS_CATALOG = [
  { slug: "pecho",            label: "Pecho",            bodyCoords: { x: 50, y: 28 }, minCm: 30, maxCm: 200 },
  { slug: "cintura",          label: "Cintura",          bodyCoords: { x: 50, y: 45 }, minCm: 30, maxCm: 200 },
  { slug: "gluteo",           label: "Glúteo",           bodyCoords: { x: 50, y: 56 }, minCm: 10, maxCm: 100 },
  { slug: "cuadriceps-alto",  label: "Cuádriceps Alto",  bodyCoords: { x: 40, y: 64 }, minCm: 10, maxCm: 100 },
  { slug: "cuadriceps-bajo",  label: "Cuádriceps Bajo",  bodyCoords: { x: 40, y: 76 }, minCm: 10, maxCm: 100 },
  { slug: "pantorrilla",      label: "Pantorrilla",      bodyCoords: { x: 40, y: 88 }, minCm: 10, maxCm: 100 },
  { slug: "biceps-relajado",  label: "Bíceps Relajado",  bodyCoords: { x: 28, y: 35 }, minCm: 10, maxCm: 100 },
  { slug: "biceps-contraido", label: "Bíceps Contraído", bodyCoords: { x: 28, y: 37 }, minCm: 10, maxCm: 100 },
] satisfies ReadonlyArray<Omit<MeasurementPoint, "active">>;

// ── Groups ────────────────────────────────────────────────────────────────────

// Anatomical grouping for the tile grid. Derived here (not on MeasurementPoint)
// so no Zod/Mongoose schema, coach editor, or data migration is touched.
// Two groups (upper/lower body) — glúteo counts as lower body. A slug with no
// mapping falls back to "Otros".
export const MEASUREMENT_GROUPS: Record<string, string> = {
  pecho: "Tren Superior",
  cintura: "Tren Superior",
  "biceps-relajado": "Tren Superior",
  "biceps-contraido": "Tren Superior",
  gluteo: "Tren Inferior",
  "cuadriceps-alto": "Tren Inferior",
  "cuadriceps-bajo": "Tren Inferior",
  pantorrilla: "Tren Inferior",
};

const OTHER_GROUP = "Otros";

// ── seedCatalog ───────────────────────────────────────────────────────────────

export function seedCatalog(): MeasurementPoint[] {
  return MEASUREMENT_POINTS_CATALOG.map((p) => ({ ...p, active: false }));
}

// ── validateMeasurement ───────────────────────────────────────────────────────

export type ValidationResult = { ok: true } | { ok: false; reason: string };

// REQ-BMT-02: a value is valid iff it is a finite, non-negative number.
// `point` is kept for the message label only — no per-point range is enforced.
export function validateMeasurement(
  point: MeasurementPoint,
  valueCm: number
): ValidationResult {
  if (!Number.isFinite(valueCm)) {
    return { ok: false, reason: `Valor inválido para ${point.label}` };
  }
  if (valueCm < 0) {
    return { ok: false, reason: `El valor para ${point.label} no puede ser negativo` };
  }
  return { ok: true };
}

// ── isFutureDate ──────────────────────────────────────────────────────────────

// Client-side pre-check mirroring BodyMeasurementSchema's future-date refine —
// gives immediate UI feedback before the round trip. Compares calendar days,
// ignoring time-of-day.
export function isFutureDate(date: Date): boolean {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return day > today;
}

// ── groupByPoint ──────────────────────────────────────────────────────────────

export function groupByPoint(
  measurements: BodyMeasurement[]
): Record<string, BodyMeasurement[]> {
  const result: Record<string, BodyMeasurement[]> = {};
  for (const m of measurements) {
    if (!result[m.pointSlug]) result[m.pointSlug] = [];
    result[m.pointSlug].push(m);
  }
  return result;
}

// ── getDeltaForLast ───────────────────────────────────────────────────────────

export function getDeltaForLast(
  measurements: BodyMeasurement[],
  pointSlug: string
): number | null {
  const forPoint = measurements
    .filter((m) => m.pointSlug === pointSlug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (forPoint.length < 2) return null;
  return forPoint[0].valueCm - forPoint[1].valueCm;
}

// ── isNoDataValue ─────────────────────────────────────────────────────────────

// REQ-BMT-04: a blank field or a value that parses to exactly 0 means "no
// data". Single source of truth for this rule — reused by buildMeasurementEntries
// (which persistable entries to skip) and the modal (the per-tile "no se
// guarda" hint), so the rule can't drift between the two call sites.
export function isNoDataValue(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return true;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed === 0;
}

// ── toPersistableEntries ──────────────────────────────────────────────────────

// REQ-BMT-04: a blank field or a value of 0 means "no data" and is never stored.
// Non-positive values (0 and negatives) are excluded from the persistable set;
// negatives are additionally surfaced as validation errors upstream.
export function toPersistableEntries<T extends { valueCm: number }>(
  entries: T[]
): T[] {
  return entries.filter((entry) => entry.valueCm > 0);
}

// ── buildMeasurementEntries ───────────────────────────────────────────────────

// REQ-BMT-02 partial-save fork (pure, client-side): turn raw tile strings into a
// batch of valid entries plus per-field errors. Blank and 0 are dropped silently
// (no-data); unparseable or negative values are flagged and their siblings still
// build. A comma is treated as a decimal separator.
export function buildMeasurementEntries(
  points: MeasurementPoint[],
  values: Record<string, string>,
  date: Date
): { entries: BodyMeasurement[]; fieldErrors: Record<string, string> } {
  const entries: BodyMeasurement[] = [];
  const fieldErrors: Record<string, string> = {};

  for (const point of points) {
    const raw = values[point.slug];
    if (raw === undefined || isNoDataValue(raw)) continue;

    const num = Number(raw.trim().replace(",", "."));
    if (!Number.isFinite(num)) {
      fieldErrors[point.slug] = "Ingresá un número válido";
      continue;
    }
    if (num < 0) {
      fieldErrors[point.slug] = "El valor no puede ser negativo";
      continue;
    }

    entries.push({ date, pointSlug: point.slug, valueCm: num });
  }

  return { entries, fieldErrors };
}

// ── validateMeasurementEntries ────────────────────────────────────────────────

// REQ-UTA-04: validate an entire measurement batch before any persistence runs.
// Fails on the first unknown slug or invalid value (non-finite / negative).
export function validateMeasurementEntries(
  points: MeasurementPoint[],
  entries: Array<{ pointSlug: string; valueCm: number }>
): ValidationResult {
  const bySlug = new Map(points.map((point) => [point.slug, point]));

  for (const entry of entries) {
    const point = bySlug.get(entry.pointSlug);
    if (!point) {
      return { ok: false, reason: `El punto "${entry.pointSlug}" no está configurado` };
    }
    const result = validateMeasurement(point, entry.valueCm);
    if (!result.ok) return result;
  }

  return { ok: true };
}

// ── sanitizeDecimalInput ──────────────────────────────────────────────────────

// Tile input sanitizer: keep digits and a single decimal separator, normalizing
// a comma to a dot. Removes the `type="number"` footguns (e/+/- and locale
// comma handling) and makes an input `min`/`max` attribute unnecessary.
export function sanitizeDecimalInput(raw: string): string {
  const normalized = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [head, ...rest] = normalized.split(".");
  if (rest.length === 0) return head;
  return `${head}.${rest.join("")}`;
}

// ── stepMeasurementValue ──────────────────────────────────────────────────────

// −/+ stepper: add `delta` (±0.5) to the current value, clamped at 0. A blank or
// unparseable current value is treated as 0.
export function stepMeasurementValue(current: string, delta: number): string {
  const parsed = Number(current.trim().replace(",", "."));
  const base = Number.isFinite(parsed) ? parsed : 0;
  const next = Math.max(0, Math.round((base + delta) * 100) / 100);
  return String(next);
}

// ── formatMeasurementReference ────────────────────────────────────────────────

// Per-tile reference line: "última: 85 cm (Δ -1.2)". Returns null when the point
// has no persisted history. The Δ is omitted when only one entry exists.
export function formatMeasurementReference(
  measurements: BodyMeasurement[],
  pointSlug: string
): string | null {
  const forPoint = measurements
    .filter((m) => m.pointSlug === pointSlug)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (forPoint.length === 0) return null;

  const last = forPoint[0].valueCm;
  const delta = getDeltaForLast(measurements, pointSlug);
  if (delta === null) return `última: ${last} cm`;

  const rounded = Number(delta.toFixed(1));
  const sign = rounded > 0 ? "+" : "";
  return `última: ${last} cm (Δ ${sign}${rounded})`;
}

// ── groupPoints ───────────────────────────────────────────────────────────────

// Bucket points into anatomical groups for the tile grid. Group order follows the
// first appearance of each group in the input; point order within a group is the
// input order — the anatomical layout stays stable across entry points.
export function groupPoints(
  points: MeasurementPoint[]
): Array<{ group: string; points: MeasurementPoint[] }> {
  const order: string[] = [];
  const byGroup = new Map<string, MeasurementPoint[]>();

  for (const point of points) {
    const group = MEASUREMENT_GROUPS[point.slug] ?? OTHER_GROUP;
    let bucket = byGroup.get(group);
    if (!bucket) {
      bucket = [];
      byGroup.set(group, bucket);
      order.push(group);
    }
    bucket.push(point);
  }

  return order.map((group) => ({ group, points: byGroup.get(group) ?? [] }));
}
