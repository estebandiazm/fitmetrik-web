# Spec: body-measurements-tracking

**Type**: NEW capability (full spec)
**Change**: body-measurements-tracking
**Date**: 2026-05-10

---

## Overview

Coaches configure which body measurement points each client tracks. Clients log circumference values (cm) for those points and view progress through a body diagram, trends chart, and history table on the `/activity` page — the third leg of the tracking trio alongside Steps and Weight.

---

## Measurement Point Catalog (Static)

| Slug | Label | Category | Valid Range (cm) |
|------|-------|----------|-----------------|
| `pantorrilla` | Pantorrilla | limb | 10–100 |
| `cuadriceps-alto` | Cuádriceps Alto | limb | 10–100 |
| `cuadriceps-bajo` | Cuádriceps Bajo | limb | 10–100 |
| `gluteo` | Glúteo | limb | 10–100 |
| `cintura` | Cintura | trunk/core | 30–200 |
| `pecho` | Pecho | trunk/core | 30–200 |
| `biceps-relajado` | Bíceps Relajado | limb | 10–100 |
| `biceps-contraido` | Bíceps Contraído | limb | 10–100 |

Each point carries `bodyCoords: { x: number, y: number }` on a 0–100 scale for SVG positioning.

---

## Requirements

### REQ-BMT-01: Coach Configures Measurement Points Per Client

The system SHALL allow a coach to activate or deactivate any subset of the 8 catalog points for a given client. Deactivation MUST preserve all existing log entries for that point.

| Attribute | Rule |
|-----------|------|
| Initial state | All 8 points start inactive for a new client |
| Activation | Coach toggles individual points on/off |
| Deactivation with entries | Allowed; data preserved; coach sees a warning if entries exist |
| Persistence | Saved via `setMeasurementPoints` Server Action |

#### Scenario: Coach activates measurement points

- GIVEN the coach is on the client profile page
- WHEN the coach enables `cintura` and `pecho` and saves
- THEN those two points are active for the client and visible in the client's body diagram and add modal

#### Scenario: Coach deactivates a point that has existing entries

- GIVEN `biceps-relajado` is active and has 3 logged entries
- WHEN the coach disables the point and saves
- THEN a warning is shown before saving; upon confirmation the point becomes inactive; existing entries remain in the history table
- AND the point no longer appears in the body diagram or add modal

#### Scenario: Coach saves with no points selected

- GIVEN a client with all points inactive
- WHEN the coach opens the editor and saves without toggling anything
- THEN the client has 0 active points; the Measurements tab shows an empty state

---

### REQ-BMT-02: Client Logs Measurements (Batch Entry)

The system SHALL allow a client to submit one or more measurement entries in a single modal action. Each entry MUST include a point slug, a value in cm, and a date. Notes are optional.

| Attribute | Rule |
|-----------|------|
| Date | Past dates only (today or earlier); future dates MUST be rejected |
| Points selectable | Only active points (coach-configured) |
| valueCm | Must be within the per-point valid range (see catalog table) |
| Notes | Optional free text, max 500 chars |
| Submission | All entries in the batch succeed or none are persisted |
| Duplicate date+point | New value replaces existing entry (upsert) |

#### Scenario: Client submits a valid 3-point batch

- GIVEN `cintura`, `pecho`, and `biceps-relajado` are active
- WHEN the client opens AddMeasurementModal, enters 80 cm / 95 cm / 35 cm, and submits
- THEN all 3 entries are persisted and appear in the history table without a page reload

#### Scenario: Client submits an out-of-range value

- GIVEN `pantorrilla` is active (valid range: 10–100 cm)
- WHEN the client enters 150 cm for `pantorrilla` and attempts to submit
- THEN the system shows an inline validation error "Valor fuera del rango válido (10–100 cm)" and does NOT persist any entry in the batch

#### Scenario: Client selects a future date

- GIVEN the add modal is open
- WHEN the client selects tomorrow's date
- THEN the system shows "La fecha no puede ser futura" and does NOT persist the entry

#### Scenario: Client resubmits the same date for an existing point

- GIVEN an entry exists: `cintura`, 2026-05-01, 80 cm
- WHEN the client logs `cintura` on 2026-05-01 with 82 cm
- THEN the existing entry is updated to 82 cm (upsert — no duplicate)

---

### REQ-BMT-03: Body Diagram (Point Selector)

The system SHALL render an inline SVG body silhouette in the Measurements tab with `<circle>` hotspots at positions defined by `bodyCoords` on each active measurement point.

