# Tasks: Measurement Input Redesign

> **Strict TDD Active** — every implementation task is preceded by its failing test task.
> Test runners: `yarn test:unit` (Vitest, node env) for domain/API; `yarn playwright test` for E2E.
> **Delivery strategy**: single-pr

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500–680 authored LOC across ~13 files |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (validation + helpers + specs + unit tests) → PR 2 (`ui/Modal` primitive) → PR 3 (grid redesign + atomicity) |
| Delivery strategy | single-pr |
| Chain strategy | pending (owner decision) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

- `single-pr` is cached, so a single PR needs an explicit `size:exception` before `sdd-apply`. Otherwise slice into the 3 phases below.
- Merge order if sliced: PR 1 → PR 2 → PR 3.
- `body-measurements-tracking` is un-archived and edits the same files (`BodyMeasurement.ts`, `bodyMeasurements.ts`, `clientActions.ts`, `Client.ts`, `tracking/route.ts`, `AddMeasurementModal.tsx`, `ActivityPageClient.tsx`, `tracking.spec.ts`, `body-measurements.spec.ts`). Land this change after it merges, or rebase each slice on it.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Finite/non-negative validation at all 6 sites + pure domain helpers | PR 1 | `yarn test:unit` | N/A — pure domain + Zod/Mongoose schema; Vitest is the harness, no dev server | Revert 6 site edits + helper additions; storage shape unchanged |
| 2 | `src/components/ui/Modal.tsx` responsive primitive | PR 2 | `yarn lint && yarn tsc --noEmit` + `yarn playwright test body-measurements` (pending fixtures) | Manual browser check in `.surface-client` and `.surface-coach` (Playwright BMT fixtures out of scope) | Delete `Modal.tsx`; no adopters yet |
| 3 | Grouped tile grid on `ui/Modal` + `tracking` atomicity | PR 3 | `yarn test:unit api/tracking` + `yarn playwright test body-measurements` | `yarn dev`, log a measurement batch on a mobile viewport | Restore previous `AddMeasurementModal` markup + revert route ordering; `Modal` stays |

## Phase 1: Validation Relaxation + Pure Domain Helpers

