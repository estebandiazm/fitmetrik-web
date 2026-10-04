# Light-mode tables & inputs fix

Locator: `odd/tasks/light-mode-tables-inputs.md` · Branch: `fix/light-mode-tables-inputs` (from `main` @ 5bdf93f)

## Objective
Make every table and form control readable and on-style in light mode for both coach and client views.

## Problem / Why
After the blister-adherence redesign (#39, #40), global tokens and layouts are theme-aware, but several components still hardcode dark-theme colors (`text-white`, `text-gray-400`, `border-white/5`, `bg-white/5`, `placeholder-gray-400`, `focus:border-blue-400`). In light mode this renders pale text on white panels. Most raw inputs use `rounded-full` instead of the design's `--radius-control`.

## Scope
- Shared `src/components/ui/Table.tsx`
- Tables: `activity/RecentRecords.tsx`, `activity/WeightRecentRecords.tsx`, `activity/MeasurementHistory.tsx`, `food-table/FoodTable.tsx`
- Inputs/selects/textareas: `client/DailyStepsModal.tsx`, `coach/StepGoalEditor.tsx`, `coach/WeightGoalEditor.tsx`, `coach/MeasurementPointsEditor.tsx`, `creator/PlanCard.tsx`, `creator/SavePlanModal.tsx`, `creator/Creator.tsx`, `activity/AddMeasurementModal.tsx`, `activity/MeasurementTrendsChart.tsx`, `(dashboard)/clients/new/page.tsx`, `(dashboard)/coaches/new/page.tsx`

Out of scope: login CSS module inputs, non-table legacy classes elsewhere, layout/structure changes.

## Constraints
- Target style = `ui/Input.tsx`: `rounded-[var(--radius-control)] border border-border bg-panel text-text-primary placeholder:text-text-faint focus:border-accent-teal focus:ring-3 focus:ring-accent-teal/20`.
- Text tokens: `text-text-primary`, `text-text-muted`, `text-text-faint`, `text-danger`; borders `border-border` / `border-row-border`; hover `hover:bg-row-border`.
- Pills (`rounded-full`) stay only for badges, avatars, progress bars.
- No behavior changes.

## Tasks
- [x] T1 Shared Table: `text-text-primary` on `<table>`, body rows use `border-row-border`. Route: inline-in-writer.
- [x] T2 Migrate the 4 table components to theme tokens (text, borders, hover, status badges readable on white). Route: delegated writer (4 non-trivial files).
- [x] T3 Migrate raw inputs/selects/textareas to the `ui/Input` look (or `<Input>` where drop-in), `--radius-control`, token colors; restyle clients/new and coaches/new forms. Route: delegated writer (11 files).

- [x] T4 (user-approved scope expansion 2026-10-03: pay pre-existing debt flagged by GGA before committing T2/T3) Extract business logic from table components into `src/domain/services/` with Vitest specs in `tests/unit/domain/services/` (RED→GREEN): `getStatusBadge` step thresholds (RecentRecords), delta + sort logic (MeasurementHistory), single shared `formatUTCDate` (RecentRecords + WeightRecentRecords). Drop unneeded `'use client'`. Commit services+specs first, then T2 components consuming them. Route: delegated writer.
- [x] T5 Add `ds-bundle/**` (and `.ds-sync/**`) to ESLint ignores so `yarn lint` passes. Route: same writer, mechanical.
- [x] T6 (user-approved 2026-10-03) Parse daily record dates in local time: `parseLocalISODate` (from parts, not `new Date('YYYY-MM-DD')`), `toLocalISODate` replaces UTC `todayISO()` in both modals, `buildMeasurementSeries` keys by local day. Specs pinned to America/Bogota (RED→GREEN). No data migration; server actions/persistence unchanged. Route: same delegated writer.

## Acceptance criteria
- `rg 'text-white|text-gray-[1-5]00|placeholder-gray|white/(5|10|20)|focus:border-blue|on-surface'` returns no hits in scoped files (except text on solid accent backgrounds).
- No raw `<input|select|textarea>` in scope uses `rounded-full`.
- `yarn lint` and `npx tsc --noEmit` pass.

## Checks
- Test-first exception: pure class/token changes; no meaningful runnable RED (no visual regression suite). Structural checks: rg sweep above, lint, tsc.

## Delivery
Forecast ~250–350 authored lines. Strategy: ask-on-risk. One work-unit commit per task.

## Progress
- Created 2026-10-03. Engram mirror: PENDING (mem_save failed: multiple active runtime sessions). Route trigger: writer trigger (2+ non-trivial files) → delegated writer for T1–T3.
- T1 done: commit f182c55 (`ui/Table.tsx`: `text-text-primary` on table, body rows `border-row-border`, header keeps `border-border`).
- T2 done: 4 table components migrated to tokens; step status badges follow `ui/Badge` tones (teal/amber tint + `text-text-primary`, danger tint + `text-danger`); measurement deltas `text-danger`/`text-success`. Commit: BLOCKED — GGA pre-commit review failed twice on pre-existing violations only (business logic in MeasurementHistory/RecentRecords, PascalCase filenames, duplicated formatUTCDate); reviewer stated the diff itself is clean. Changes staged, uncommitted.
- T3 implemented (11 files), uncommitted pending the T2 gate decision. Checks: rg sweep 0 hits, no rounded-full on raw controls, scoped eslint clean, `npx tsc --noEmit` exit 0; full `yarn lint` fails only on gitignored `ds-bundle/_vendor/react.js` (pre-existing).
- T5 done: `ds-bundle/**`, `.ds-sync/**` added to ESLint global ignores (commit 72f2d08).
- T4a done: domain services `dailyRecords.ts` (formatUTCDate, sortRecordsByDateDesc), `stepGoalStatus.ts` (getStepGoalStatus → goal-met|good|low), `bodyMeasurements.ts` (+buildMeasurementHistory, formatMeasurementDate) with Vitest specs. RED observed (missing modules / ReferenceError, 7 failing + 2 unloadable files), GREEN 182/182. Commit b5bc0c3.
- T2/T4b done: RecentRecords/WeightRecentRecords/MeasurementHistory consume domain services (semantic step status → Badge token classes; shared formatUTCDate/sort; buildMeasurementHistory), small presentational row/table subcomponents, `use client` dropped from MeasurementHistory (only parent ActivityPageClient is a client component). FoodTable already had no `use client`; FoodTable uses `import type` via alias. GGA attempt 1 failed (components→domain/services per §2.3, PascalCase names, >20-line bodies); bodies split further + index-safe keys; attempt 2 PASSED. Commit c5161b4.
- T3 committed: 11 form-control files (commit: see `git log`, `🐛fix: align form controls with design system radius and tokens`).
- T3 GGA attempt 1 FAILED (pre-existing): components import app/actions + domain/services (§2.3), inline logic (Creator plan generation dup, DailyStepsModal/goal editors validation, mergeWithCatalog, chart series), >20-line handlers, Next sync searchParams, PascalCase names, chart dark-only colors. Fixed in scope: new `activityInputs.ts` (parseDailyStepInput/parseStepGoal/parseTargetWeight), `dietPlanDrafts.ts` (buildDietPlansFromDrafts/getDraftPlanLabel), `bodyMeasurements.ts` (+mergeWithCatalog, buildMeasurementSeries, injectable `now` on isFutureDate) with specs; RED observed (2 missing modules + 5 ReferenceErrors), GREEN 202/202.
- T3 domain commit dc66383 (GGA PASSED; flagged pre-existing UTC/local date-only parsing in parseDailyStepInput and buildMeasurementSeries — preserved verbatim per "no behavior changes", follow-up). Components now consume the services; chart grid/axis/tooltip use theme vars; clients/new + coaches/new await async `searchParams` (Next 16); modal handlers split (<20-line bodies).
- T3 GGA attempt 2 FAILED: PlanCard title logic, Creator `coachId: ''`, AddMeasurementModal inline date parsing, English Week/Month in a Spanish chart. Fixed: `getDraftCardTitle` + `parseDateInput` (domain, specs, RED→GREEN 205/205), Creator passes `coachId` to the localStorage client, chart toggle Semana/Mes. Date semantics preserved (UTC parse of date-only string → local midnight); off-by-one west of UTC left as a follow-up needing a product decision.
- T3 GGA attempt 3 FAILED (max reached, NOT committed, all T3 changes staged): (1) ready-count still used `new Date(date)` — fixed post-attempt, staged; (2) `parseDateInput` keeps the pre-existing UTC-parse→local-midnight rule that saves the previous day west of UTC (also `todayISO()` UTC default in both modals). BLOCKED: fixing (2) changes persisted-date semantics → needs user decision. Next: decide (2), then retry `🐛fix: align form controls with design system radius and tokens`.
- T6 domain: `localDates.ts` (`parseLocalISODate`, `toLocalISODate`) + `buildMeasurementSeries` local-day keys; spec `localDates.spec.ts` pins TZ=America/Bogota. RED: missing module, then UTC-vs-local bucketing case failed (1/7); GREEN 212/212. Commit 497ccac (GGA PASSED).
- T6 wiring (in T3 commit): `parseDailyStepInput` and AddMeasurementModal use `parseLocalISODate`; both modals default/max the date input with `toLocalISODate()`; temporary `parseDateInput` removed; spec TZ restore deletes `TZ` when originally unset. Unit 211/211, lint 0, tsc 0.
- T3 GGA retry 1 (post-T6) FAILED: components→app/actions, components→domain/services, Creator→context (pre-existing §2.3 debt), PlanDraft type in a component, camelCase service names, createDefaultPlan defaults + deactivation rule in components, SavePlanModal handleSave >20 lines. Fixed in scope: `PlanDraft` + `createDefaultPlanDraft` in `dietPlanDrafts.ts`; `needsDeactivationConfirmation` + `countEntriesForPoint` in `bodyMeasurements.ts` (RED: 5 "is not a function" → GREEN 216/216); handleSave shortened.
- T3 committed eed0e54 (GGA PASSED on retry 2 post-T6). Follow-ups flagged by GGA (pre-existing, not fixed): empty date input → Invalid Date passes `parseDailyStepInput`; `parseInt` accepts partial input (`10abc`); AGENTS.md §2.3 table vs §6.4 / Server Action imports; PascalCase filenames; uncleared `setTimeout`s in editors/modals.
