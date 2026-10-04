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
 * Adherence percentage for a weekly strip: popped cells divided by
 * "trackable" cells (every cell except `locked` future days), rounded to the
 * nearest whole percent. `locked` cells are excluded from the denominator —
 * a client isn't penalized for days that haven't happened yet. Returns 0
 * when there is nothing trackable yet (e.g. the very start of the week).
 */
export function calculateAdherencePct(cells: WeekCell[]): number {
  const trackable = cells.filter((cell) => cell.state !== 'locked').length;
  if (trackable === 0) return 0;
  return Math.round((countPopped(cells) / trackable) * 100);
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

/**
 * Whole calendar days between the most recent entry and `today` (0 = logged
 * today, 1 = yesterday, …). `undefined` when there are no entries at all.
 * Feeds the roster's "Último registro: hace N días" line. Entries dated in
 * the future (clock skew) clamp to 0 rather than going negative.
 */
export function daysSinceLastEntry(entries: DatedEntry[], today: Date = new Date()): number | undefined {
  if (entries.length === 0) return undefined;
  const todayStart = startOfDay(today);
  const latest = entries
    .map((entry) => startOfDay(toDate(entry.date)))
    .reduce((max, date) => (date.getTime() > max.getTime() ? date : max));
  const msPerDay = 24 * 60 * 60 * 1000;
  // Math.round absorbs the ±1h DST shift between two local midnights.
  return Math.max(0, Math.round((todayStart.getTime() - latest.getTime()) / msPerDay));
}

export type AdherenceTier = 'low' | 'fair' | 'good';

// Thresholds from the "Coach — Roster" artboard: <50% needs attention,
// 50–84% is adequate but unremarkable, 85%+ is "going well".
export function getAdherenceTier(pct: number): AdherenceTier {
  if (pct < 50) return 'low';
  if (pct < 85) return 'fair';
  return 'good';
}

// Most-empty-first ("lo que necesita atención está arriba"); name breaks ties
// so the order is stable. Returns a new array.
export function sortByAdherence<T extends { name: string; adherencePct: number }>(clients: T[]): T[] {
  return [...clients].sort(
    (a, b) => a.adherencePct - b.adherencePct || a.name.localeCompare(b.name, 'es'),
  );
}
