# Exploration: measurement-input-redesign

**Change**: `measurement-input-redesign` | **Project**: fitmetrik-web | **Phase**: sdd-explore (read-only) | 2026-09-08

Two coupled concerns from the product owner:

1. **UX redesign** of the client measurement-entry modal (`AddMeasurementModal`) — currently a plain top-to-bottom linear form. Target: functional, modern, mobile-first, fast numeric entry.
2. **Validation change** — remove min/max limits on measurement values; support a measurement having *no value*, where `0` may mean "no value".

## Current State

### The modal — `src/components/activity/AddMeasurementModal.tsx`

- `'use client'`, ~230 lines, hand-rolled markup. **No shared `Modal`/`Dialog` primitive exists** in the repo — all 4 modals (`AddMeasurementModal`, `DailyStepsModal`, `DailyWeightModal`, `SavePlanModal`) are independently hand-rolled `fixed inset-0 bg-black/50` divs; none have focus trap, Escape-close, backdrop-click, scroll-lock, or portal.
- Opened by "+ Add Record" or a `BodyDiagram` hotspot tap (sets `preselectedSlug`). Rendered inline inside `ActivityPageClient` (Measurements tab), under `(client-portal)/layout.tsx` which applies the `.surface-client` token scope (no portal, so tokens cascade).
- Top-to-bottom inside `max-w-sm max-h-[90vh]` centered card: header → native `<input type="date">` (max today) → **one full-width `<input type="number" step="0.1">` per active point**, stacked, label `{label} (minCm–maxCm cm)`, placeholder = computed midpoint `ej. 115` → global error → Cancelar/Guardar footer.
- Submit: rejects future dates; iterates `activePoints`, **skips empty/whitespace inputs**, `parseFloat`+`isNaN`, then `validateMeasurement(point,num)` range check; any field error aborts the whole batch; zero entries → "Ingresá al menos un valor"; else `addMeasurementEntries(clientId,entries)` then 1.2s success + close.

### Value-limit enforcement — every site