| Interaction | Behavior |
|-------------|----------|
| Tap/click hotspot | Pre-selects that point in AddMeasurementModal |
| Inactive point | Not rendered on the diagram |
| No active points | Diagram shows empty state: "No hay puntos activos" |

#### Scenario: Client taps a hotspot to open the modal

- GIVEN `cintura` is active with `bodyCoords: { x: 50, y: 45 }`
- WHEN the client taps the `cintura` circle on the SVG
- THEN the AddMeasurementModal opens with `cintura` pre-selected

#### Scenario: Coach deactivates all points — diagram empty state

- GIVEN a client has no active measurement points
- WHEN the client navigates to the Measurements tab
- THEN the body diagram area shows "No hay puntos activos" with a prompt to contact their coach

---

### REQ-BMT-04: Measurement Trends Chart (Single Point with Dropdown)

The system SHALL display a trends chart (Recharts AreaChart) for one measurement point at a time. A dropdown selector allows the client to switch between active points.

| Element | Behavior |
|---------|----------|
| Default point | First active point alphabetically by slug |
| Dropdown options | All active points (slug + label) |
| Y-axis | Range auto-fitted to data; min = 0 |
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

---

### REQ-BMT-05: Measurement History Table

The system SHALL display a history table on the Measurements tab listing all entries for all active points, ordered by date descending.

| Column | Content |
|--------|---------|
| Fecha | Human-readable date (e.g., "May 1, 2026") |
| Punto | Point label (Spanish) |
| Medida | Value in cm (e.g., "80 cm") |
| Cambio Δ | Delta vs. previous entry for the same point ("—" if first entry) |

Entries for deactivated points MUST still appear in the history table (historical visibility preserved).

#### Scenario: Client views history with multiple points

- GIVEN entries: `cintura` 80 cm (May 1) and 82 cm (May 8); `pecho` 95 cm (May 1)
- WHEN the client views the history table
- THEN May 8 row shows `cintura` | 82 cm | +2 cm; May 1 `cintura` row shows 80 cm | —; May 1 `pecho` row shows 95 cm | —

#### Scenario: Delta for deactivated point remains visible

- GIVEN `gluteo` was active, has 2 entries, then coach deactivated it
- WHEN the client views the history table
- THEN both `gluteo` entries appear with correct delta; the point is absent from the diagram and add modal only

#### Scenario: Empty state — no measurements ever logged

- GIVEN the client has never logged any measurement
- WHEN the client visits the Measurements tab
- THEN the history table shows "No hay mediciones registradas aún"

---

### REQ-BMT-06: Measurements Tab on Activity Page

The system SHALL add a third "Measurements" tab to the `ActivityPageClient` component alongside the existing "Steps" and "Weight" tabs. The existing tabs MUST remain functionally unchanged.

#### Scenario: Client navigates to the Measurements tab

- GIVEN the client is on `/activity`
- WHEN the client taps the "Mediciones" tab
- THEN the Measurements tab renders with the body diagram, add button, trends chart, and history table
- AND the Steps and Weight tabs retain their existing content and behavior

#### Scenario: Steps and Weight tabs unaffected (regression guard)

- GIVEN the Measurements tab has been added
- WHEN the client navigates to the Steps or Weight tab
- THEN those tabs behave exactly as before this change

---

### REQ-BMT-07: Validation Ranges Enforced at API Boundary

The system SHALL enforce per-point validation ranges via `validateMeasurementValue(pointSlug, valueCm)` in the Server Action AND return a structured error to the client UI without persisting invalid data.

| Category | Range |
|----------|-------|
| trunk/core (`cintura`, `pecho`) | 30–200 cm |
| limbs (all others) | 10–100 cm |

#### Scenario: Valid value passes server-side validation

- GIVEN `cintura` (trunk/core) with valueCm = 85
- WHEN `addMeasurementEntries` is called
- THEN the entry is persisted and the action returns `{ ok: true }`

#### Scenario: Out-of-range value rejected at server action

- GIVEN `pantorrilla` (limb) with valueCm = 120
- WHEN `addMeasurementEntries` is called
- THEN the action returns `{ ok: false, reason: "pantorrilla: valor fuera del rango (10–100 cm)" }` and nothing is persisted

---

## Out of Scope

- Dashboard widget for body measurements (deferred to separate change)
- Cross-point overlay / comparison charts (v2)
- DB-configurable validation ranges per point (v1: static in code)
- Photo attachments for measurement sessions
- Body fat % / circumference-based composition formulas
- Editable/extensible catalog (coach picks from static 8 only)
- Reminders / scheduled measurement nudges
- Migration of historical measurements (none exist; new data only)
