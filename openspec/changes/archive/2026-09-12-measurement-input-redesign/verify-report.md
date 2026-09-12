```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:1608abc4e22a88fcb6df6954fc14ffd7959f6567ddee1eb9d802646045338bab
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 5/5
scenarios: 27/27
test_command: yarn test:unit
test_exit_code: 0
test_output_hash: sha256:277809d87ff34146e34395ba4f7d2bcd19b1d6972e4082b42e0a0f432581d9c1
build_command: npx tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: measurement-input-redesign
**Version**: delta specs — body-measurements-tracking (REQ-BMT-02, REQ-BMT-04, REQ-BMT-07 REMOVED), unified-tracking-api (REQ-UTA-04), ui-design-system (Shared Modal/Overlay Primitive)
**Mode**: Strict TDD
**Requirement / scenario headings counted**: 5 requirements, 27 scenarios

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 35 |
| Tasks complete | 35 |
| Tasks incomplete | 0 |

All 35 checkboxes in `tasks.md` (Phase 1: 1.1–1.17, Phase 2: 2.1–2.8, Phase 3: 3.1–3.10) re-checked against actual code state. Every claimed file edit is present in `git diff origin/main`. No discrepancy between claimed and actual completion.

---

### Build & Tests Execution

**Build (`npx tsc --noEmit`)**: PASSED — exit 0, zero errors. Matches apply-progress claim.

**Lint (`yarn lint` → `eslint .`)**: PASSED — exit 0, clean. (Note: the repo migrated to flat ESLint 9 / `eslint .`; the Next.js `next lint` CLI bug noted in the prior archive report no longer applies.)

**Tests (`yarn test:unit` → `vitest run`)**: 124 passed / 0 failed / 0 skipped across 8 files, exit 0. Re-run twice, identical. Matches apply-progress claim (124/124).

Test files exercised:
- `tests/unit/domain/types/BodyMeasurement.spec.ts` — 9 cases (valueCm boundary + date refine)
- `tests/unit/domain/services/bodyMeasurements.spec.ts` — 47 cases (validateMeasurement inversion + 6 new pure helpers)
- `tests/unit/api/tracking.spec.ts` — 24 cases (dispatch + atomicity)
- `tests/unit/components/ui/modal-helpers.spec.ts` — 11 cases (computeKeyboardInset / resolveSurfaceScope / createScrollLock)
- 4 pre-existing suites (weightAverage, dailySteps, etc.) — unchanged, green

**E2E (`yarn playwright test tests/body-measurements.spec.ts`)**: NOT executed as a gate. The suite is 0/5 on missing seeded fixtures — a pre-existing `body-measurements-tracking` infrastructure gap, explicitly out of scope for this change. The 7 new `ui-design-system` modal-primitive scenarios were added as `test.fixme` (Playwright's pending primitive), not hard-failing tests.

**Coverage**: Not available — no coverage tool configured in this repo.

---

### The 6 `valueCm` enforcement sites (design D4)

Each site read directly from `git diff origin/main`. All 6 relaxed exactly as the D4 table specifies:

| # | Site | Before | After (verified in tree) | Status |
|---|------|--------|--------------------------|--------|
| 1 | `src/domain/types/BodyMeasurement.ts:6` | `z.number().positive().max(300)` | `z.number().min(0)` + comment | ✅ |
| 2 | `src/domain/services/bodyMeasurements.ts` `validateMeasurement` | two `point.minCm/maxCm` range branches | `!Number.isFinite(v)` → error; `v < 0` → error; else ok; `point` kept for label | ✅ |
| 3 | `src/app/actions/clientActions.ts` `addMeasurementEntries` | range throw via `validateMeasurement` | `toPersistableEntries()` pre-filter, then non-range `validateMeasurement` as defence-in-depth | ✅ |
| 4 | `src/lib/models/Client.ts:67` | `{ min: 0.1, max: 300 }` | `{ min: 0 }` + comment | ✅ |
| 5 | `src/app/api/clients/[clientId]/tracking/route.ts:8` | `z.number().positive().max(300)` | `z.number().min(0)` + comment | ✅ |
| 6 | `src/components/activity/AddMeasurementModal.tsx` | `min`/`max` attrs, `({minCm}–{maxCm} cm)` hint, midpoint placeholder | `type="text" inputMode="decimal"`, placeholder `—`, no attrs, no hint, sanitize-on-change | ✅ |

`MEASUREMENT_POINTS_CATALOG` `minCm`/`maxCm` values are retained as data; the block comment was retitled from "Category ranges per spec REQ-BMT-07" to "legacy, unenforced metadata (REQ-BMT-07 removed) … MUST NOT feed placeholders, stepper hints, or validation". Grep confirms no code reads `.minCm`/`.maxCm` for enforcement or UI hints anywhere in `src/`.

**No site missed.** This was the top risk in the proposal; it is fully discharged.

---

### The atomicity fix (design D5, REQ-UTA-04)

`src/app/api/clients/[clientId]/tracking/route.ts` — verified by reading the handler:

1. A new block runs `await validateMeasurementBatch(clientId, entry.measurements.map(...))` and returns `400` on `!ok`.
2. This block is positioned **before** the `if (entry.steps !== undefined)` dispatch and every `addDailyStep` / `addDailyWeight` / `addMeasurementEntries` call.
3. `validateMeasurementBatch` (new read-only action in `clientActions.ts`) loads the client, runs the pure `validateMeasurementEntries`, and writes nothing.
4. `addMeasurementEntries` keeps its own per-entry `validateMeasurement` + schema parse as defence-in-depth.

**Test proving steps are not written when a measurement is invalid**: `tests/unit/api/tracking.spec.ts` — `"REQ-UTA-04: valid steps + an invalid measurement → 400 and NOTHING persists"` (mocks `validateMeasurementBatch` rejecting; asserts `res.status === 400`, `addDailyStep` NOT called, `addMeasurementEntries` NOT called). A companion case `"validateMeasurementBatch runs before any persistence on a valid combined batch"` asserts ordering on the happy path.

Residual risk (a DB error *between* two persist calls on a steps+weight+measurements request) is accepted and documented in design D5 — the Mongoose-transaction option was explicitly deferred pending replica-set confirmation.

---

### `0` / blank never persisted

Traced end-to-end:

- **Modal** (`AddMeasurementModal.handleSubmit`) → `buildMeasurementEntries(activePoints, values, date)` (pure). Blank (`raw.trim() === ""`) → `continue`; `num === 0` → `continue` (no-data); negative / non-finite → `fieldErrors`, not pushed. Only positive finite values enter `entries[]`.
- **Server action** (`addMeasurementEntries`) → `toPersistableEntries(entries)` filters `valueCm > 0` **before** the persist loop, so a `0` (or negative) passed by any caller is dropped, never reaching `BodyMeasurementSchema.safeParse` or the upsert.
- **No path writes `0` or null `valueCm`**: `BodyMeasurementSchema` requires `valueCm` as `z.number().min(0)` (required, non-optional); Mongoose `BodyMeasurementSubSchema` requires it. The only writer is `addMeasurementEntries`, which iterates the `toPersistableEntries`-filtered list.

Tests: `toPersistableEntries` (3 cases — drops every `0`, drops negatives, empty when all `0`); `buildMeasurementEntries` (drops blank + `0`, keeps siblings). REQ-BMT-04's "renders as a gap" is thereby guaranteed structurally — no viz-consumer patch needed, matching the proposal.

---

### Spec Compliance Matrix

Legend: ✅ COMPLIANT (covering unit test passed at runtime) · ⚠️ PARTIAL (implementation present + verified by source/adjacent unit test; full scenario runtime path gated on absent Playwright fixtures or is pre-existing unchanged behavior).

#### body-measurements-tracking — REQ-BMT-02 (9 scenarios)

| Scenario | Test / evidence | Result |
|----------|-----------------|--------|
| Valid 3-point batch | `bodyMeasurements.spec.ts > buildMeasurementEntries` (composition); full persist E2E gated | ✅ |
| Value of `0` → nothing persisted, no error | `toPersistableEntries` + `buildMeasurementEntries` drop-0 cases; `BodyMeasurementSchema` accepts 0 (filtered downstream) | ✅ |
| Blank field | `buildMeasurementEntries` "drops blank and 0" | ✅ |
| Large value (250) | `BodyMeasurement.spec.ts` "accepts 450"; `validateMeasurement` "450 ok"; `tracking.spec.ts` "above legacy 300 cap → 200" | ✅ |
| Negative value → field error, not persisted | `buildMeasurementEntries` "flags a negative"; `BodyMeasurementSchema` "rejects negative"; `tracking.spec.ts` "rejects negative at schema boundary → 400, action not called" | ✅ |
| Non-numeric (NaN) → field error | `buildMeasurementEntries` "flags unparseable `1.2.3`"; `BodyMeasurementSchema` "rejects NaN"; `validateMeasurement` "NaN → ok:false" | ✅ |
| Batch: 1 invalid + 2 valid → 2 persisted, 1 reported | `buildMeasurementEntries` "flags unparseable but still returns valid siblings" / "flags negative and returns pecho" | ✅ |
| Future date → "La fecha no puede ser futura", nothing persisted | `BodyMeasurement.spec.ts` "rejects a future date"; modal `handleSubmit` sets that exact string (source) | ✅ |
| Resubmit same date+point → upsert | Pre-existing `addMeasurementEntries` upsert path — untouched by this change, no new test | ⚠️ |

#### body-measurements-tracking — REQ-BMT-04 (6 scenarios)

| Scenario | Test / evidence | Result |
|----------|-----------------|--------|
| View trend chart for a point | Pre-existing chart, not modified by this change | ⚠️ |
| Switch point via dropdown | Pre-existing chart, not modified | ⚠️ |
| Chart with no data → empty state | Pre-existing chart, not modified | ⚠️ |
| Skipped value renders as a gap, not a zero | Guaranteed by "`0` never persisted" — `toPersistableEntries` / `buildMeasurementEntries` unit tests; chart reads only persisted rows | ✅ |
| No-data date absent from history table | Same mechanism (`0`/blank never written) | ✅ |
| Point-entry counts ignore skipped values | Same mechanism; `countEntriesForPoint` untouched, operates on persisted rows only | ✅ |

#### body-measurements-tracking — REQ-BMT-07 (REMOVED)

| Check | Evidence | Result |
|-------|----------|--------|
| Range enforcement removed at all boundaries | 6/6 D4 sites relaxed (table above); catalog comment retitled to "legacy, unenforced" | ✅ removal implemented |
| `minCm`/`maxCm` retained as advisory metadata, no migration | Still on `MeasurementPointSchema` / `MeasurementPointSubSchema` and `MEASUREMENT_POINTS_CATALOG`; read by nobody | ✅ |
| Out-of-old-range values now accepted | `bodyMeasurements.spec.ts` "450 ok / 5 ok"; `tracking.spec.ts` "value above legacy 300 cap → 200" | ✅ |

#### unified-tracking-api — REQ-UTA-04 (5 scenarios)

| Scenario | Test | Result |
|----------|------|--------|
| Both steps and weight dispatched atomically | `tracking.spec.ts` "accept both steps and weight and call both actions" (rollback-on-failure path is pre-existing, not re-exercised) | ✅ |
| Steps-only dispatch | `tracking.spec.ts` "accept steps only and call addDailyStep" | ✅ |
| Weight-only dispatch | `tracking.spec.ts` "accept weight only and call addDailyWeight" | ✅ |
| Measurements-only dispatch | `tracking.spec.ts` "accept measurements-only and call addMeasurementEntries" | ✅ |
| Valid steps + invalid measurement → nothing persists | `tracking.spec.ts` "valid steps + an invalid measurement → 400 and NOTHING persists" | ✅ |

#### ui-design-system — Shared Modal/Overlay Primitive (7 scenarios)

| Scenario | Implementation evidence (source) | Runtime test | Result |
|----------|----------------------------------|--------------|--------|
| Renders as bottom-sheet on mobile | `Modal.tsx` overlay `items-end sm:items-center`; panel `w-full max-sm:rounded-b-none max-h-[85dvh]` | `test.fixme` (fixtures absent) | ⚠️ |
| Renders as centered dialog on desktop | overlay `sm:items-center`, `sm:p-4`; panel `sm:max-w-{sm,md,lg}` | `test.fixme` | ⚠️ |
| Escape closes and restores focus | `handlePanelKeyDown` Escape → `onClose`; effect cleanup `previouslyFocused.current?.focus()` | `test.fixme` | ⚠️ |
| Backdrop click closes | overlay `onClick={closeOnBackdrop ? onClose : undefined}`; panel `stopPropagation` | `test.fixme` | ⚠️ |
| Focus trapped + wraps | `handlePanelKeyDown` Tab/Shift+Tab wrap via `getFocusable(panelRef)` | `test.fixme` | ⚠️ |
| Body scroll locked + restored | `bodyScrollLock` reference-counted singleton; `createScrollLock` unit-tested (5 cases) | helper unit-tested; DOM wiring `test.fixme` | ⚠️ |
| Portaled overlay preserves surface scope | in-place `<span ref={anchorRef} hidden>` sentinel → `detectSurfaceScope` `closest('.surface-client, .surface-coach')` → class copied to overlay root; `resolveSurfaceScope` unit-tested (3 cases) | helper unit-tested; DOM wiring `test.fixme` | ⚠️ |

Pure sub-logic (`computeKeyboardInset`, `resolveSurfaceScope`, `createScrollLock`) — 11 passing unit cases in `modal-helpers.spec.ts`. The DOM-behavioural layer (focus trap, Escape, backdrop, portal, scroll-lock wiring) has **no executing test** — a design-sanctioned gap (design.md "React Testing Library + jsdom: recommended NO for this change"), tracked as a follow-up alongside the other three modal migrations.

**Compliance summary**: 27/27 scenarios implemented and verified present. 16/27 are COMPLIANT via a passing runtime unit test; 11/27 are PARTIAL — implementation confirmed by source inspection (and, for the modal, by 11 pure-helper unit cases), with the full scenario runtime path either design-sanctioned as un-harnessed (7 modal DOM scenarios) or pre-existing behaviour untouched by this change (3 chart scenarios + 1 upsert path). 0 FAILING, 0 unimplemented.

---

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-BMT-02 finite/non-negative, no per-point range | ✅ Implemented | 6/6 sites; `z.number().min(0)` yields finite+non-negative (Zod 4 rejects NaN/±Inf) |
| REQ-BMT-02 partial save (valid siblings persist) | ✅ Implemented | Client-side pre-filter in `buildMeasurementEntries`; server batch stays atomic (design D3) — no contradiction with D5 |
| REQ-BMT-02 blank/`0` = no-data | ✅ Implemented | `buildMeasurementEntries` + `toPersistableEntries`; storage shape unchanged |
| REQ-BMT-04 no-data renders as gap, never plotted `0` | ✅ Implemented | Structural — `0` is never written, so consumers need no patch |
| REQ-BMT-07 removed | ✅ Implemented | All boundary range checks deleted; catalog ranges demoted to comment-flagged legacy metadata |
| REQ-UTA-04 atomic dispatch incl. `measurements[]` | ✅ Implemented | `validateMeasurementBatch` before any persist; 400 on invalid |
| ui-design-system modal primitive | ✅ Implemented | `Modal.tsx` + `modal-helpers.ts` — all 7 required behaviours present in source |

---

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| D1 flat-prop `Modal` (title/footer/children) | ✅ Yes | `ModalProps` matches the design Interfaces block; `SURFACE_SCOPE`/`SurfaceScope` exported |
| D1 sheet vs dialog via pure Tailwind media query, no JS | ✅ Yes | `items-end sm:items-center` + `sm:max-w-*`; correct on first paint |
| D1 focus trap hand-rolled, no deps | ✅ Yes | activeElement capture, `initialFocusRef` → first focusable → panel, Tab wrap, restore on cleanup |
| D1 module-level scroll-lock counter | ✅ Yes | `createScrollLock` / `bodyScrollLock` singleton in `modal-helpers.ts` |
| D1 portal behind `mounted` flag | ⚠️ Adapted | `useSyncExternalStore(noop, ()=>true, ()=>false)` instead of `useEffect` setState — ESLint `react-hooks/set-state-in-effect` forbids the effect form; SSR-safe, no hydration mismatch, behaviourally identical. Sound. |
| D1 surface-scope sentinel rendered in place | ✅ Yes | `<span ref={anchorRef} hidden>` outside the portal; `closest()` walks the real ancestor chain |
| D1 `visualViewport` keyboard inset | ✅ Yes | `computeKeyboardInset`, `resize`/`scroll` subscription, `paddingBottom` on overlay, no-op when unsupported |
| D1 panel radius `rounded-t-[var(--radius-card)]` | ⚠️ Adapted | Uses `neu-card` (carries scoped `--radius-card`) + `max-sm:rounded-b-none`. `tailwind-4` skill forbids `var()` in `className` and `--radius-card` is not a `@theme` token so no `rounded-card` utility exists. Panel still uses `p-[var(--space-card-p)]` / `border-[var(--surface-border)]` — matches existing `Card.tsx`/`Input.tsx` pattern. Visually equivalent; recommend a manual visual check in both surface scopes. |
| D2 groups derived (`MEASUREMENT_GROUPS` + `groupPoints`), not on `MeasurementPoint` | ✅ Yes | No Zod/Mongoose/coach-editor/backfill touched; unknown slug → `Otros` |
| D2 `type="text" inputMode="decimal"` + sanitize-on-change | ✅ Yes | `sanitizeDecimalInput`; makes site 6 attrs unnecessary by construction |
| D2 tile grid `grid-cols-2 sm:grid-cols-3`, steppers `step 0.5` clamped at 0 | ✅ Yes | `stepMeasurementValue` clamps at 0, comma-aware, non-finite → 0 |
| D2 auto-advance on Enter via ordered ref list; last tile only blurs | ✅ Yes | `handleInputKeyDown`; `orderedSlugs` = grouped flat order; last `enterKeyHint="done"` |
| D2 `preselectedSlug` ring + scrollIntoView, anatomical order preserved | ✅ Yes | `ring-2 ring-primary`, effect `focus()` + `scrollIntoView({block:'center'})`, groups never reordered |
| D2 optional `measurements?` prop, one-line wire in `ActivityPageClient` | ✅ Yes | `formatMeasurementReference`; `ActivityPageClient.tsx` +1 line; existing callers unaffected |
| D3 client-side pre-filter, server batch stays atomic | ✅ Yes | `buildMeasurementEntries` → valid entries only → one `addMeasurementEntries` call; stays open if any tile flagged |
| D4 six-site table | ✅ Yes | Verified individually above |
| D5 validate-all-then-persist-all, `validateMeasurementBatch` read-only | ✅ Yes | Before `entry.steps` block; `addMeasurementEntries` keeps its own check |
| D5 Mongoose transaction deferred | ✅ Yes | Recorded as follow-up (replica-set open question) |

---

### TDD Compliance

| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | `apply-progress.md` has a "TDD Cycle Evidence" table covering all test-bearing tasks |
| All tasks have tests | ⚠️ | Domain/API/helper tasks: RED→GREEN documented. Component-DOM tasks (1.13/1.14/1.16 structural, 2.1/2.2/2.3/2.5, 3.4–3.9) have no unit layer — gated by lint + tsc + POM, per design D-testing. `test.fixme` for the 7 modal E2E scenarios. |
| RED confirmed (test files exist) | ✅ | All referenced files exist: `BodyMeasurement.spec.ts`, `bodyMeasurements.spec.ts`, `tracking.spec.ts`, `modal-helpers.spec.ts` — read in full |
| GREEN confirmed (tests pass now) | ✅ | Re-ran `yarn test:unit`: 124/124, exit 0 |
| Triangulation adequate | ✅ | valueCm boundary: 7 cases (0, -1, 0.1, 450, NaN, Infinity, ""). `buildMeasurementEntries`: 4 cases. `sanitizeDecimalInput`/`stepMeasurementValue`: 5 each. `groupPoints`: 3 incl. catalog drift guard. `tracking` atomicity: 2. |
| Safety Net for modified files | ✅ | `bodyMeasurements.spec.ts` (16→47) and `tracking.spec.ts` (20→24) ran green before extension per apply-progress |

**Assertion quality**: ✅ No tautologies, no ghost loops in executing tests, no assertion-without-production-call. `tracking.spec.ts` asserts mock call state (`addDailyStep not called`) — appropriate here because REQ-UTA-04 is literally a dispatch/ordering contract. The `test.fixme` focus-trap loop (`for … expect(focusInsidePanel).toBe(true)`) would be a ghost-loop risk if it ran, but `test.fixme` never executes it — acceptable as a pending stub, flagged for whoever lands the fixtures.

### Test Layer Distribution

| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit (domain/type/route-in-isolation/pure-helpers) | 124 | 8 | Vitest (node env) |
| Integration (jsdom/RTL) | 0 | — | not installed (design decision) |
| E2E | 5 existing (0 passing — pre-existing fixture gap) + 7 new `test.fixme` | `tests/body-measurements.spec.ts` | Playwright |

### Changed File Coverage

Coverage analysis skipped — no coverage tool configured in this repo.

---

### Deviation Assessment (from apply-progress)

| Deviation | Assessment |
|-----------|------------|
| `neu-card` instead of `rounded-t-[var(--radius-card)]` / `sm:rounded-[var(--radius-card)]` | **Acceptable.** `tailwind-4` skill forbids `var()` in `className`; `--radius-card` is a `:root`/`.surface-*` token, not `@theme`, so no `rounded-card` utility exists. `neu-card` applies `border-radius: var(--radius-card)` via CSS and resolves under the re-applied surface scope; `max-sm:rounded-b-none` squares the bottom-sheet. Not a spec breach (spec requires `dvh` sizing + surface-scope preservation, both present). Minor inconsistency: `p-[var(--space-card-p)]` / `border-[var(--surface-border)]` still use `var()` in `className` — matches the established `Card.tsx`/`Input.tsx` pattern. → SUGGESTION: manual visual check in `.surface-client` and `.surface-coach`. |
| `useSyncExternalStore` mount flag instead of `useEffect` | **Acceptable / better.** ESLint `react-hooks/set-state-in-effect` rejects the effect form. `useSyncExternalStore(noop, ()=>true, ()=>false)` gives the same SSR deferral with no effect and no hydration mismatch. Behaviourally identical. |
| `validateMeasurementBatch` returns `{ ok: true }` for a missing client | **Acceptable.** Contract is "validation-only, writes nothing". A missing client still surfaces as the existing 404 from the persistence actions (`addMeasurementEntries` returns `null` → route 404). No atomicity hole: nothing is persisted either way. Keeps all pre-existing route tests green. |
| No `cn` util in repo | **Acceptable.** `[...].filter(Boolean).join(' ')` — the pattern already used in `Modal.tsx` and elsewhere. |
| No jsdom/RTL — modal DOM behaviour untested | **Acceptable but is the source of W1.** Design pre-declared this (planning-time decision, not a phase-time omission). Risky logic is extracted into pure, unit-tested functions. The residual gap — focus trap, Escape, backdrop, portal, scroll-lock *wiring* — has zero executing test. Tracked as a follow-up. |
| `toPersistableEntries` filters `valueCm > 0` (drops negatives too, silently) before `addMeasurementEntries`'s validation loop | **Acceptable, minor.** REQ-BMT-02 requires invalid entries be *reported*; at both real entry points they are (modal `fieldErrors`, API `validateMeasurementBatch` → 400). A negative reaching `addMeasurementEntries` directly would be silently dropped rather than throwing — but no such caller exists. → SUGGESTION: consider filtering only `=== 0`/blank in `toPersistableEntries` and letting negatives hit the validator for defence-in-depth symmetry. |
| `formatMeasurementReference` delta `Number(delta.toFixed(1))` | **Acceptable.** Cosmetic — avoids float noise (`Δ -1.2` not `-1.2000000000000028`); integer delta drops the decimal. |
| Main `openspec/specs/*` not updated | **Correct, not a deviation.** OpenSpec convention: deltas in `changes/{change}/specs/` are applied to `openspec/specs/` by `sdd-archive`. Task 1.17 explicitly defers this. Confirmed the three target capability specs still hold their pre-change text. |

---

### Issues Found

**CRITICAL**: None.

**WARNING**:
- **W1 — The 7 `ui-design-system` "Shared Modal/Overlay Primitive" scenarios have no executing test.** All are `test.fixme` (blocked on the pre-existing, out-of-scope `body-measurements-tracking` Playwright fixture gap). The DOM-behavioural layer of `Modal.tsx` (focus trap wrap, Escape+restore-focus, backdrop close, portal, scroll-lock wiring, responsive shape) is verified only by source inspection. Pure sub-logic is unit-tested (11 cases). This is a design-sanctioned tradeoff (design.md Testing Strategy) and mirrors the accepted precedent in `openspec/changes/archive/2026-08-09-ui-system-redesign/`. Recommend the orchestrator/user explicitly acknowledge this runtime-coverage gap before archive, and keep "add component-test infrastructure" as a tracked follow-up.
- **W2 — REQ-BMT-02 modal-level scenarios and REQ-BMT-04 chart/history/count scenarios are not runtime-verified through the UI.** The underlying domain guarantees (`0` never persisted, partial-save composition, future-date rejection) are unit-tested; the modal wiring and the chart/table/count consumers are not exercised (same Playwright fixture gap). Chart/count consumer code is untouched by this change.
- **W3 — The steps+weight atomic rollback-on-persist-failure path is not re-exercised.** `tracking.spec.ts` proves ordering and the measurement-invalid → nothing-persists case, but no test simulates `addDailyWeight` throwing after `addDailyStep` succeeded. This is pre-existing REQ-UTA-04 behaviour, not introduced here, and design D5 explicitly accepts the narrow mid-persist DB-failure window.

**SUGGESTION**:
- Manual visual check of `ui/Modal` in both `.surface-client` and `.surface-coach` (the `neu-card` radius adaptation).
- Consider narrowing `toPersistableEntries` to drop only `0`/blank, letting negatives reach the validator for defence-in-depth symmetry (currently negatives are dropped silently at that layer; they are still reported at both real boundaries).
- The `test.fixme` focus-trap loop would be a ghost-loop if enabled — add a guard (`expect(count).toBeGreaterThan(0)`) when the fixtures land.
- design.md open question: confirm the target MongoDB deployment is a replica set, to unblock the D5 transaction follow-up.

---

### Ready to archive?

**Yes, with an explicit acknowledgement of W1.** All 35 tasks are genuinely implemented and match the working tree — independently re-verified, not trusted. The three hard gates pass cleanly (`yarn test:unit` 124/124 exit 0, `yarn lint` exit 0, `npx tsc --noEmit` exit 0). The two proposal-critical risks — a missed `valueCm` site and a broken cross-action atomicity guarantee — are both fully discharged with source proof and, for atomicity, a passing regression test. No CRITICAL findings, no blockers.

The single reservation is W1: the `ui-design-system` modal-primitive requirement's 7 scenarios are proven by source inspection and pure-helper unit tests but have no executing DOM-level test, because the project deliberately has no jsdom/RTL harness and the Playwright fixtures are a separate, pre-existing, out-of-scope gap. This is consistent with the design's documented Testing Strategy and with this repo's own archived precedent. If the orchestrator/user accepts that documented tradeoff (as the design already recorded), this change is archive-ready. If stronger runtime proof of the modal primitive is required before archive, that is net-new test-infrastructure work outside this change's scope.

### Verdict

**PASS WITH WARNINGS** — 35/35 tasks complete; all gates green; every spec requirement implemented and source-verified; 16/27 scenarios covered by passing runtime unit tests, 11/27 partial (7 design-sanctioned modal DOM gaps + 4 pre-existing untouched behaviours); 0 critical, 3 warnings, 4 suggestions.
