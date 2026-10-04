// Day-bucketed series for the activity charts (steps, weight). Days are the
// user's local calendar days: keying by `toISOString()` (UTC) would move
// evening records west of UTC onto the next day.
import { parseLocalISODate, toLocalISODate } from './localDates';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// `new Date('YYYY-MM-DD')` is UTC midnight, which is the previous local day
// west of UTC, so date-only strings are read as local calendar dates.
function toEntryDate(date: Date | string): Date {
  return typeof date === 'string' && DATE_ONLY.test(date) ? parseLocalISODate(date) : new Date(date);
}

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
    const key = toLocalISODate(toEntryDate(entry.date));
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
