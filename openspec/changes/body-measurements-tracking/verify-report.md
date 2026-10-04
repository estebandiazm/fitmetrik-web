```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:9c4d68ba8078c2450ffbb47aaf505e27f8c56f8e95624a2b2b46d660f8f787cb
verdict: fail
blockers: 3
critical_findings: 3
requirements: 0/9
scenarios: 4/27
test_command: yarn playwright test tests/body-measurements.spec.ts --project=chromium --reporter=list
test_exit_code: 1
test_output_hash: sha256:b3cd6191121904200dc7b4cc148f470fd934dc92f31bce6030c573dbb18ef50d
build_command: npx tsc --noEmit
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

## Verification Report

**Change**: body-measurements-tracking
**Version**: N/A (new capability)
**Mode**: Strict TDD

### Completeness
| Metric | Value |
|--------|-------|
| Tasks total | 38 (per tasks.md, all Phase 1-7 items) |
| Tasks complete | 38 (all checked `[x]`) |
| Tasks incomplete | 0 |

All 38 tasks are checked off in `tasks.md` and every listed file exists in the working tree. Objective task-completion is confirmed. However, several tasks' self-reported "GREEN" TDD status in `apply-progress.md` does **not** hold up against a fresh runtime execution (see CRITICAL findings below) — task-checkbox completeness is not the same as spec/runtime compliance.

### Build & Tests Execution

**Build (`tsc --noEmit`)**: ✅ Passed — 0 TypeScript errors, exit 0, empty output.

**Unit tests (`yarn vitest run --reporter=verbose`)**: ✅ 69 passed / 0 failed / 0 skipped (6 files), exit 0.
```text
Test Files  6 passed (6)
     Tests  69 passed (69)
```
This includes the 16 tests in `tests/unit/domain/services/bodyMeasurements.spec.ts` (pure-function coverage for `validateMeasurement`, `groupByPoint`, `getDeltaForLast`, `seedCatalog`, catalog shape) and the 6 new `REQ-UTA-BMT-*` cases in `tests/unit/api/tracking.spec.ts` (route-dispatch behavior, with `addMeasurementEntries`/`addDailyStep` **mocked out** — see WARNING below on coverage depth).

Note: `apply-progress.md` reports "53/53 Vitest passing" in three places (Phase 7.2, TDD table, Test Summary). The actual count in this environment is **69/69** (all passing) — the self-reported number is stale/inaccurate, though not a functional regression.

**E2E tests (`yarn playwright test tests/body-measurements.spec.ts --project=chromium`)**: ❌ **0 passed / 5 failed**, exit 1.
```text
5 failed
  BMT-E2E-01 (REQ-BMT-01): page.waitForURL timeout — navigated to
    "/login?error=Invalid%20email%20or%20password"
  BMT-E2E-02 (REQ-BMT-01): same login failure
  BMT-E2E-03 (REQ-BMT-06): same login failure (client login)
  BMT-E2E-04 (REQ-BMT-06): same login failure (client login)
  BMT-API-01 (REQ-BMT-07 / unified-tracking-api): expected 200, received 403