1. `src/domain/types/BodyMeasurement.ts` — `valueCm: z.number().positive().max(300)` (**the value schema**; `.positive()` blocks 0+negatives). `.refine` blocks future dates.
2. `src/domain/types/MeasurementPoint.ts` — `minCm/maxCm: z.number().positive()`, `.refine(maxCm>minCm)` (per-point config bounds).
3. `src/domain/services/bodyMeasurements.ts` `validateMeasurement(point,valueCm)` — `< minCm` / `> maxCm` → `{ok:false}`. Called BOTH client-side (modal) and server-side (`addMeasurementEntries`).
4. `bodyMeasurements.ts` `MEASUREMENT_POINTS_CATALOG` — hardcoded ranges (trunk `cintura`/`pecho` 30–200, limbs 10–100).
5. `src/app/actions/clientActions.ts` `addMeasurementEntries` — `BodyMeasurementSchema.safeParse` + `validateMeasurement` + point-exists + point-active.
6. `clientActions.ts` `setMeasurementPoints` — `MeasurementPointSchema.safeParse`.
7. `src/lib/models/Client.ts` `BodyMeasurementSubSchema` — `valueCm: { type:Number, required:true, min:0.1, max:300 }` (**Mongoose clamp**). `MeasurementPointSubSchema` requires `minCm`/`maxCm`.
8. `src/app/api/clients/[clientId]/tracking/route.ts` `MeasurementEntrySchema` — `valueCm: z.number().positive().max(300)` (duplicate of #1).
9. `AddMeasurementModal.tsx` — `<input min={point.minCm} max={point.maxCm}>` + label hint + midpoint placeholder + `validateMeasurement`.
10. Tests/spec — `tests/unit/domain/services/bodyMeasurements.spec.ts` range cases; `openspec/specs/body-measurements-tracking/spec.md` REQ-BMT-02 / REQ-BMT-07 codify ranges (need MODIFIED/REMOVED deltas).

A value of `0` / out-of-range / empty is currently rejected in up to 6 code sites (1,3,5,7,8,9) + the spec.

### "Missing" value semantics today

- **No stored representation of "no value".** `valueCm` is a required positive number everywhere. Blank points are simply omitted — nothing persisted.
- `0` means nothing — rejected by `.positive()` (Zod) and `min:0.1` (Mongoose).
- Duplicate `(date,pointSlug)` is an **upsert** (replaces).

### What breaks with `0` or absent

- Absent (current) = safe everywhere: `MeasurementTrendsChart` builds a fixed day-grid, `entry?.valueCm ?? null`, `connectNulls={false}`, null-safe formatter → gap. `MeasurementHistory` row absent. `getDeltaForLast`/`groupByPoint` ignore.
- Stored `0` = **breaks viz**: chart plots a real point at 0, `YAxis domain={['dataMin - 2','dataMax + 2']}` collapses; `MeasurementHistory` delta `entry.valueCm - prev.valueCm` swings wildly (`-85.0 ▼`); `MeasurementPointsEditor.countEntriesForPoint` miscounts 0-rows as real data → spurious deactivation warning.
- **Biggest design decision**: persist `0`/null and patch 5 consumers, vs. treat `0`/empty as "not persisted" (current behavior, zero risk).

### Design system (`src/components/ui/` + `globals.css`)

- Primitives: `Alert`, `Badge`, `Button` (`variant accent|surface|ghost`, `size sm|md`), `Card`, `Input` (thin `<input>` + `neu-inset`), `StatusPill`, `Table`. **No Modal/Dialog/BottomSheet.**
- Tokens (`@theme` + scoped `:root`): `primary #2dd4bf`, `surface-*`, `on-surface`, `on-surface-muted`, `error`, `success`, `measurement-accent{,-light,-dark,-dim}`, fonts Manrope/Inter. `.surface-client` scope: `--radius-card 16px`, `--radius-control 12px`, `--space-card-p 1.5rem`, `--transition-standard 280ms`. Classes `.neu-card/.neu-inset/.neu-btn/.neu-btn-accent`.
- Conventions: Tailwind v4 (no `var()`/hex in className), React 19 + compiler (no useMemo/useCallback), Material Symbols font, Spanish OK for client copy.

### Concrete mobile UX weaknesses

1. Vertical scroll of a tiny box (≤8 stacked inputs in `max-w-sm max-h-[90vh]`); Guardar hides behind keyboard.
2. Wrong keyboard — no `inputMode="decimal"`, no `enterKeyHint`, no auto-advance.
3. No entry aids — no +/- steppers, no "same as last", no previous value/delta shown while typing.
4. All-or-nothing batch; errors only after Guardar.
5. Range clutter `(30–200 cm)` + `min`/`max` attrs + `validateMeasurement` = exactly the blockers to remove.
6. Misleading midpoint placeholder `ej. 115`.
7. Not design-system-consistent; no focus trap/Escape/backdrop/scroll-lock; fixed (not `dvh`) height.
8. No progress ("3 of 8"), no grouping (trunk/legs/arms), no quick-jump.
9. Preselected point not visually prioritized among 8 equal rows.

### Prior SDD work (Engram)

- **`body-measurements-tracking`** (#12): entire feature applied + on `main`, **never archived**; `verify-report` verdict **FAIL**, 3 CRITICAL: (1) Playwright E2E 0/5 (missing seeded coach@/client@ fixtures — infra); (2) **cross-action atomicity defect** in `tracking/route.ts` (steps persist before measurements validate, no Mongoose txn); (3) zero un-mocked coverage of the 3 measurement server actions. Overlaps the same files this change touches.
- **`coach-measurement-config`** (#11): coach-config already covered; explicitly listed "DB-configurable validation ranges per point" as OUT of scope (v1 hardcoded).

## Affected Areas

- `src/components/activity/AddMeasurementModal.tsx` — primary redesign; drop min/max attrs, range hint, midpoint placeholder; allow empty + `0`.
- `src/domain/types/BodyMeasurement.ts` — relax `valueCm` (remove `.positive().max(300)` → `z.number().min(0)`; or nullable).
- `src/domain/services/bodyMeasurements.ts` — `validateMeasurement` → NaN/negative only; delta helpers skip `0`/null; catalog `minCm`/`maxCm` advisory.
- `src/app/actions/clientActions.ts` — `addMeasurementEntries` drop range check; decide persist-vs-filter for `0`/empty.
- `src/lib/models/Client.ts` — `BodyMeasurementSubSchema.valueCm` `min:0.1,max:300` → `min:0`; maybe point `minCm`/`maxCm` optional.
- `src/app/api/clients/[clientId]/tracking/route.ts` — `MeasurementEntrySchema.valueCm` mirror.
- `src/components/activity/MeasurementTrendsChart.tsx` — treat `0`/null as no-data (currently only null).
- `src/components/activity/MeasurementHistory.tsx` — delta/row when value `0`/absent.
- `src/components/coach/MeasurementPointsEditor.tsx` — READ-ONLY reference (countEntriesForPoint miscount risk); NOT a redesign target.
- `src/components/activity/ActivityPageClient.tsx` — modal wiring/props.
- `src/components/ui/` — optional new shared `Modal`/`BottomSheet` primitive.
- `openspec/specs/body-measurements-tracking/spec.md` — REQ-BMT-02/04/07 MODIFIED/REMOVED deltas.
- `tests/unit/domain/services/bodyMeasurements.spec.ts`, `tests/unit/api/tracking.spec.ts`, `tests/body-measurements.spec.ts` — update.

## Approaches

### Concern 1 — Modal UX

1. **Single-screen grouped numeric grid** (recommended) — one large numeric tile per point, grouped Tronco/Piernas/Brazos, big value + `cm` + optional +/- steppers, `inputMode="decimal"`, `enterKeyHint="next"`, auto-advance, per-tile "última: 85 cm (Δ -1.2)", sticky footer, partial save. Bottom-sheet on mobile / centered dialog on desktop via a **new shared `Modal` primitive**. Effort Medium.
2. **Guided one-metric-at-a-time** — full-width single input per step, numpad target, previous+delta shown, "Omitir" first-class, progress dots. Best ergonomics; slower for full set; more state. Effort Medium-High.
3. **Collapsible sheet with per-metric expand** — list + mini-sparkline, tap to expand large input. Good discoverability; extra tap per metric. Effort Medium-High.

### Concern 2 — Validation / "no value"

A. **Absent = not persisted; `0`/empty treated identically (not saved)** (recommended) — remove `.positive()/.max()` + range checks (keep NaN/negative reject via `z.number().min(0)`), extend modal "skip empty" to also skip `0`. No new stored state, no viz changes. Effort Low.
B. **Persist `valueCm: number | null`, `0` a real value** — nullable everywhere + patch 5 consumers. Literal request; 6 schema + 5 consumer sites; higher regression risk. Effort Medium-High.
C. **Remove only range checks, keep `>0` required** — tiny change but does NOT satisfy "puede ser 0". Effort Low, incomplete.

## Recommendation

- **Concern 1**: Approach 1 (single-screen grouped grid) on a new `.surface-client`-scoped shared `Modal`/bottom-sheet primitive in `src/components/ui/`. Keep props compatible with `ActivityPageClient` (`open/onClose/clientId/activePoints/preselectedSlug/onSuccess`). Defer guided mode. Do NOT touch the other 3 modals (scope creep) but design the primitive for later adoption.
- **Concern 2**: Approach A — `valueCm` → `z.number().min(0)` across the 6 sites (domain type, service, action, Mongoose `min:0`, tracking API, UI), delete range enforcement + modal `min`/`max` attrs + range-hint label, extend "skip empty" so `0`/blank aren't persisted. Keep `MeasurementPoint.minCm/maxCm` fields (no migration) — just stop enforcing; flag full removal as follow-up.
- **Scope boundary**: coach `MeasurementPointsEditor` OUT of scope; only coupled via now-unused `minCm`/`maxCm` and `countEntriesForPoint` (unaffected under Approach A).
- **Testing**: Vitest domain — invert `validateMeasurement` range tests, add `BodyMeasurementSchema` parse tests (0 ok, large ok, negative reject, future-date reject — none exist today), delta tests for `0`/absent. Vitest API — update `tracking.spec.ts`. Modal — no component-test infra exists; recommend adding React Testing Library + jsdom for `AddMeasurementModal` (new capability) + update Playwright POM `fillMeasurementInput`. Playwright suite currently 0/5 (fixtures) — not a sole gate.
- **Delivery**: ~300–500 authored LOC across ~10 files + tests → **two chained PRs**: (1) validation relaxation + spec deltas + domain/API tests; (2) modal redesign + `Modal` primitive + component tests.

## Risks

- `0`-as-sentinel pollutes every viz (chart plot, history delta, `countEntriesForPoint`). Approach A avoids; B must patch all 5.
- Six independent `valueCm` enforcement sites — missing one (esp. Mongoose `min:0.1` or the tracking-API duplicate) leaves inconsistent behavior.
- `body-measurements-tracking` un-archived with FAIL verify-report touching the same files (atomicity defect, E2E fixtures, un-mocked coverage) — coordinate: fold in or leave to that change.
- No shared Modal primitive — hand-roll a 4th bespoke modal (debt) or introduce a primitive (wider blast radius, net positive).
- Mobile keyboard overlap — needs `dvh` / `visualViewport`.
- `.surface-client` scope lost if redesign portals to `<body>` without re-applying the class.
- Spec: REQ-BMT-02/07 codify ranges as SHALL; `coach-measurement-config` listed configurable ranges as future scope — confirm owner wants ranges GONE not CONFIGURABLE.
- Review-budget risk: Medium → chained PRs.

## Ready for Proposal

**Yes, pending product decisions** (see orchestrator prompt):

1. Blank / `0` handling — save nothing (Approach A) vs. persist an explicit "no value" record (Approach B).
2. Ranges removed entirely vs. made configurable per point.
3. Whether to opportunistically fix `body-measurements-tracking` blockers in this change.
4. Whether a shared `Modal` primitive is acceptable scope.
