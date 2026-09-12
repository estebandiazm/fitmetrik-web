# Apply Progress: Measurement Input Redesign

**Mode**: Strict TDD
**Delivery**: single-pr, `exception-ok` (owner accepts `size:exception`)
**Batches**: Phase 1 (1.1–1.17) DONE · Phase 2 (2.1–2.8) DONE · Phase 3 (3.1–3.10) DONE — **35/35 tasks complete**

## Per-Task Status

### Phase 1 — Validation Relaxation + Pure Domain Helpers (17/17 ✅)

| Task | Status | Evidence |
|------|--------|----------|
| 1.1 [RED] `BodyMeasurement.spec.ts` valueCm boundary | ✅ done | New file; RED observed (2 failures: `0`, `450`) then GREEN |
| 1.2 [GREEN] Site 1 `BodyMeasurement.ts` → `z.number().min(0)` | ✅ done | 9/9 in `BodyMeasurement.spec.ts` |
| 1.3 [RED] invert `validateMeasurement` range cases | ✅ done | RED observed (4 failures) |
| 1.4 [GREEN] Site 2 `validateMeasurement` NaN/negative-only + catalog comment retitle | ✅ done | 19/19 in `bodyMeasurements.spec.ts` |
| 1.5 [RED] `toPersistableEntries` drops `0`, keeps positives | ✅ done | RED observed |
| 1.6 [GREEN] add `toPersistableEntries` | ✅ done | 3 cases pass |
| 1.7 [RED] `buildMeasurementEntries` fork logic | ✅ done | RED observed |
| 1.8 [GREEN] add `buildMeasurementEntries` | ✅ done | 4 cases pass |
| 1.9 [RED] `validateMeasurementEntries` | ✅ done | RED observed |
| 1.10 [GREEN] add `validateMeasurementEntries` | ✅ done | 4 cases pass |
| 1.11 [RED] `groupPoints` + drift guard | ✅ done | RED observed |
| 1.12 [GREEN] add `MEASUREMENT_GROUPS` + `groupPoints` | ✅ done | 3 cases pass; every catalog slug mapped |
| 1.13 [GREEN] Site 3 `clientActions.addMeasurementEntries` | ✅ done | Covered by 1.5/1.7; suite green; tsc clean |
| 1.14 [GREEN] Site 4 `Client.ts` `valueCm` → `{ min: 0 }` | ✅ done | Structural (Mongoose sub-schema) |
| 1.15 [GREEN] Site 5 `tracking/route.ts` schema → `z.number().min(0)` | ✅ done | RED (`450` → 400) then GREEN; 22/22 |
| 1.16 [GREEN] Site 6 `AddMeasurementModal.tsx` interim | ✅ done | Structural; lint + tsc clean |
| 1.17 confirm change-dir spec deltas | ✅ done | No drift. Main `openspec/specs/` deferred to `sdd-archive` |

### Phase 2 — `ui/Modal` Primitive (8/8 ✅)

