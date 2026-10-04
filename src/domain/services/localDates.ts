// Calendar-day helpers for `<input type="date">` values ("YYYY-MM-DD").
// Both work in the user's local timezone: `new Date("YYYY-MM-DD")` parses as
// UTC midnight, which lands on the previous local day west of UTC.

// "YYYY-MM-DD" → local midnight of that calendar day.
export function parseLocalISODate(dateISO: string): Date {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Date → "YYYY-MM-DD" of its local calendar day.
export function toLocalISODate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
