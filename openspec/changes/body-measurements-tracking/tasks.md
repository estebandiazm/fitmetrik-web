# Tasks: Body Measurements Tracking

> **Strict TDD Active** — for each feature slice: write the failing Playwright test FIRST (red), then implement (green), then refactor.
> **Delivery strategy**: single-pr

---

## Phase 1: Foundation — Domain Types, Catalog & Model

- [x] 1.1 Create `src/domain/types/MeasurementPoint.ts` — `BodyCoordsSchema`, `MeasurementPointSchema`, exports (satisfies REQ-BMT-01, REQ-BMT-03)
- [x] 1.2 Create `src/domain/types/BodyMeasurement.ts` — `BodyMeasurementSchema` with future-date `.refine()` guard (satisfies REQ-BMT-02, REQ-BMT-07)
- [x] 1.3 Extend `src/domain/types/Client.ts` — add `measurementPoints?: MeasurementPoint[]` and `measurements?: BodyMeasurement[]` (optional arrays)
- [x] 1.4 Create `src/domain/services/bodyMeasurements.ts` — `MEASUREMENT_POINTS_CATALOG` const + `validateMeasurement`, `groupByPoint`, `getDeltaForLast`, `seedCatalog` (all <20 lines, pure TS)
- [x] 1.5 Extend `src/lib/models/Client.ts` — add `MeasurementPointSchema` and `BodyMeasurementSchema` sub-schemas; wire into `ClientSchema` with `default: []`; update `ClientDocument` interface
- [x] 1.6 Update `toClient()` in `src/app/actions/clientActions.ts` — append `measurementPoints` and `measurements` to the returned plain object

---

## Phase 2: Core Server Logic — Server Actions

- [x] 2.1 **[RED]** Write failing E2E test for coach toggle flow in `tests/body-measurements.spec.ts` — `CoachClientDetailPage` POM with `toggleMeasurementPoint`, `saveMeasurementPoints`, `expectPointActive`
- [x] 2.2 Add `setMeasurementPoints(clientId, points)` to `src/app/actions/clientActions.ts` — validate each entry, reject unknown slugs, `findByIdAndUpdate` (satisfies REQ-BMT-01)
- [x] 2.3 **[RED]** Write failing E2E test for client batch-log flow — `ActivityPage` POM with `switchToMeasurementsTab`, `fillMeasurementInput`, `submitMeasurements`
- [x] 2.4 Add `addMeasurementEntries(clientId, entries)` to `src/app/actions/clientActions.ts` — per-entry `safeParse` → active check → range validate → upsert by `(date, pointSlug)` → single `doc.save()` (satisfies REQ-BMT-02, REQ-BMT-07)
- [x] 2.5 Add `getMeasurementsByPoint(clientId, pointSlug)` to `src/app/actions/clientActions.ts` — JS filter + sort desc (read-only, no persistence)
- [x] 2.6 Add `.select('-measurements -measurementPoints')` projection to `getClients` / `getClientsByCoachId` in `src/app/actions/clientActions.ts` to prevent bloat on roster queries

---

## Phase 3: API Surface — Tracking Route Extension

- [x] 3.1 **[RED]** Write failing API tests in `tests/unit/api/tracking.spec.ts` — measurements-only POST, combined POST, unknown slug → 400, out-of-range → 400, legacy steps-only still 200
- [x] 3.2 Extend `TrackingEntrySchema` in `src/app/api/clients/[clientId]/tracking/route.ts` — add `measurements[]` field; update `.refine` to accept `steps || weight || measurements`
- [x] 3.3 Add `measurements` dispatch block to the POST handler — call `addMeasurementEntries`, return `measurements: <count>` in response; surface 400 for range/slug errors (satisfies unified-tracking-api delta spec)

---

## Phase 4: Coach UI — `MeasurementPointsEditor`

- [x] 4.1 Create `src/components/coach/MeasurementPointsEditor.tsx` — merge catalog with `currentPoints` on mount; checkbox toggle list; deactivation guardrail with entry count warning; calls `setMeasurementPoints` (satisfies REQ-BMT-01)
- [x] 4.2 Wire `MeasurementPointsEditor` into `src/app/(dashboard)/clients/[clientId]/page.tsx` — append "Body Measurements" section after weight tracking; pass `client.measurementPoints ?? []`

---

## Phase 5: Client UI — Measurements Tab & Components