| Task | Status | Evidence |
|------|--------|----------|
| 2.1 Create `src/components/ui/Modal.tsx` — props + `SURFACE_SCOPE`/`SurfaceScope`; SSR-safe portal | ✅ done | File created; `createPortal` gated by `useSyncExternalStore` mount flag; tsc clean |
| 2.2 Responsive sheet/dialog shell | ✅ done | overlay `items-end sm:items-center`; panel `neu-card` + `max-h-[85dvh] sm:max-h-[90dvh] max-sm:rounded-b-none` + `sm:max-w-{sm,md,lg}`; `aria-labelledby` wired; scroll body + sticky footer |
| 2.3 Hand-rolled focus trap | ✅ done | activeElement capture on open, focus `initialFocusRef`→first focusable→panel, `Tab`/`Shift+Tab` wrap on panel `onKeyDown`, restore on effect cleanup |
| 2.4 Module-level scroll-lock counter | ✅ done | `createScrollLock`/`bodyScrollLock` in `modal-helpers.ts`; RED→GREEN, 5 unit cases (first-lock, nested, no-op unlock, restore previous value, null target) |
| 2.5 Escape + backdrop close | ✅ done | panel `onKeyDown` Escape + overlay `onClick` with panel `stopPropagation`; gated by `closeOnEscape`/`closeOnBackdrop` default `true`; no global listener |
| 2.6 Surface-scope sentinel | ✅ done | `<span ref={anchorRef} hidden />` rendered in place (not in portal); `detectSurfaceScope` via `closest('.surface-client, .surface-coach')`; `resolveSurfaceScope` (explicit prop wins) — 3 unit cases; class copied onto overlay root |
| 2.7 `visualViewport` keyboard inset | ✅ done | `computeKeyboardInset(innerHeight, vv.height, vv.offsetTop)` clamped ≥0 — 4 unit cases; `resize`/`scroll` subscription → `paddingBottom` on overlay; no-op when `visualViewport` absent |
| 2.8 [RED] Playwright `ui-design-system` scenarios | ✅ done | 7 `test.fixme` cases added to `tests/body-measurements.spec.ts` (pending on BMT E2E fixtures; documented follow-up, not a merge gate) |

### Phase 3 — Grid Redesign + Atomicity (10/10 ✅)

| Task | Status | Evidence |
|------|--------|----------|
| 3.1 [RED] `tracking.spec.ts` valid steps + invalid measurement → 400, nothing persists | ✅ done | RED observed (2 failures: status 200 + addDailyStep called); mock `validateMeasurementBatch` added |
| 3.2 [GREEN] `validateMeasurementBatch(clientId, entries)` read-only action | ✅ done | Loads client via `ClientModel.findById`, runs `validateMeasurementEntries(points, entries)`, writes nothing; missing client → `{ ok: true }` (404 stays a downstream persist concern) |
| 3.3 [GREEN] `tracking/route.ts` validate-all-then-persist-all | ✅ done | New block calls `validateMeasurementBatch` BEFORE the `entry.steps` block; 400 on `!ok`. 24/24 in `tracking.spec.ts` |
| 3.4 [GREEN] Rebuild `AddMeasurementModal` on `ui/Modal` — grouped tile grid | ✅ done | `<Modal open onClose title footer testId>`; `groupPoints(activePoints)` → group heading + `grid-cols-2 sm:grid-cols-3` tiles; `−`/`+` steppers via `stepMeasurementValue`; footer counter (`N medidas listas` from `buildMeasurementEntries`) |
| 3.5 [GREEN] Tile text input + sanitize + Enter auto-advance | ✅ done | `type="text" inputMode="decimal" enterKeyHint`; `sanitizeDecimalInput` on change; last tile `enterKeyHint="done"`; `Enter` walks an ordered ref list (`orderedSlugs` = grouped flat order) |
| 3.6 [GREEN] Submit via `buildMeasurementEntries`; atomic batch; stay-open-if-flagged; `0` hint | ✅ done | `{ entries, fieldErrors }` from pure fn; one `addMeasurementEntries(clientId, entries)` call; flagged tiles keep text+error and modal stays open (saved tiles clear + show check); else `onClose()`; `no se guarda` muted hint when value parses to `0` |
| 3.7 [GREEN] `preselectedSlug` ring + focus + scrollIntoView | ✅ done | `ring-2 ring-primary` on the tile; effect focuses + `scrollIntoView({ block: 'center' })` on open; anatomical order preserved (groups never reordered) |
| 3.8 [GREEN] optional `measurements?: BodyMeasurement[]` prop + reference line | ✅ done | New `formatMeasurementReference(measurements, slug)` pure fn → `última: 83.8 cm (Δ -1.2)`; rendered per tile when no error/zero-hint |
| 3.9 [GREEN] `ActivityPageClient` passes `measurements` | ✅ done | One line added; `measurements` already destructured in props |
| 3.10 [GREEN] POM `fillMeasurementInput` updated | ✅ done | `click()` + `fill()` for the `type="text"` tile field (same test id); added `stepMeasurementInput` helper for the `−`/`+` buttons |

