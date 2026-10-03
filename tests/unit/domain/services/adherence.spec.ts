import { describe, it, expect } from 'vitest';
import { buildWeeklyStrip, countPopped, findEntryForDate } from '@/domain/services/adherence';

// Jan 1 2024 is a Monday, so these fixtures land on known weekdays without
// relying on `Date.prototype.getDay()` quirks across locales/timezones.
const MONDAY = new Date(2024, 0, 8); // 2024-01-08, Monday
const WEDNESDAY = new Date(2024, 0, 10); // 2024-01-10, Wednesday

describe('buildWeeklyStrip', () => {
  it('always returns exactly 7 cells', () => {
    expect(buildWeeklyStrip([], WEDNESDAY)).toHaveLength(7);
  });

  it('builds a mid-week strip: popped days before today, pending today, locked future days', () => {
    const entries = [
      { date: new Date(2024, 0, 8) }, // Monday — popped
      { date: new Date(2024, 0, 9) }, // Tuesday — popped
    ];

    const cells = buildWeeklyStrip(entries, WEDNESDAY);

    expect(cells.map((c) => c.state)).toEqual([
      'popped', // Mon 8
      'popped', // Tue 9
      'pending', // Wed 10 (today, no entry)
      'locked', // Thu 11
      'locked', // Fri 12
      'locked', // Sat 13
      'locked', // Sun 14
    ]);
  });

  it('marks a past day with no entry as missed, never ambiguous-empty', () => {
    // No entries at all — Monday and Tuesday (before today) must read 'missed'.
    const cells = buildWeeklyStrip([], WEDNESDAY);

    expect(cells[0].state).toBe('missed'); // Mon 8
    expect(cells[1].state).toBe('missed'); // Tue 9
    expect(cells[2].state).toBe('pending'); // Wed 10 (today)
  });

  it('treats a Monday "today" as pending with the rest of the week locked', () => {
    const cells = buildWeeklyStrip([], MONDAY);

    expect(cells.map((c) => c.state)).toEqual([
      'pending', // Mon 8 (today)
      'locked', // Tue 9
      'locked', // Wed 10
      'locked', // Thu 11
      'locked', // Fri 12
      'locked', // Sat 13
      'locked', // Sun 14
    ]);
  });

  it('reads today as popped, not pending, when an entry exists for today', () => {
    const entries = [{ date: new Date(2024, 0, 10) }]; // Wednesday == today
    const cells = buildWeeklyStrip(entries, WEDNESDAY);

    expect(cells[2].state).toBe('popped'); // Wed 10 (today)
  });

  it('accepts string dates for entries, matched by calendar date', () => {
    const entries = [{ date: '2024-01-08T12:00:00' }]; // Monday, local datetime string
    const cells = buildWeeklyStrip(entries, WEDNESDAY);

    expect(cells[0].state).toBe('popped');
  });

  it('ignores time-of-day when comparing entry dates to the day grid', () => {
    const entries = [{ date: new Date(2024, 0, 9, 23, 59) }]; // Tuesday, late at night
    const cells = buildWeeklyStrip(entries, WEDNESDAY);

    expect(cells[1].state).toBe('popped'); // Tue 9
  });

  it('defaults `today` to the current date when omitted', () => {
    const cells = buildWeeklyStrip([]);
    expect(cells).toHaveLength(7);
    // Exactly one cell (today's) should be 'pending' when there are no entries
    // and today isn't locked-future relative to itself.
    expect(cells.filter((c) => c.state === 'pending')).toHaveLength(1);
  });
});

describe('countPopped', () => {
  it('counts only popped cells', () => {
    const cells = buildWeeklyStrip(
      [{ date: new Date(2024, 0, 8) }, { date: new Date(2024, 0, 9) }],
      WEDNESDAY
    );
    expect(countPopped(cells)).toBe(2);
  });

  it('returns 0 when nothing is popped', () => {
    expect(countPopped(buildWeeklyStrip([], MONDAY))).toBe(0);
  });
});

describe('findEntryForDate', () => {
  it('finds the entry matching the given calendar date, ignoring time-of-day', () => {
    const entries = [
      { date: new Date(2024, 0, 8), weight: 80 },
      { date: new Date(2024, 0, 10, 23, 59), weight: 79.5 },
    ];

    expect(findEntryForDate(entries, WEDNESDAY)?.weight).toBe(79.5);
  });

  it('returns undefined when no entry matches', () => {
    const entries = [{ date: new Date(2024, 0, 8), weight: 80 }];
    expect(findEntryForDate(entries, WEDNESDAY)).toBeUndefined();
  });

  it('matches string dates too', () => {
    const entries = [{ date: '2024-01-10T08:00:00', weight: 79.5 }];
    expect(findEntryForDate(entries, WEDNESDAY)?.weight).toBe(79.5);
  });
});
