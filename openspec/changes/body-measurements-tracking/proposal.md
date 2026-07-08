# Proposal: Body Measurements Tracking

## Intent

Enable coaches to define a per-client catalog of body measurement points (e.g. cintura, pecho, bíceps) and let clients log circumference values (in cm) for those points over time, then view their progress through an interactive body diagram, a trends chart, and a history table on the existing `/activity` page. This closes the third leg of the tracking trio (Steps · Weight · Measurements), giving coach and client a richer view of body composition changes that weight alone does not capture — and it follows the exact same domain/embedded-document/Server-Actions pattern already used for steps and weight, so no new architectural concepts are introduced.

## Scope

### IN

- New domain types: `MeasurementPoint` (coach config) and `BodyMeasurement` (client log entry), defined as Zod schemas in `src/domain/types/`.
- Extension of the `Client` Mongoose schema with two embedded arrays: `measurementPoints[]` and `measurements[]`.
- Static seed catalog of 8 measurement points in code (`pantorrilla`, `cuadriceps-alto`, `cuadriceps-bajo`, `gluteo`, `cintura`, `pecho`, `biceps-relajado`, `biceps-contraido`) with English slugs, Spanish labels, and `bodyCoords: {x, y}` on a 0–100 scale. Coach picks which ones to activate per client.
- Static validation ranges (per-point or per-category) in `domain/services/` — trunk/core 30–200 cm; limbs 10–100 cm. NOT DB-configurable in v1.
- New Server Actions in `src/app/actions/clientActions.ts`: `setMeasurementPoints` (coach activates/deactivates points per client), `addMeasurementEntries` (batch add multiple measurements in one submission), `getMeasurementEntries` (range query).
- Extension of `POST /api/clients/[clientId]/tracking` with an optional `measurements[]` field on `TrackingEntrySchema` — non-breaking.
- Coach UI: `MeasurementPointsEditor` component on `(dashboard)/clients/[clientId]/page.tsx`, allowing the coach to toggle which of the 8 catalog points are active for that client.
- Client UI: a third tab "Measurements" on `(client-portal)/activity` with four new components:
  - `BodyDiagram` — inline SVG silhouette with `<circle>` hotspots driven by `bodyCoords` from each active point.
  - `AddMeasurementModal` — batch entry; select multiple zones, enter cm values, single submit.
  - `MeasurementTrendsChart` — one point at a time with a dropdown selector to switch points (Recharts AreaChart, same wrapper pattern as `WeightTrendsChart`).
  - `MeasurementHistory` — history table: Fecha · Punto · Medida (cm) · Cambio Δ.
- Playwright E2E coverage for the coach configuration flow and the client batch-entry + chart switch flow.

### OUT (explicitly deferred)

- **Dashboard widget for measurements** — the dashboard already has a 4-widget grid; adding a fifth breaks layout. Defer to a separate change (potentially a "compact last-measurement row" below the existing widgets).
- **Cross-point overlay / comparison charts** — viewing two points on the same chart is a v2 enhancement.
- **DB-configurable validation ranges per point** — ranges live in code in v1; only revisit if/when ranges become coach-customizable.
- **Photo attachments for measurement sessions** — out of scope.
- **Body fat % / circumference-based composition formulas** (Navy method, etc.) — out of scope; we store raw cm values only.
- **Editable/extensible catalog from the coach side** — coach picks from the static 8, cannot add custom points in v1.
- **Reminders / scheduled measurement nudges** — out of scope.
- **Migration of historical measurements** — none exist; new clients start empty.

## Approach

### Schema (M1 — Fully Embedded)

Both arrays live as embedded subdocuments on the existing `Client` document, mirroring `dailySteps`/`dailyWeights`:

```
Client {
  …existing fields…
  measurementPoints: MeasurementPoint[]   // coach config
  measurements:      BodyMeasurement[]    // client logs
}

MeasurementPoint  { slug, label, bodyCoords: { x: 0–100, y: 0–100 }, active: boolean }
BodyMeasurement   { date: Date, pointSlug: string, valueCm: number, notes?: string }
```

Volume math justifying M1: weekly cadence × 8 points × 2 years ≈ 830 entries ≈ 66 KB per client doc — well below MongoDB's 16 MB document ceiling and below the comfort threshold for read-heavy workloads. If cadence later proves daily, migrate to a separate `BodyMeasurement` collection at that point — not now (premature optimization).

### Domain types

- `MeasurementPointSchema` / `MeasurementPoint` — Zod schema for catalog entry (with `bodyCoords` sub-shape).
- `BodyMeasurementSchema` / `BodyMeasurement` — Zod schema for a single log entry.
- `MEASUREMENT_POINTS_CATALOG` — static array of 8 seed objects exported from `domain/services/measurement-catalog.ts`. Coach activates a subset; only `active === true` points are shown to the client.
- `validateMeasurementValue(pointSlug, valueCm)` — pure function in `domain/services/` returning a discriminated `{ ok: true } | { ok: false; reason: string }` using a static range lookup.