New pure helpers (Strict TDD RED→GREEN, `bodyMeasurements.spec.ts`):
- `sanitizeDecimalInput(raw)` — digits + one separator, `,`→`.`, folds extra dots
- `stepMeasurementValue(current, delta)` — ±0.5 stepper, clamped at 0, comma-aware, non-finite → 0
- `formatMeasurementReference(measurements, slug)` — `última: N cm (Δ ±d)` or `null`

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1/1.2 | `tests/unit/domain/types/BodyMeasurement.spec.ts` | Unit | N/A (new) | ✅ 2 failures | ✅ 9/9 | ✅ 7 boundary + 2 date | ➖ |
| 1.3/1.4 | `tests/unit/domain/services/bodyMeasurements.spec.ts` | Unit | ✅ 16/16 | ✅ 4 failures | ✅ 19/19 | ✅ 7 cases | ✅ comment retitle |
| 1.5/1.6 | `bodyMeasurements.spec.ts` | Unit | ✅ 19/19 | ✅ fail | ✅ pass | ✅ 3 cases | ➖ |
| 1.7/1.8 | `bodyMeasurements.spec.ts` | Unit | ✅ | ✅ fail | ✅ pass | ✅ 4 cases | ➖ |
| 1.9/1.10 | `bodyMeasurements.spec.ts` | Unit | ✅ | ✅ fail | ✅ pass | ✅ 4 cases | ➖ |
| 1.11/1.12 | `bodyMeasurements.spec.ts` | Unit | ✅ | ✅ fail | ✅ pass | ✅ 3 cases | ➖ |
| 1.15 | `tests/unit/api/tracking.spec.ts` | Unit (route) | ✅ 20/20 | ✅ 1 failure | ✅ 22/22 | ✅ +neg guard | ➖ |
| 1.13/1.14/1.16 | — | Structural | see notes | ➖ covered by pure helpers / no unit layer | ✅ 97/97 | ➖ | ➖ |
| 2.4/2.6/2.7 (helpers) | `tests/unit/components/ui/modal-helpers.spec.ts` | Unit | N/A (new) | ✅ import fails (module absent) | ✅ 11/11 | ✅ `computeKeyboardInset` 4 / `resolveSurfaceScope` 3 / `createScrollLock` 5 | ➖ pure from the start |
| 2.1/2.2/2.3/2.5 (component DOM) | — | Structural | N/A (new) | ➖ no jsdom/RTL harness this change (design D-testing) | ✅ `yarn lint` clean + `npx tsc --noEmit` exit 0 | ➖ | ➖ |
| 2.8 | `tests/body-measurements.spec.ts` | E2E | N/A | ✅ `test.fixme` (pending fixtures) | ➖ blocked on BMT E2E fixtures | ➖ | ➖ |
| 3.1/3.2/3.3 | `tests/unit/api/tracking.spec.ts` | Unit (route) | ✅ 22/22 | ✅ 2 failures | ✅ 24/24 | ✅ +valid-combined-batch guard | ➖ |
| helpers 3.4/3.5/3.8 | `tests/unit/domain/services/bodyMeasurements.spec.ts` | Unit | ✅ 33/33 | ✅ 14 failures (fns absent) | ✅ 47/47 | ✅ sanitize 5 / step 5 / reference 4 | ➖ pure from the start |
| 3.4–3.9 (component wiring) | — | Structural | N/A | ➖ no jsdom/RTL harness (design D-testing) | ✅ `yarn lint` clean + `npx tsc --noEmit` exit 0 + POM update | ➖ | ➖ |
| 3.10 | `tests/body-measurements.spec.ts` | E2E POM | N/A | ➖ POM helper only (suite `test.fixme` on fixtures) | ✅ lint + tsc clean | ➖ | ➖ |

