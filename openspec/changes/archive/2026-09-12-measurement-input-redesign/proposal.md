# Proposal: Measurement Input Redesign

## Intent

The client measurement modal is a hand-rolled stack of up to 8 identical number inputs in a `max-w-sm` box: wrong mobile keyboard, no auto-advance, no reference value, footer hidden behind the keyboard, and one bad field aborts the whole batch. Separately, hardcoded ranges (30–200 / 10–100 cm) plus `.positive()` reject legitimate bodies and make "no value" unexpressible. Success: a client logs a full set on a phone in one screen, any non-negative value is accepted, and blank or `0` silently means no-data.

## Scope

### In Scope

- Redesign `AddMeasurementModal` as a single-screen grouped numeric grid (Tronco / Piernas / Brazos): large tiles with `cm` unit, optional +/- steppers, `inputMode="decimal"`, `enterKeyHint="next"`, auto-advance, per-tile "última: 85 cm (Δ -1.2)", sticky footer, partial save. Props unchanged (`open/onClose/clientId/activePoints/preselectedSlug/onSuccess`).
- New shared `src/components/ui/Modal`: bottom-sheet on mobile / centered dialog on desktop, focus trap, Escape, backdrop close, scroll-lock, `dvh` sizing, `.surface-client` scope re-applied if portaled. `AddMeasurementModal` is the first adopter.
- Remove range enforcement at all 6 `valueCm` sites; relax to `z.number().min(0)`; blank and `0` are never persisted.
- Fix cross-action atomicity in `tracking/route.ts` (measurements validated before steps/weight persist, or one transaction).
- Spec deltas + Vitest domain/API test updates.

### Out of Scope

- Migrating `DailyStepsModal`, `DailyWeightModal`, `SavePlanModal` to the primitive.
- Coach `MeasurementPointsEditor` / any coach-side UI.
- Deleting `minCm`/`maxCm` from `MeasurementPoint` (kept, unenforced, no migration) or making ranges configurable.
- Remaining `body-measurements-tracking` blockers: Playwright E2E fixtures, un-mocked server-action coverage.
- Persisting `0`/null as an explicit no-value record, and any viz-consumer patches.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `body-measurements-tracking`: REQ-BMT-02 — drop the per-point range rule, allow partial save instead of all-or-none, treat blank/`0` as skipped; REQ-BMT-04 — no-data renders as a gap, never as `0`; REQ-BMT-07 — REMOVED (validation reduces to finite, non-negative).
- `unified-tracking-api`: REQ-UTA-04 — extend the atomic dispatch guarantee to `measurements[]`.
- `ui-design-system`: add a shared modal/overlay primitive requirement (responsive shape, a11y behaviors, surface-scope preservation).

## Approach

1. **Validation first** — relax the schema chain, delete range branches, then adjust the modal so nothing enforces a bound the UI still advertises.
2. **No-data by omission** — the modal filters blank *and* `0` before building entries; storage shape is untouched, so charts, history deltas, and `countEntriesForPoint` need zero patches.
3. **Primitive, then adopter** — build `ui/Modal` standalone, port `AddMeasurementModal` onto it, then rebuild its body as the grouped grid.
4. **Atomicity** — reorder/transact the tracking route so a measurement validation failure cannot leave orphaned step data.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/ui/Modal.tsx` | New | Shared responsive dialog/bottom-sheet primitive |
| `src/components/activity/AddMeasurementModal.tsx` | Modified | Grid redesign; site 6 — drop `min`/`max` attrs, `(30–200 cm)` hint, midpoint placeholder; skip `0` |
| `src/domain/types/BodyMeasurement.ts` | Modified | Site 1 — `z.number().positive().max(300)` → `z.number().min(0)` |
| `src/domain/services/bodyMeasurements.ts` | Modified | Site 2 — `validateMeasurement` drops range branches; catalog bounds become advisory |
| `src/app/actions/clientActions.ts` | Modified | Site 3 — `addMeasurementEntries` drops the range check |
| `src/lib/models/Client.ts` | Modified | Site 4 — `valueCm` `min:0.1,max:300` → `min:0` |
| `src/app/api/clients/[clientId]/tracking/route.ts` | Modified | Site 5 — mirror schema; atomicity fix |
| `src/components/activity/ActivityPageClient.tsx` | Modified | Modal wiring only (props stable) |
| `openspec/specs/{body-measurements-tracking,unified-tracking-api,ui-design-system}` | Modified | Delta specs |
| `tests/unit/**`, `tests/body-measurements.spec.ts` | Modified | Invert range cases; add `0`/blank/large-value cases; POM helper |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| One of the 6 enforcement sites missed (esp. Mongoose `min:0.1` or the tracking-API duplicate) | Med | Enumerate all 6 as explicit tasks; add a Vitest case per boundary |
| Delivery exceeds the 400-line review budget (~300–500 LOC + atomicity fix, `single-pr` selected) | High | `sdd-tasks` must forecast and, if high, propose slices: (1) validation + specs + tests, (2) `Modal` primitive, (3) grid redesign |
| `.surface-client` tokens lost if the primitive portals to `<body>` | Med | Re-apply the scope class on the portal root; visual check in both scopes |
| Partial save conflicts with REQ-BMT-02's "all or none" wording | Med | Ship the REQ-BMT-02 delta in the same change; keep server-side batch semantics explicit |
| Spec deltas collide with un-archived `body-measurements-tracking` (same capability, FAIL verify-report) | Med | Only REQ-BMT-02/04/07 and REQ-UTA-04 are touched; leave its other blockers untouched |
| Mobile keyboard still covers the sticky footer | Low | `dvh` sizing plus `visualViewport` offset on the footer |

## Delivery

`single-pr` is the cached strategy, but exploration estimates ~300–500 authored LOC across ~10 files plus the atomicity fix — **400-line budget risk: High**. `sdd-tasks` must re-check and recommend chained slices if the forecast holds.

## Rollback Plan

Revert the single PR (or the slices in reverse order). No schema migration and no data shape change, so persisted measurements stay valid under the old stricter schema unless a client saved an out-of-old-range value; those rows read fine and only re-fail on edit. `ui/Modal` is additive — deleting it only requires restoring the previous modal markup.

## Dependencies

- `body-measurements-tracking` remains un-archived and touches the same files; coordinate merge order.
- No new packages: focus trap, scroll-lock, and stepper behavior are hand-rolled on existing primitives.

## Success Criteria

- [ ] A client enters values for all active points on one mobile screen without scrolling past the sticky footer, with a decimal keypad and auto-advance.
- [ ] Any finite non-negative value persists; negatives and NaN are rejected at every boundary.
- [ ] Blank and `0` persist nothing and render as gaps in chart, history, and point counts.
- [ ] A single invalid field no longer discards the other valid entries.
- [ ] `POST /tracking` with valid steps and an invalid measurement persists neither.
- [ ] `AddMeasurementModal` renders through `ui/Modal` with focus trap, Escape, backdrop close, and scroll-lock, keeping `.surface-client` tokens.
- [ ] `yarn lint` and the Vitest domain/API suites pass.
