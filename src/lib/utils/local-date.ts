// `toISOString()` renders the UTC date, and `new Date(isoDateString)` parses
// an ISO date-only string as UTC midnight — both silently shift by a day for
// any user west of UTC (all of this product's confirmed LatAm audience) once
// the result is re-interpreted in local time (e.g. via `setHours(0,0,0,0)`).
// Build and parse YYYY-MM-DD values in local time instead.

export function todayLocalISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}