## Test Summary
- Total unit tests: **124 passing** (8 files), up from 108 after Phase 2 (+16: sanitize 5, step 5, reference 4, tracking route 2)
- New in Phase 2: `tests/unit/components/ui/modal-helpers.spec.ts` (11)
- Pure functions created in Phase 2: `computeKeyboardInset`, `resolveSurfaceScope`, `createScrollLock` (+ `bodyScrollLock` singleton)
- Pure functions created in Phase 3: `sanitizeDecimalInput`, `stepMeasurementValue`, `formatMeasurementReference` (+ async read-only `validateMeasurementBatch`)
- `yarn lint` clean · `npx tsc --noEmit` exit 0

## Work Unit Evidence (Phase 3)
- Focused commands: `yarn test:unit tests/unit/api/tracking.spec.ts` → 24/24; `yarn test:unit tests/unit/domain/services/bodyMeasurements.spec.ts` → 47/47; full `yarn test:unit` → **124/124**, exit 0
- Runtime harness: N/A for unit layer — the `tracking` route is exercised via the existing Vitest handler-in-isolation harness (mocked actions); modal DOM behaviour has no unit harness (design D-testing). Manual `yarn dev` mobile-viewport batch log recommended in `sdd-verify`.
- `yarn lint` → clean, exit 0 · `npx tsc --noEmit` → exit 0
- Rollback boundary: revert `AddMeasurementModal.tsx` to the Phase 1 interim markup + revert the `validateMeasurementBatch` block in `route.ts` and its action + the 3 pure helpers + the ordering; `ui/Modal` stays, storage shape unchanged.

## Work Unit Evidence (Phase 2)
- Focused command: `yarn test:unit tests/unit/components/ui/modal-helpers.spec.ts` → 11/11 pass; full `yarn test:unit` → 108/108, exit 0
- Runtime harness: N/A for unit layer — component DOM behaviour (focus trap, Escape, scroll-lock, portal) has no unit harness (Vitest node env, no jsdom/RTL, per design). Gated by `yarn lint` + `npx tsc --noEmit` + the 7 `test.fixme` Playwright cases pending BMT E2E fixtures.
- `yarn lint` → clean, exit 0
- `npx tsc --noEmit` → exit 0
- Rollback boundary: delete `src/components/ui/Modal.tsx`, `src/components/ui/modal-helpers.ts`, `tests/unit/components/ui/modal-helpers.spec.ts`; revert the `test.fixme` block in `tests/body-measurements.spec.ts`; no adopters yet (Phase 3 wires `AddMeasurementModal`).

## Files Changed

### Phase 1
| File | Action | What |
|------|--------|------|
| `src/domain/types/BodyMeasurement.ts` | Modified | Site 1: `valueCm` → `z.number().min(0)` |
| `src/domain/services/bodyMeasurements.ts` | Modified | Site 2 `validateMeasurement`; new `MEASUREMENT_GROUPS`, `groupPoints`, `toPersistableEntries`, `buildMeasurementEntries`, `validateMeasurementEntries`; export `ValidationResult`; catalog comment retitled |
| `src/app/actions/clientActions.ts` | Modified | Site 3: `toPersistableEntries()` pre-filter; non-range `validateMeasurement` (defence in depth) |
| `src/lib/models/Client.ts` | Modified | Site 4: `valueCm` → `{ min: 0 }` |
| `src/app/api/clients/[clientId]/tracking/route.ts` | Modified | Site 5: `MeasurementEntrySchema.valueCm` → `z.number().min(0)` |
| `src/components/activity/AddMeasurementModal.tsx` | Modified | Site 6 interim: removed `min`/`max`/hint/midpoint placeholder; `inputMode="decimal"`, placeholder `—` |
| `tests/unit/domain/types/BodyMeasurement.spec.ts` | Created | valueCm boundary + date refine |
| `tests/unit/domain/services/bodyMeasurements.spec.ts` | Modified | Inverted `validateMeasurement` cases; +helper suites |
| `tests/unit/api/tracking.spec.ts` | Modified | +2 schema-boundary cases |

