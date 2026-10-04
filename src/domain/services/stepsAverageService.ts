import type { DailyStep } from "../types/DailySteps";

/**
 * Average daily step count across a list of entries, rounded to the
 * nearest step. Returns 0 for an empty list.
 */
export function calculateDailyAverage(entries: DailyStep[]): number {
  if (entries.length === 0) return 0;
  const sum = entries.reduce((acc, entry) => acc + entry.steps, 0);
  return Math.round(sum / entries.length);
}

/**
 * Average as a percentage of the step goal, capped at 100. Returns null when
 * no goal is set.
 */
export function calculateGoalProgressPercent(average: number, goal?: number): number | null {
  if (!goal) return null;
  return Math.min((average / goal) * 100, 100);
}