```
Root cause (diagnosed, not fixed): the test fixtures `coach@example.com` / `client@example.com` and a valid `x-api-key` are not seeded/available in this environment's database. A `scripts/seed-coach.ts` exists but writes into whatever `MONGODB_URI` is configured in `.env.local` — I did **not** run it, since it is not scoped as a disposable test database and mutating it is outside verify's mandate ("do not fix issues, report them"). This is an infrastructure/fixture gap, not necessarily an application-code defect for the login failures — but per the Hard Rules, "a spec scenario is compliant only when a covering test passed at runtime," and it did not.

**Coverage**: Not measured — no coverage tool run in this pass (`vitest run --coverage` not invoked). Reported as unavailable rather than assumed.

### Spec Compliance Matrix

Source specs: `openspec/specs/body-measurements-tracking/spec.md` (7 requirements / 19 scenarios) + `openspec/changes/body-measurements-tracking/specs/unified-tracking-api/spec.md` delta (2 requirements / 8 scenarios). Combined: **9 requirements / 27 scenarios**.

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| REQ-BMT-01 | Coach activates points | `tests/body-measurements.spec.ts::BMT-E2E-01/02` | ❌ FAILING (login fixture) |
| REQ-BMT-01 | Deactivate point with entries (guardrail) | (E2E only, not isolated) | ❌ UNTESTED |
| REQ-BMT-01 | Save with no points selected | (E2E only, not isolated) | ❌ UNTESTED |
| REQ-BMT-02 | Client submits valid 3-point batch | `BMT-E2E-04` (indirect) | ❌ FAILING (login fixture) |
| REQ-BMT-02 | Out-of-range value rejected in modal | (E2E only; `validateMeasurement` unit-tested as a pure fn, not the modal/action wiring) | ⚠️ PARTIAL (pure-fn only) |
| REQ-BMT-02 | Future date rejected | (E2E only) | ❌ UNTESTED |
| REQ-BMT-02 | Resubmit same date upserts | (E2E only; upsert logic in `addMeasurementEntries` never called by any passing test) | ❌ UNTESTED |
| REQ-BMT-03 | Tap hotspot opens modal pre-selected | `BMT-E2E-04` (indirect) | ❌ FAILING (login fixture) |
| REQ-BMT-03 | No active points → diagram empty state | (E2E only) | ❌ UNTESTED |
| REQ-BMT-04 | View trend chart for a point | (E2E only) | ❌ UNTESTED |
| REQ-BMT-04 | Switch point via dropdown | (E2E only) | ❌ UNTESTED |
| REQ-BMT-04 | Chart empty state, no data | (E2E only) | ❌ UNTESTED |
| REQ-BMT-05 | History with multiple points/deltas | (E2E only) | ❌ UNTESTED |
| REQ-BMT-05 | Delta for deactivated point remains visible | (E2E only) | ❌ UNTESTED |
| REQ-BMT-05 | Empty state, no measurements | (E2E only) | ❌ UNTESTED |
| REQ-BMT-06 | Navigate to Measurements tab | `BMT-E2E-03/04` | ❌ FAILING (login fixture) |
| REQ-BMT-06 | Steps/Weight tabs unaffected (regression) | pre-existing `steps.spec.ts`/`weight.spec.ts` (not re-run this pass) | ➖ NOT RE-RUN |
| REQ-BMT-07 | Valid value passes server-side validation | `validateMeasurement` unit test (pure fn only; `addMeasurementEntries` itself never exercised by a passing test) | ⚠️ PARTIAL |
| REQ-BMT-07 | Out-of-range rejected at server action | same — pure fn compliant, action-level wiring unverified at runtime | ⚠️ PARTIAL |
| unified-tracking-api | Valid: steps + weight | `tracking.spec.ts` (pre-existing) | ✅ COMPLIANT |
| unified-tracking-api | Valid: steps only | `tracking.spec.ts` (pre-existing) | ✅ COMPLIANT |
| unified-tracking-api | Valid: weight only | `tracking.spec.ts` (pre-existing) | ✅ COMPLIANT |
| unified-tracking-api | Valid: measurements only | `REQ-UTA-BMT-01` | ✅ COMPLIANT (route-dispatch level; `addMeasurementEntries` mocked) |
| unified-tracking-api | Valid: steps + weight + measurements combined | (no test covers all 3 fields at once — only 2-of-3 combos exist) | ❌ UNTESTED |
| unified-tracking-api | Measurements alongside steps — all-or-nothing on failure | (no test; **code inspection confirms this is currently violated** — see CRITICAL-2) | ❌ FAILING |
| unified-tracking-api | Unknown pointSlug rejected (400) | `REQ-UTA-BMT-06` | ⚠️ PARTIAL (mocked; real detection logic + exact message text unverified) |
| unified-tracking-api | Out-of-range value rejected via API (400) | (covered indirectly by `REQ-UTA-BMT-06` mock pattern) | ⚠️ PARTIAL (mocked; message text diverges from spec) |

**Compliance summary**: 4/27 scenarios fully compliant at runtime, 5/27 partial, 1/27 actively failing (confirmed defect), 16/27 untested, 1/27 not re-run.

### Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| Domain types (`MeasurementPoint`, `BodyMeasurement`) | ✅ Implemented | Matches design Zod shapes exactly, including `.refine()` guards |
| `MEASUREMENT_POINTS_CATALOG` ranges | ✅ Implemented, matches deployed spec | Uses the final category-based ranges (trunk 30–200, limb 10–100) from `spec.md`, correctly superseding the earlier per-point ranges in `design.md` (design is stale, not a defect) |
| Mongoose sub-schemas + `ClientDocument` | ✅ Implemented | Matches design §3 |
| `setMeasurementPoints` | ✅ Implemented | Validates each entry + catalog-slug membership; no direct passing unit/E2E test exercises it |
| `addMeasurementEntries` | ✅ Implemented, upsert-by-date+slug logic correct on inspection | Loop validates+throws before any `doc.save()`, so a mid-batch failure does correctly leave the DB untouched for **that action alone** — batch atomicity within `addMeasurementEntries` is sound |
| `addMeasurementEntries` × `addDailyStep` cross-action atomicity | ❌ **Defect** | `route.ts` calls `addDailyStep` (persists immediately) **before** `addMeasurementEntries`; if measurements later fail validation, the already-persisted `steps` entry is not rolled back — contradicts the unified-tracking-api delta spec scenario "if either fails, neither is committed" |
| Roster query projection (`.select('-measurements -measurementPoints')`) | ✅ Implemented | Confirmed in `getClients`/`getClientsByCoachId` in `clientActions.ts` |
| API route `measurements[]` extension | ✅ Implemented, returns 400 (not 500) on validation error | Improves on design's speculative 500 |
| Error message text vs spec literal text | ⚠️ Diverges | Spec: `"Unknown measurement point: <slug>"` / `"<slug>: valor fuera del rango (<min>–<max> cm)"`. Actual: `Point "<slug>" is not configured for this client` / `Valor mínimo/máximo para <label>: <n> cm` |
| All 6 new UI components | ✅ Implemented (files exist, structurally match design props/behavior on read) | No runtime UI test currently passes to confirm interactive behavior |
| Dependency rule (`domain/` importing nothing from `infrastructure/`/`components/`) | ✅ Clean | Verified via grep across `src/domain/` — zero violations |

### Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| M1 fully embedded schema | ✅ Yes | |
| Static 8-point catalog, coach toggles subset | ✅ Yes | |
| Batch entry, single Server Action call | ✅ Yes | `doc.save()` called once after the validation loop |
| API extension non-breaking | ✅ Yes | Legacy steps/weight-only payloads still 200 (`REQ-UTA-BMT-05` passes) |
| Inline SVG body diagram, data-driven coords | ✅ Yes (per source read) | |
| `validateMeasurement` throws (per design §4.2) vs spec's literal `{ok,reason}` return-value language | ⚠️ Design/spec text mismatch | Implementation follows `design.md`'s "throws" contract, not `spec.md`'s literal discriminated-return description for REQ-BMT-07's scenario wording — functionally equivalent from the HTTP caller's perspective, but no test proves either contract at the unit level |
| Cross-action rollback for combined steps+measurements | ❌ Not implemented | No Mongoose session/transaction anywhere in `route.ts` or `clientActions.ts`; design.md does not mention this either — it's an emergent requirement from the `unified-tracking-api` delta spec that neither design nor apply addressed |

### TDD Compliance
| Check | Result | Details |
|-------|--------|---------|
| TDD Evidence reported | ✅ | `apply-progress.md` has a full "TDD Cycle Evidence" table for both batches |
| All tasks have tests | ⚠️ | Domain/service/API layers: yes. UI component tasks (5.1–5.7) rely solely on the currently-failing E2E spec — no component-level test exists |
| RED confirmed (tests exist) | ✅ | `tests/body-measurements.spec.ts`, `tests/unit/domain/services/bodyMeasurements.spec.ts`, `tests/unit/api/tracking.spec.ts` all exist |
| GREEN confirmed (tests pass) | ❌ | Vitest: 69/69 pass (GREEN confirmed for those). **Playwright: 0/5 pass — GREEN claimed in `apply-progress.md` for tasks 2.1–2.3, 4.1, 4.2, 5.1–5.7, 6.1–6.10 does NOT hold up under re-execution** |
| Triangulation adequate | ✅ | `bodyMeasurements.spec.ts` has 4+ cases per function; `tracking.spec.ts` BMT cases cover happy/error paths |
| Safety Net for modified files | ✅ | Full Vitest suite (69/69) run as regression safety net; 0 regressions detected |

**TDD Compliance**: 5/6 checks passed — the GREEN-confirmation check fails because the E2E suite's self-reported GREEN status is not reproducible at verify time.

---

### Test Layer Distribution
| Layer | Tests | Files | Tools |
|-------|-------|-------|-------|
| Unit | 69 | 6 | Vitest |
| Integration | 0 | 0 | not used for this change |
| E2E | 5 (all failing at runtime) | 1 (`tests/body-measurements.spec.ts`) | Playwright |
| **Total** | **74** | **7** | |

Note: 22 of the 69 unit tests are new to this change (16 in `bodyMeasurements.spec.ts` + 6 `REQ-UTA-BMT-*` cases in `tracking.spec.ts`); the remaining 47 are pre-existing regression safety-net tests, all still passing (0 regressions).

---

### Changed File Coverage

Coverage tool was not invoked in this pass (`vitest run --coverage` not run). Reported as: **Coverage analysis skipped — no coverage tool run this pass** (not a failure, informational only per strict-tdd-verify rules).

---

### Assertion Quality

Reviewed `tests/unit/domain/services/bodyMeasurements.spec.ts` and the new `REQ-UTA-BMT-*` cases in `tests/unit/api/tracking.spec.ts` line by line.

**Assertion quality**: ✅ All assertions verify real behavior — no tautologies, no ghost loops over possibly-empty collections (catalog is a fixed 8-item array), value assertions (not type-only) throughout, `groupByPoint`'s empty-array test has a companion non-empty test, and `getDeltaForLast` triangulates across 4 distinct cases with varying expected deltas (not all-same/trivial).

One structural caveat (not an assertion-quality defect per se): the `REQ-UTA-BMT-*` tests in `tracking.spec.ts` mock `addMeasurementEntries` entirely, so they prove the route's dispatch/response-shaping logic but not the mocked function's real behavior — see Spec Compliance Matrix PARTIAL entries above.

---

### Quality Metrics
**Linter**: ➖ Not run this pass (`yarn lint` / `next lint` requires project-root cwd per prior apply-phase note; not re-verified here)
**Type Checker**: ✅ 0 errors (`tsc --noEmit`, exit 0)

---

### Issues Found

**CRITICAL**:
1. **E2E suite fails at runtime (0/5 passing)** — `tests/body-measurements.spec.ts` fails on login (`coach@example.com`/`client@example.com` fixtures not seeded in this environment's DB) and on the API smoke test (403 instead of 200, invalid/missing API key). `apply-progress.md`'s TDD Cycle Evidence table claims GREEN for tasks 2.1–2.3, 4.1, 4.2, 5.1–5.7, 6.1–6.10 based on this suite — that claim does not reproduce. Per strict-TDD verify rules this must be flagged CRITICAL regardless of suspected root cause (missing test fixtures vs. real app defect) — this diagnosis is offered but does not downgrade the finding.
2. **Cross-action atomicity violation (confirmed by code inspection)** — in `src/app/api/clients/[clientId]/tracking/route.ts`, when a request includes both `steps` and `measurements`, `addDailyStep` persists immediately; if the subsequent `addMeasurementEntries` call throws (out-of-range/unknown slug), the response is `400` but the already-persisted `steps` entry is **not rolled back**. This directly contradicts the unified-tracking-api delta spec's scenario "if either fails, neither is committed." No transaction/session exists anywhere in the write path.
3. **Zero runtime-verified coverage of the real Server Action logic** — `setMeasurementPoints`, `addMeasurementEntries`, and `getMeasurementsByPoint` are never called by any test that currently passes without being mocked out; the only path that would exercise them for real (Playwright E2E) fails at the login step before reaching them. REQ-BMT-01, REQ-BMT-02, and REQ-BMT-07's actual persistence/validation-wiring behavior is therefore unverified at runtime, resting only on static code review (which found the logic correct on inspection, aside from finding #2).

**WARNING**:
1. Error message text for unknown-slug and out-of-range rejections diverges from the literal text specified in `spec.md`/the unified-tracking-api delta (`"Unknown measurement point: <slug>"`, `"<slug>: valor fuera del rango (<min>–<max> cm)"`) — actual messages are `Point "<slug>" is not configured for this client` and `Valor mínimo/máximo para <label>: <n> cm`. Functionally equivalent (still a 400 with a human-readable reason) but no test enforces the literal string, so a future spec-conformance check would fail on message text.
2. `apply-progress.md` reports "53/53 Vitest passing" in three separate places; the actual current count is 69/69 (still all passing, no regressions) — the self-reported number is stale.
3. No direct Zod-schema-level unit tests for `MeasurementPointSchema`/`BodyMeasurementSchema` (future-date `.refine()`, kebab-case slug regex, `maxCm > minCm` refine) — design.md listed these as target coverage but they were never added; only indirect coverage via the currently-failing E2E suite.
4. No test covers the combined `steps + weight + measurements` (all three fields in one POST) scenario explicitly called out in the unified-tracking-api delta spec — only 2-of-3 field combinations are tested.
5. `yarn lint` was not re-run this pass (prior apply-phase note said cwd issues prevented a clean run); not independently re-verified here.

**SUGGESTION**:
1. Add a DB-level integration test for `addMeasurementEntries`/`setMeasurementPoints` (e.g. via `mongodb-memory-server`) so the core persistence/validation-wiring logic has fast, environment-independent coverage instead of depending entirely on a live-DB E2E run.
2. Wrap the combined steps+measurements dispatch in a Mongoose session/transaction (or implement compensating rollback) to satisfy the delta spec's all-or-nothing scenario.
3. Provide a documented, disposable seed/fixture script (or `.env.test` + ephemeral test DB) specifically for Playwright E2E so verification does not depend on manually seeding a shared `.env.local`-configured database.

### Verdict
**FAIL**
The build and unit-test layers are clean (tsc 0 errors, Vitest 69/69), but the strict-TDD gate for this change — the Playwright E2E suite — fails 5/5 at runtime, a real cross-action atomicity defect was found via code inspection with zero covering test, and the core Server Action logic for measurement persistence/validation has no passing test that exercises it un-mocked. `apply-progress.md`'s GREEN claims for the E2E-covered tasks do not reproduce.