### Phase 2
| File | Action | What |
|------|--------|------|
| `src/components/ui/Modal.tsx` | Created | Responsive sheet/dialog primitive (D1): flat props, `SURFACE_SCOPE`/`SurfaceScope` exports, SSR-safe portal, focus trap, Escape/backdrop, scroll lock, surface-scope sentinel, `visualViewport` inset, `role="dialog"`/`aria-modal`/`aria-labelledby` |
| `src/components/ui/modal-helpers.ts` | Created | Pure helpers: `computeKeyboardInset`, `resolveSurfaceScope`, `createScrollLock`, `bodyScrollLock` singleton |
| `tests/unit/components/ui/modal-helpers.spec.ts` | Created | 11 unit cases for the pure helpers (TDD RED→GREEN) |
| `tests/body-measurements.spec.ts` | Modified | +7 `test.fixme` Playwright cases for the `ui-design-system` modal-primitive scenarios |
| `openspec/changes/measurement-input-redesign/tasks.md` | Modified | Phase 2 tasks 2.1–2.8 checked off |

### Phase 3
| File | Action | What |
|------|--------|------|
| `src/domain/services/bodyMeasurements.ts` | Modified | +`sanitizeDecimalInput`, `stepMeasurementValue`, `formatMeasurementReference` (pure) |
| `src/app/actions/clientActions.ts` | Modified | +read-only `validateMeasurementBatch(clientId, entries)`; import `validateMeasurementEntries` + `ValidationResult` |
| `src/app/api/clients/[clientId]/tracking/route.ts` | Modified | Validate-all-then-persist-all: `validateMeasurementBatch` call before the `entry.steps` block, 400 on failure |
| `src/components/activity/AddMeasurementModal.tsx` | Modified | Full rebuild on `ui/Modal`: grouped tile grid, `type="text"` sanitized inputs, `−`/`+` steppers, Enter auto-advance, `preselectedSlug` ring/scroll, `measurements` prop + reference line, partial-save fork, footer counter |
| `src/components/activity/ActivityPageClient.tsx` | Modified | Pass `measurements` to `<AddMeasurementModal>` (1 line) |
| `tests/unit/api/tracking.spec.ts` | Modified | Mock `validateMeasurementBatch`; +2 REQ-UTA-04 atomicity cases |
| `tests/unit/domain/services/bodyMeasurements.spec.ts` | Modified | +14 cases for the 3 new pure helpers |
| `tests/body-measurements.spec.ts` | Modified | POM `fillMeasurementInput` updated for the text tile; +`stepMeasurementInput` |
| `openspec/changes/measurement-input-redesign/tasks.md` | Modified | Phase 3 tasks 3.1–3.10 checked off |

## Deviations

### Phase 1 (unchanged)
- Main `openspec/specs/*` NOT modified — delta application is `sdd-archive`'s job.
- `AddMeasurementModal.tsx` kept `type="number"` interim (`type="text"` conversion is the Phase 3 rebuild).
- `toPersistableEntries` filters `valueCm > 0` (drops negatives too); negatives still surfaced as validation errors upstream.

