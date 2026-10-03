/**
 * Weekly bucketing for the "Blister Adherence" direction: turns a flat list
 * of dated entries into a 7-cell Monday–Sunday grid, where each cell's state
 * reflects whether that day was logged (popped), explicitly in the past with
 * no log (missed — never ambiguous-empty), today with no log yet (pending),
 * or not reachable yet (locked, future).
 */

export type WeekCellState = 'popped' | 'missed' | 'pending' | 'locked';

export interface WeekCell {
  date: Date;
  state: WeekCellState;
}

interface DatedEntry {
  date: Date | string;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Monday of the ISO week containing `date` (local calendar, time stripped). */
function startOfIsoWeek(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);
  return start;
}

/** Decides a single cell's state — isolated so `buildWeeklyStrip` stays a thin loop. */
function resolveCellState(cellDate: Date, todayStart: Date, hasEntry: boolean): WeekCellState {
  if (cellDate.getTime() > todayStart.getTime()) return 'locked';
  if (hasEntry) return 'popped';
  if (isSameCalendarDay(cellDate, todayStart)) return 'pending';
  return 'missed';
}

/**
 * Buckets `entries` into the 7 days (Monday–Sunday) of the week containing
 * `today` (defaults to `new Date()`). Comparisons are calendar-date only —
 * time-of-day on either `today` or an entry's `date` is ignored.
 */
export function buildWeeklyStrip(entries: DatedEntry[], today: Date = new Date()): WeekCell[] {
  const todayStart = startOfDay(today);
  const weekStart = startOfIsoWeek(todayStart);
  const entryDates = entries.map((entry) => startOfDay(toDate(entry.date)));

  const cells: WeekCell[] = [];
  for (let offset = 0; offset < 7; offset++) {
    const cellDate = new Date(weekStart);
    cellDate.setDate(cellDate.getDate() + offset);
    const hasEntry = entryDates.some((entryDate) => isSameCalendarDay(entryDate, cellDate));
    cells.push({ date: cellDate, state: resolveCellState(cellDate, todayStart, hasEntry) });
  }

  return cells;
}

/** Number of logged days in a weekly strip — the "X/7 esta semana" count. */
export function countPopped(cells: WeekCell[]): number {
  return cells.filter((cell) => cell.state === 'popped').length;
}

/**
 * Finds the entry (if any) landing on the same calendar day as `date`,
 * ignoring time-of-day. Lets consumers (e.g. a "today's logged weight"
 * label) read the underlying value without re-implementing date comparison.
 */
export function findEntryForDate<T extends DatedEntry>(entries: T[], date: Date): T | undefined {
  const target = startOfDay(date);
  return entries.find((entry) => isSameCalendarDay(startOfDay(toDate(entry.date)), target));
}
