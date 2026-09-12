# Delta for body-measurements-tracking

**Change**: measurement-input-redesign
**Date**: 2026-09-08

---

## MODIFIED Requirements

### REQ-BMT-02: Client Logs Measurements (Batch Entry)

The system SHALL allow a client to submit one or more measurement entries in a single modal action. Each entry MUST include a point slug, a value in cm, and a date. Notes are optional.

(Previously: `valueCm` had to fall within the per-point catalog range; the batch was all-or-none — any single invalid field discarded the entire batch.)

| Attribute | Rule |
|-----------|------|
| Date | Past dates only (today or earlier); future dates MUST be rejected |
| Points selectable | Only active points (coach-configured) |
| valueCm | MUST be a finite number and MUST NOT be negative. There is NO per-point minimum or maximum. |
| No-data | A blank field or a value of `0` means "no data": it MUST NOT be persisted and MUST NOT raise an error |
| Notes | Optional free text, max 500 chars |
| Submission (partial save) | Each valid entry in the batch MUST be persisted even when a sibling entry in the same batch is invalid. An invalid entry MUST be reported to the client and MUST NOT be persisted. |
| Duplicate date+point | New value replaces existing entry (upsert) |

#### Scenario: Client submits a valid 3-point batch

- GIVEN `cintura`, `pecho`, and `biceps-relajado` are active
- WHEN the client enters 80 cm / 95 cm / 35 cm and submits
- THEN all 3 entries are persisted and appear in the history table without a page reload

#### Scenario: Client submits a value of 0

- GIVEN `cintura` is active
- WHEN the client enters `0` for `cintura` and submits
- THEN no entry is persisted for `cintura` and no validation error is shown for that field

#### Scenario: Client leaves a field blank

- GIVEN `cintura` and `pecho` are active
- WHEN the client enters 82 cm for `cintura`, leaves `pecho` blank, and submits
- THEN only the `cintura` entry is persisted; `pecho` has no entry for that date

#### Scenario: Client submits a large value

- GIVEN `pantorrilla` is active
- WHEN the client enters 250 cm and submits
- THEN the entry is persisted with `valueCm = 250` — no out-of-range error

#### Scenario: Client submits a negative value

- GIVEN `cintura` is active
- WHEN the client enters `-5` for `cintura` and submits
- THEN the system shows a validation error for that field and does NOT persist that entry

#### Scenario: Client submits a non-numeric value

- GIVEN `cintura` is active
- WHEN the field parses to `NaN` (not a finite number)
- THEN the system shows a validation error for that field and does NOT persist that entry

#### Scenario: Batch with one invalid entry and two valid entries

- GIVEN `cintura`, `pecho`, and `pantorrilla` are active
- WHEN the client enters 82 cm for `cintura`, 97 cm for `pecho`, and `-3` for `pantorrilla`, then submits
- THEN the `cintura` and `pecho` entries are persisted
- AND the `pantorrilla` entry is not persisted and is reported as invalid

#### Scenario: Client selects a future date

- GIVEN the add modal is open
- WHEN the client selects tomorrow's date
- THEN the system shows "La fecha no puede ser futura" and does NOT persist any entry

#### Scenario: Client resubmits the same date for an existing point

- GIVEN an entry exists: `cintura`, 2026-05-01, 80 cm
- WHEN the client logs `cintura` on 2026-05-01 with 82 cm
- THEN the existing entry is updated to 82 cm (upsert — no duplicate)

---

### REQ-BMT-04: Measurement Trends Chart (Single Point with Dropdown)

The system SHALL display a trends chart (Recharts AreaChart) for one measurement point at a time. A dropdown selector allows the client to switch between active points. A date with no persisted entry for a point — including dates where the client left the field blank or entered `0` — MUST render as a gap (an absent data point) in the trends chart, the history table, and any point-entry counts. The system MUST NOT plot or display a synthetic `0` for missing data.

(Previously: the requirement covered only the chart; no explicit rule that missing data renders as a gap rather than a plotted `0`.)

| Element | Behavior |
|---------|----------|
| Default point | First active point alphabetically by slug |
| Dropdown options | All active points (slug + label) |
| Y-axis | Range auto-fitted to data; min = 0 |
| Missing data | Rendered as a gap — never a plotted `0`; the line is not connected across the gap |
| Empty state | "No hay datos para este punto" when no entries exist |
| Formatter | Defensive: `undefined` values MUST NOT crash the formatter |

#### Scenario: Client views trend chart for a point

- GIVEN `cintura` has 5 logged entries across the last month
- WHEN the client is on the Measurements tab
- THEN the chart renders an area line for `cintura` with all 5 data points

#### Scenario: Client switches point via dropdown

- GIVEN the chart is showing `cintura` data
- WHEN the client selects `pecho` from the dropdown
- THEN the chart re-renders with `pecho` data only

#### Scenario: Chart with no data for selected point

- GIVEN `biceps-relajado` is active but has no entries
- WHEN the client selects it from the dropdown
- THEN the chart shows "No hay datos para este punto" empty state

#### Scenario: Skipped value renders as a gap, not a zero

- GIVEN `cintura` has entries on 2026-05-01 (80 cm) and 2026-05-15 (82 cm) and the client submitted `0` (or blank) for 2026-05-08
- WHEN the client views the `cintura` trends chart
- THEN 2026-05-08 shows no data point and the line is not drawn down to `0`

#### Scenario: No-data date absent from history table

- GIVEN the client submitted a blank value for `pecho` on 2026-05-08
- WHEN the client views the history table
- THEN there is no `pecho` row for 2026-05-08

#### Scenario: Point-entry counts ignore skipped values

- GIVEN `gluteo` has 2 real entries and the client also submitted `0` for it once
- WHEN a point-entry count is computed for `gluteo`
- THEN the count is 2

---

## REMOVED Requirements

### REQ-BMT-07: Validation Ranges Enforced at API Boundary

(Reason: Per-point configured-range validation is removed entirely. Value validation now reduces to "finite and non-negative", enforced uniformly at every boundary. Hardcoded trunk/limb ranges rejected legitimate bodies and made "no value" inexpressible.)

(Migration: Remove the range branch from `validateMeasurementValue`/`validateMeasurement` and the equivalent checks in the server action, tracking API schema, Mongoose sub-schema, and the modal. `minCm`/`maxCm` remain on the `MeasurementPoint` type as advisory, unenforced metadata — no data migration. Existing entries that fell outside the old ranges remain valid and readable.)