### Phase 2
- **Panel radius**: design D1 / task 2.2 specify `rounded-t-[var(--radius-card)]` / `sm:rounded-[var(--radius-card)]`. Not used — the `tailwind-4` skill forbids `var()` in `className`, and the orchestrator explicitly instructed to avoid it. `--radius-card` is a `:root`/`.surface-*` token, NOT a `@theme` token, so no `rounded-card` utility exists. Resolution: panel uses the existing `neu-card` component class, which already applies `border-radius: var(--radius-card)` (plus bg/shadow/border/transition) via CSS and resolves correctly under the re-applied surface scope; mobile bottom-sheet squares its bottom corners with the real utility `max-sm:rounded-b-none`. Padding/border still use `p-[var(--space-card-p)]` / `border-[var(--surface-border)]` — the established pattern in `Card.tsx`, `Button.tsx`, `Input.tsx`.
- **Mount flag**: design says `createPortal` "behind a `mounted` flag set in `useEffect`". ESLint `react-hooks/set-state-in-effect` rejects `setState` in an effect body. Used `useSyncExternalStore(noop, () => true, () => false)` instead — same SSR deferral, no effect, no hydration mismatch. Behaviourally identical.
- **`initialFocusRef` fallback**: focuses first focusable, then the panel itself (`tabIndex={-1}`) if the panel has none, so focus never stays on the trigger behind the overlay.
- **`test.fixme` vs `[RED]`**: task 2.8 is labelled `[RED]` but the E2E suite has no fixtures (0/5 pre-existing). Marked `test.fixme` (Playwright's explicit "pending" primitive) rather than leaving hard-failing tests. Not a merge gate per the forecast and design Testing Strategy.

### Phase 3
- **`validateMeasurementBatch` on missing client**: returns `{ ok: true }` rather than a failure, so a missing client still surfaces as the existing 404 from the persistence actions rather than a 400. Keeps all existing route tests green and matches the "validation-only, writes nothing" contract.
- **No `cn` util in repo**: the `tailwind-4` skill shows `cn()` but this project has none. Conditional tile classes use the `[...].filter(Boolean).join(' ')` pattern already established in `ui/Modal.tsx`.
- **Modal panel radius `var()` note carried over** — `AddMeasurementModal` relies on `ui/Modal` which already resolved this in Phase 2 (`neu-card`).
- **No jsdom/RTL added** (design decision). Modal component wiring (3.4–3.9) is gated by `yarn lint` + `npx tsc --noEmit` + the POM update; the risky logic (partial-save fork, sanitize, steppers, reference line) is extracted into pure, unit-tested domain functions.
- **`formatMeasurementReference` delta rounding**: `Number(delta.toFixed(1))` so `85 − 83.8` renders `Δ -1.2` (not `-1.2000000000000028`); an integer delta drops the decimal (`Δ +2`).

## Attempt / Native Runtime
- Gen-1 `full-implementation-3-phases` (ordinal 1) settled `interrupted`, 430 lines. Gen-2 `phase-2-ui-modal` (ordinal 2) settled `interrupted`, 138 lines.
- Phase 3: acquire refused as elective objective change → `gentle-ai sdd-attempt rescope` to **generation-3** objective `phase-3-grid-atomicity` (cumulative 568 carried forward; caps 3 attempts / 800 lines), then `begin` (ordinal 3/4).
- Settled after this batch: `--outcome passed` (overall change complete — 35/35 tasks), `--harness-disposition reused`, evidence-revision `sha256:27e479a1…`.
- **size:exception**: Phase 3 authored **595 lines** (ledger). Objective cap 800, cumulative after phases 1–2 was 568, so lifetime 1163 > 800 → runtime `blocked(maintainer_decision)` / `changed_line_budget_exceeded: true`. Delivery strategy is `single-pr` + `exception-ok` (owner accepts `size:exception`, recorded Phase 2). The code cannot shrink further without deleting legitimate strict-TDD tests or the modal rebuild it was assigned. A maintainer must clear the gate with `gentle-ai sdd-attempt reset … --reason "size:exception accepted; measurement-input-redesign impl complete 35/35"` before `sdd-verify` can run.

## Status
**35/35 tasks complete.** `yarn test:unit` 124/124 · `yarn lint` clean · `npx tsc --noEmit` exit 0. Ready for `sdd-verify`.