- [x] 1.1 [RED] Create `tests/unit/domain/types/BodyMeasurement.spec.ts` — `valueCm` boundary: `0` ok, `-1` reject, `0.1` ok, `450` ok, `NaN` reject, `Infinity` reject, `""` reject; future-date `.refine()` still rejects (REQ-BMT-02)
- [x] 1.2 [GREEN] Site 1 — `src/domain/types/BodyMeasurement.ts`: `z.number().positive().max(300)` → `z.number().min(0)`
- [x] 1.3 [RED] `tests/unit/domain/services/bodyMeasurements.spec.ts` — invert `validateMeasurement` range cases: non-finite → error, `< 0` → error, `450` ok, no min/max branch (REQ-BMT-07 removed)
- [x] 1.4 [GREEN] Site 2 — `src/domain/services/bodyMeasurements.ts` `validateMeasurement`: drop both range branches; `!Number.isFinite(v)` → error, `v < 0` → error, else ok; keep `point` param for the message label; retitle the `REQ-BMT-07` comment to `legacy, unenforced`
- [x] 1.5 [RED] `tests/unit/domain/services/bodyMeasurements.spec.ts` — `toPersistableEntries` drops every `0`, keeps positives (REQ-BMT-04)
- [x] 1.6 [GREEN] Add `toPersistableEntries<T extends { valueCm: number }>(entries)` to `src/domain/services/bodyMeasurements.ts`
- [x] 1.7 [RED] `tests/unit/domain/services/bodyMeasurements.spec.ts` — `buildMeasurementEntries` drops blank and `0`, flags `"1.2.3"` in `fieldErrors`, still returns valid siblings, parses `,` as `.` (REQ-BMT-02 partial-save fork)
- [x] 1.8 [GREEN] Add `buildMeasurementEntries(points, values, date)` to `src/domain/services/bodyMeasurements.ts`
- [x] 1.9 [RED] `tests/unit/domain/services/bodyMeasurements.spec.ts` — `validateMeasurementEntries` errors on negative / non-finite / unknown slug, ok for a valid batch (REQ-UTA-04)
- [x] 1.10 [GREEN] Add `validateMeasurementEntries(points, entries)` to `src/domain/services/bodyMeasurements.ts`
- [x] 1.11 [RED] `tests/unit/domain/services/bodyMeasurements.spec.ts` — `groupPoints`: every `MEASUREMENT_POINTS_CATALOG` slug maps to a group (drift guard), unknown slug → `Otros`, anatomical order preserved
- [x] 1.12 [GREEN] Add `MEASUREMENT_GROUPS: Record<string, string>` + `groupPoints(points)` to `src/domain/services/bodyMeasurements.ts`
- [x] 1.13 [GREEN] Site 3 — `src/app/actions/clientActions.ts` `addMeasurementEntries`: drop the range check (call now non-range `validateMeasurement`); run `toPersistableEntries()` first so a `0` is skipped as no-data (covered by 1.5/1.7)
- [x] 1.14 [GREEN] Site 4 — `src/lib/models/Client.ts` `valueCm`: `{ min: 0.1, max: 300 }` → `{ min: 0 }`
- [x] 1.15 [GREEN] Site 5 (schema only) — `src/app/api/clients/[clientId]/tracking/route.ts`: `z.number().positive().max(300)` → `z.number().min(0)` (atomicity reorder is Phase 3)
- [x] 1.16 [GREEN] Site 6 — `src/components/activity/AddMeasurementModal.tsx`: remove `min`/`max` input attrs, the `({minCm}–{maxCm} cm)` hint and the midpoint placeholder; interim `inputMode="decimal"`, placeholder `—` (full grid rebuild in Phase 3)
- [x] 1.17 Confirm `openspec/changes/measurement-input-redesign/specs/{body-measurements-tracking,unified-tracking-api}/spec.md` deltas (REQ-BMT-02/04, REQ-BMT-07 REMOVED, REQ-UTA-04) match the implemented behavior; adjust only on drift — confirmed, no drift (main `openspec/specs/` application deferred to `sdd-archive` per OpenSpec convention)

## Phase 2: `ui/Modal` Primitive

- [x] 2.1 Create `src/components/ui/Modal.tsx` — `ModalProps` + `SURFACE_SCOPE` / `SurfaceScope` exports per design Interfaces; `createPortal(node, document.body)` behind a `mounted` flag (via `useSyncExternalStore` — lint forbids `setState` in an effect; same SSR-safety, no hydration mismatch)
- [x] 2.2 Responsive sheet/dialog shell in `src/components/ui/Modal.tsx` — overlay `items-end sm:items-center`; panel base `neu-card` (surface-scoped `--radius-card`/shadow/border) + `w-full flex flex-col max-h-[85dvh] sm:max-h-[90dvh] max-sm:rounded-b-none` + `sm:max-w-{sm,md,lg}` via `size`; `rounded-t-[var(--radius-card)]` NOT used — `var()` in className is forbidden by the `tailwind-4` skill and `neu-card` already carries the scoped radius; `title` → `aria-labelledby`; scrollable `children` body + sticky `footer`
- [x] 2.3 Hand-rolled focus trap in `src/components/ui/Modal.tsx` — capture `document.activeElement` on open, focus `initialFocusRef` else first focusable else the panel, `Tab`/`Shift+Tab` wrap via `querySelectorAll` of panel focusables on the panel `onKeyDown`, restore focus on close
- [x] 2.4 Module-level scroll-lock counter in `src/components/ui/Modal.tsx` — `createScrollLock`/`bodyScrollLock` singleton in `modal-helpers.ts`; `document.body.style.overflow='hidden'` on first open, restore previous inline value at zero (pure, unit-tested)
- [x] 2.5 Escape + backdrop close in `src/components/ui/Modal.tsx` — `onKeyDown` on the panel container + sibling backdrop `onClick` with panel `stopPropagation`, gated by `closeOnEscape` / `closeOnBackdrop` (default `true`), no global listener
- [x] 2.6 Surface-scope sentinel in `src/components/ui/Modal.tsx` — hidden `<span ref={anchorRef} hidden />` rendered in place (outside the portal); on open resolve `anchorRef.current?.closest('.surface-client, .surface-coach')` and copy that class onto the portal overlay root; `surfaceScope` prop overrides (`resolveSurfaceScope`, unit-tested)
- [x] 2.7 `visualViewport` keyboard inset in `src/components/ui/Modal.tsx` — subscribe `resize`/`scroll`; `inset = max(0, innerHeight - (vv.height + vv.offsetTop))` (`computeKeyboardInset`, unit-tested); apply as `paddingBottom` on the overlay; no-op to `0` where unsupported
- [x] 2.8 [RED] `tests/body-measurements.spec.ts` — added 7 `test.fixme` Playwright cases via `AddMeasurementModal` for the `ui-design-system` scenarios (sheet vs dialog, Escape closes + restores focus, backdrop close, focus-trap wrap, body scroll lock, portaled `.surface-client` retained); `test.fixme` = pending until BMT E2E fixtures land (documented follow-up, not a merge gate)

