// Pure helpers shared by the daily activity record tables (steps, weight).

export interface DatedRecord {
  date: Date | string;
}

// Short "Mon, Apr 13" label for the record's UTC calendar day, so a record
// stored at UTC midnight never shifts to the previous day in local time.
export function formatUTCDate(date: Date | string): string {
  const isoString = typeof date === "string" ? date : date.toISOString();
  const [year, month, day] = isoString.split("T")[0].split("-");
  const utcDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(utcDate);
}

// Newest first. Returns a new array; the input is left untouched.
export function sortRecordsByDateDesc<T extends DatedRecord>(records: T[]): T[] {
  return [...records].sort((a, b) => {
    const aISO = new Date(a.date).toISOString();
    const bISO = new Date(b.date).toISOString();
    return bISO.localeCompare(aISO);
  });
}
