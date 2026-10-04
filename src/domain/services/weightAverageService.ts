import type { DailyWeight } from "../types/DailyWeight";

/**
 * Normalises a Date to midnight UTC so comparisons are day-accurate
 * regardless of time-of-day.
 */
function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Calculates the average weight for a given date range using a
 * forward-fill strategy:
 *  - If a day has an entry, use it.
 *  - If a day has no entry, carry forward the most recent prior value.
 *  - If no prior value exists yet, use 0.
 *
 * Returns null when the entries array contains no data at all.
 */
export function calculateWeeklyAverage(
  entries: DailyWeight[],
  startDate: Date,
  endDate: Date
): number | null {
  if (entries.length === 0) return null;

  // Build a lookup keyed by "YYYY-MM-DD"
  const lookup = new Map<string, number>();
  for (const entry of entries) {
    const key = toDateKey(entry.date);
    lookup.set(key, entry.weight);
  }

  // Walk day-by-day, forward-filling
  const filled: number[] = [];
  let lastKnown = 0;
  let current = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    )
  );
  const end = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      endDate.getUTCMonth(),
      endDate.getUTCDate()
    )
  );

  while (current <= end) {
    const key = toDateKey(current);
    if (lookup.has(key)) {
      lastKnown = lookup.get(key)!;
    }
    filled.push(lastKnown);
    current = addDays(current, 1);
  }

  if (filled.length === 0) return null;

  const sum = filled.reduce((acc, v) => acc + v, 0);
  return sum / filled.length;
}

export interface WeightMetrics {
  min: number | null;
  max: number | null;
  avg: number | null;
}

/**
 * Returns min, max, and avg weight from a raw list of entries.
 * All fields are null when the list is empty.
 */
export function getWeightMetrics(entries: DailyWeight[]): WeightMetrics {
  if (entries.length === 0) {
    return { min: null, max: null, avg: null };
  }

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (const entry of entries) {
    if (entry.weight < min) min = entry.weight;
    if (entry.weight > max) max = entry.weight;
    sum += entry.weight;
  }

  return {
    min,
    max,
    avg: sum / entries.length,
  };
}

export interface WeightSummary {
  latest: number;
  lightest: number;
  heaviest: number;
}

/**
 * Latest (last entry as recorded), lightest and heaviest weights.
 * Returns null when there are no entries.
 */
export function summarizeWeights(entries: DailyWeight[]): WeightSummary | null {
  const { min, max } = getWeightMetrics(entries);
  if (min === null || max === null) return null;
  return { latest: entries[entries.length - 1].weight, lightest: min, heaviest: max };
}
