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
- [ ] T2 Migrate the 4 table components to theme tokens (text, borders, hover, status badges readable on white). Route: delegated writer (4 non-trivial files).
- [ ] T3 Migrate raw inputs/selects/textareas to the `ui/Input` look (or `<Input>` where drop-in), `--radius-control`, token colors; restyle clients/new and coaches/new forms. Route: delegated writer (11 files).

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