## Phase 3: Grid Redesign + Atomicity

- [x] 3.1 [RED] `tests/unit/api/tracking.spec.ts` — valid `steps` + invalid `measurements[]` → 400 AND `addDailyStep` NOT called (mock `validateMeasurementBatch` rejecting) (REQ-UTA-04)
- [x] 3.2 [GREEN] Add read-only `validateMeasurementBatch(clientId, entries)` to `src/app/actions/clientActions.ts` — load client, run `validateMeasurementEntries`, write nothing
- [x] 3.3 [GREEN] `src/app/api/clients/[clientId]/tracking/route.ts` — call `validateMeasurementBatch` before the `entry.steps` block; return 400 on failure (validate-all-then-persist-all); `addMeasurementEntries` keeps its own check as defence in depth
- [x] 3.4 [GREEN] Rebuild `src/components/activity/AddMeasurementModal.tsx` body on `ui/Modal` — grouped tile grid via `groupPoints`; `grid-cols-2 sm:grid-cols-3` tiles (label, `tabular-nums` value, `cm` suffix, `−`/`+` steppers `step 0.5` clamped at `0`); sticky footer counter; props unchanged
- [x] 3.5 [GREEN] Tile input in `src/components/activity/AddMeasurementModal.tsx` — `type="text" inputMode="decimal" enterKeyHint="next"`, sanitize-on-change (digits + one separator, `,`→`.`); last tile `enterKeyHint="done"`; `Enter` auto-advances via an ordered ref list
- [x] 3.6 [GREEN] Submit path in `src/components/activity/AddMeasurementModal.tsx` — build `{ entries, fieldErrors }` from `buildMeasurementEntries`; send valid entries as one atomic `addMeasurementEntries` batch; flagged tiles keep text + error; modal stays open if any tile flagged, else closes; `0` shows a muted `no se guarda` hint
- [x] 3.7 [GREEN] `preselectedSlug` in `src/components/activity/AddMeasurementModal.tsx` — `ring-2 ring-primary` + focus + `scrollIntoView({ block: 'center' })`, anatomical order preserved
- [x] 3.8 [GREEN] Add optional `measurements?: BodyMeasurement[]` prop to `src/components/activity/AddMeasurementModal.tsx` — per-tile reference line `última: 85 cm (Δ -1.2)` from `groupByPoint` + `getDeltaForLast`
- [x] 3.9 [GREEN] `src/components/activity/ActivityPageClient.tsx` — pass `measurements` to `<AddMeasurementModal>` (one line, existing props stable)
- [x] 3.10 [GREEN] Update the `fillMeasurementInput` POM helper in `tests/body-measurements.spec.ts` for the new tile markup