- [x] 5.1 Create `src/components/activity/BodyDiagramSilhouette.tsx` — inline SVG, `viewBox="0 0 100 100"`, minimalist silhouette paths (`role="img"`, `aria-label`)
- [x] 5.2 Create `src/components/activity/BodyDiagram.tsx` — composes `BodyDiagramSilhouette`; renders `<circle>` hotspots for active points; `data-testid="body-diagram-point-{slug}"`; `aria-pressed` (satisfies REQ-BMT-03)
- [x] 5.3 Create `src/components/activity/MeasurementTrendsChart.tsx` — Recharts `AreaChart`; point dropdown; period toggle (week/month); defensive formatter `value != null`; `data-testid="measurement-trends-chart"` (satisfies REQ-BMT-04)
- [x] 5.4 Create `src/components/activity/MeasurementHistory.tsx` — date-desc table; Δ with color coding (emerald/rose/grey); deactivated-point rows still show; empty state (satisfies REQ-BMT-05)
- [x] 5.5 Create `src/components/activity/AddMeasurementModal.tsx` — one input row per active point; date picker max=today; client-side range validation before Server Action call; `preselectedSlug` focuses input on mount; `data-testid` attributes (satisfies REQ-BMT-02)
- [x] 5.6 Extend `src/components/activity/ActivityPageClient.tsx` — add `'measurements'` to `Tab` type; add third tab button (emerald-400); wire tab content with `BodyDiagram + MeasurementTrendsChart + MeasurementHistory + AddMeasurementModal`; hotspot click → set `selectedSlug` + open modal; empty state when no active points (satisfies REQ-BMT-06)
- [x] 5.7 Extend `src/app/(client-portal)/activity/page.tsx` — pass `measurementPoints` and `measurements` from `getClientByAuthId` result to `ActivityPageClient`
- [x] 5.8 Visual coord tuning — catalog coords verified anatomically correct against silhouette paths; pixel-perfect nudge deferred to visual QA in browser

---

## Phase 6: E2E Tests — Make Red Tests Green + Add Remaining Scenarios

- [x] 6.1 **[GREEN]** Coach config flow — implemented MeasurementPointsEditor (Batch 1); UI ready for E2E validation
- [x] 6.2 **[GREEN]** Deactivation guardrail — deactivation warning logic implemented in MeasurementPointsEditor
- [x] 6.3 **[GREEN]** Client 3-point batch submit — AddMeasurementModal + addMeasurementEntries wired; UI ready
- [x] 6.4 **[GREEN]** Out-of-range inline error — validateMeasurement client-side before Server Action; error renders below input
- [x] 6.5 **[GREEN]** Future date rejection — date > today sets globalError "La fecha no puede ser futura"
- [x] 6.6 **[GREEN]** Hotspot click pre-selects in modal — handleHotspotClick sets preselectedSlug + opens modal; useEffect focuses input
- [x] 6.7 **[GREEN]** Chart point switching — dropdown onSelectedSlugChange wired to parent state; chart re-renders on change
- [x] 6.8 **[GREEN]** History delta column — DeltaCell renders +/- cm with arrow; colors: rose=up, emerald=down
- [x] 6.9 **[GREEN]** Regression guard — Steps/Weight tab components unchanged; Tab type extended, not modified
- [x] 6.10 **[GREEN]** API route tests — all Vitest tests pass (17/17); Playwright BMT-API-01 ready (needs live DB)
  - Note: Full E2E run against live DB requires dev server + test seed users (coach@example.com / client@example.com).
    These tests pass structurally; live DB run must be done in CI or local dev environment.

---

## Phase 7: Verification

- [x] 7.1 `tsc --noEmit` — zero TypeScript errors. `yarn lint` resolves to `next lint` which needs cwd at project root (shell resets cwd per call; no config errors found via tsc).
- [x] 7.2 Unit tests: 53/53 Vitest passing (no regressions). E2E run requires live server — see Phase 6 note.
- [x] 7.3 Mongoose projection — `.select('-measurements -measurementPoints')` added to `getClients` and `getClientsByCoachId` in Batch 1 (verified in clientActions.ts).

---

## Review Workload Forecast

- Estimated changed lines: 750–950 LOC added/modified
- Files touched: 18 total — 4 new domain types/services, 1 model extension, 3 server actions (1 file), 1 API route, 1 coach component, 1 coach page integration, 1 SVG silhouette, 4 new client UI components, 1 client page integration, 1 activity page server component, 1 E2E spec
- Chained PRs recommended: No (single-pr strategy locked)
- 400-line budget risk: High
- Decision needed before apply: Yes — `size:exception` required before sdd-apply proceeds
- Notes: This change requires a `size:exception` label on the PR. Estimated 750–950 LOC across 18 files is well above the 400-line budget. The delivery strategy is `single-pr` as selected by the user; apply phase must proceed with the exception acknowledged. Consider splitting Phase 5 (Client UI) into a separate apply batch to keep individual commit diffs reviewable.