### API

Extend `TrackingEntrySchema` (`POST /api/clients/[clientId]/tracking`):

```
{
  steps?:        number,
  weight?:       number,
  measurements?: Array<{ pointSlug: string; valueCm: number; notes?: string }>,
  date?:         string,
}
```

Backward compatible — existing consumers ignore the new optional field. Server route dispatches to `addMeasurementEntries` when `measurements[]` is present.

### UI

- **Coach side** (`(dashboard)/clients/[clientId]/page.tsx`): a "Measurement Points" card listing all 8 catalog points with a toggle each. Saving calls `setMeasurementPoints` Server Action with the slugs of active points.
- **Client side** (`(client-portal)/activity` → `ActivityPageClient`): add a third tab "Measurements" alongside "Steps" and "Weight". The tab contains, top-to-bottom:
  1. `BodyDiagram` with active-point hotspots — tap a hotspot to pre-select that point in the add modal.
  2. "+ Agregar medidas" button → `AddMeasurementModal` (batch: multi-select zones with cm inputs).
  3. `MeasurementTrendsChart` with dropdown to pick which active point to chart.
  4. `MeasurementHistory` table.

### Validation

- Zod schema enforces structural shape (`valueCm > 0`, `pointSlug` non-empty, `date` valid ISO).
- `validateMeasurementValue()` enforces realistic range per point category at the Server Action boundary AND in the modal (early UX feedback) — same value, two enforcement points (defence in depth).
- Coach cannot deactivate a point that has existing log entries without an explicit confirmation step (UX guardrail; data is preserved either way).

### Locked decisions (from exploration — not re-litigated)

1. Ownership: coach defines points per client.
2. Schema: M1 fully embedded.
3. UI location: third tab on `/activity` (NOT a dedicated route).
4. Body diagram: inline SVG `<circle>` hotspots, coords data-driven on the point definition.
5. Modal: batch entry (multi-point in one submit).
6. Trends chart: one point with dropdown.
7. API: extend `/tracking` non-breaking.
8. Validation: static ranges in `domain/services/`.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Document size growth if measurement cadence becomes daily instead of weekly | Volume math is based on weekly cadence (≈66 KB at 2 years). If real-world data shows daily cadence emerging, migrate to separate collection in a follow-up change — schema is structurally identical, only the storage location differs. Document this as a known evolution path in the design phase. |
| Body diagram coordinate mapping (8 points × precise SVG positioning) is fiddly | Coords are data-driven on `MeasurementPoint`, not hardcoded in JSX. Adjusting a position is a config edit, not a code change. Initial values get tuned visually against the silhouette during apply; design phase will produce an annotated SVG reference. |
| Coach deactivates a point that has log entries — confusing UX (history visible? hidden?) | Keep historical entries always visible in `MeasurementHistory`. Deactivation only removes the point from the body diagram and the add modal. Modal warns coach if any active log entries exist for the point being deactivated. |
| `measurementPoints[]` and `measurements[]` add weight to every `Client` document read across the app | Mongoose projection: routes that don't need measurements (e.g. client list) should not select these arrays. Document this in design + add explicit projections at high-traffic query sites. |
| Validation range static list goes stale (e.g. coach reports legitimate value outside range) | v1 accepts a "force override" flag in the modal logged as a `notes` annotation. Future change can promote ranges to per-client config if needed. |
| Recharts `AreaChart` formatter undefined-value crash (regression already fixed for weight chart on current branch) | Reuse the defensive formatter pattern already established in `TrendsChart` for the new `MeasurementTrendsChart`. Design phase will reference the fix. |
| Batch entry UX (modal with N inputs) feels heavy on mobile | Modal renders one row per selected point with a single cm input and inline range hint; bottom-sticky "Guardar" button. Validate inline. Playwright covers a 3-point batch submit. |

## Open Questions

All key decisions locked during exploration.

## Acceptance Criteria Summary (high-level)

- Coach can activate/deactivate any of the 8 catalog points for a specific client and the change persists.
- Client sees only the active points on the body diagram and in the "+ Agregar medidas" modal.
- Client can submit a batch of measurements (≥1 point, ≤8 points) in a single modal action and they appear in the trends chart and history table without a page reload.
- Trends chart updates when the client picks a different active point from the dropdown.
- History table shows date, point label, value in cm, and the delta (Δ) versus the previous entry for that same point.
- Out-of-range values are rejected at the Server Action with a user-facing message; in-range values are accepted.
- `POST /api/clients/[clientId]/tracking` accepts `measurements[]` and also still accepts `steps`/`weight`-only payloads unchanged.
- Existing Steps and Weight tabs are functionally untouched.
- Playwright E2E covers: coach activates points; client adds a 3-point batch; client switches the chart point.
- No regression on existing E2E (login, dashboard, steps tab, weight tab).
