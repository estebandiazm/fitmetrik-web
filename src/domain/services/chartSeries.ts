// Day-bucketed series for the activity charts (steps, weight). Days are the
// user's local calendar days: keying by `toISOString()` (UTC) would move
// evening records west of UTC onto the next day.
import { toLocalISODate } from './localDates';

export interface DayBucket<T> {
  label: string;
  entry: T | undefined;
}

// One bucket per day for the last `daysBack` days ending today (oldest
// first); each bucket holds the first entry recorded on that local day.
export function bucketByLocalDay<T extends { date: Date | string }>(
  entries: T[],
  daysBack: number,
  now: Date = new Date(),
): DayBucket<T>[] {
  const byDay = new Map<string, T>();
  for (const entry of entries) {
    const key = toLocalISODate(new Date(entry.date));
    if (!byDay.has(key)) byDay.set(key, entry);
  }

  return Array.from({ length: daysBack }, (_, index) => {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysBack - 1 - index));
    return {
      label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      entry: byDay.get(toLocalISODate(day)),
    };
  });
}
