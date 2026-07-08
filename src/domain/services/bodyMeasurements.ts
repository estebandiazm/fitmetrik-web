import type { MeasurementPoint } from "../types/MeasurementPoint";
import type { BodyMeasurement } from "../types/BodyMeasurement";

// ── Catalog ───────────────────────────────────────────────────────────────────

// Category ranges per spec REQ-BMT-07:
//   trunk/core (pecho, cintura): 30–200 cm
//   limbs (all others):           10–100 cm
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

// ── seedCatalog ───────────────────────────────────────────────────────────────

export function seedCatalog(): MeasurementPoint[] {
  return MEASUREMENT_POINTS_CATALOG.map((p) => ({ ...p, active: false }));
}

// ── validateMeasurement ───────────────────────────────────────────────────────

type ValidationResult = { ok: true } | { ok: false; reason: string };

export function validateMeasurement(
  point: MeasurementPoint,
  valueCm: number
): ValidationResult {
  if (valueCm < point.minCm) {
    return { ok: false, reason: `Valor mínimo para ${point.label}: ${point.minCm} cm` };
  }
  if (valueCm > point.maxCm) {
    return { ok: false, reason: `Valor máximo para ${point.label}: ${point.maxCm} cm` };
  }
  return { ok: true };
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
