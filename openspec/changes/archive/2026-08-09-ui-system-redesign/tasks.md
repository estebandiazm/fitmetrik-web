# Tasks: Unified Dark Neumorphic Design System

**Change**: `ui-system-redesign`
**Strict TDD note**: repo default targets `domain/services/`; this change adds zero new business logic (purely presentational). No per-file RED/GREEN unit tests apply. The one true threat-matrix item — the creator/viewer route move — gets a baseline-then-regression Playwright test (5.1 write-first → 5.6 re-run post-move). Otherwise the verification gate is a full Playwright regression run per phase (see Verification section) plus the final hardcoded-hex grep sweep and a contrast check.

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1200–1800 total across 6 phases; per-phase range 60–600 |
| 400-line budget risk | Medium — only Phase 1 (coach hex→token migration across 8+ files + 5 new `ui/` primitives) is likely to approach/exceed 400 lines in one PR |
| Chained PRs recommended | No — each phase already ships as its own independently revertible PR per the proposal's rollback plan; session's nominal budget is 800 lines/phase (explicit user decision, solo project) |
| Suggested split | Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 (sequential, Phase 0 hard-blocks 1–5) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — only revisit if Phase 1 overruns 800 lines during apply (optional internal split: 1a primitives, 1b hex migration) |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 0 | Token foundation (`globals.css`, 3 layouts, Alert) | PR 1 | `yarn playwright test tests/auth.spec.ts tests/invite.spec.ts` | Load `/clients` + `/login`, confirm cascade renders, no CSS errors | Revert `globals.css`/layout class diffs; old hardcoded hex still renders unaffected |
| 1 | Coach dashboard hex→token + `ui/` primitives | PR 2 | `yarn playwright test tests/invite.spec.ts` | Navigate `/clients` → client detail, confirm cards/table/inputs render | Revert coach component + `ui/` primitive diffs independently of Phase 0 |
| 2 | Recharts tokenization + `density` prop | PR 3 | `yarn playwright test tests/invite.spec.ts` | Open client detail, confirm `TrendsChart`/`WeightTrendsChart` render compact, colors token-based | Revert 3 chart files + 1 wiring line in `clients/[clientId]/page.tsx` |
| 3 | Client portal Pastel pass | PR 4 | `yarn playwright test` (full) | Open `/activity` as client, visual QA cascade | Revert TopAppBar/activity file diffs; portal already token-based, low blast radius |
| 4 | Auth unification (`AuthShell`, reset-password rebuild) | PR 5 | `yarn playwright test tests/auth.spec.ts` | Login, reset-password, update-password flows end-to-end | Revert `(auth)/**` diffs; auth routes independent of dashboard/portal |
| 5 | creator/viewer route-group move + nav chrome + cleanup | PR 6 | `yarn playwright test tests/route-move.spec.ts tests/auth.spec.ts tests/invite.spec.ts` | Authed nav `/clients`→`/creator`→back; unauthed hit `/viewer` → redirect | Revert file moves (git tracks renames) + doc corrections independently |

---

## Phase 0: Token Foundation (blocks all other phases)

- [x] 0.1 `src/app/globals.css` — confirm/keep `@theme` primary `#2dd4bf`/secondary `#22d3ee`/tertiary `#3b82f6`; delete stale tokens: `surface-tint`, `primary-dim`, `primary-fixed(-dim)`, `on-primary-fixed(-variant)`, `inverse-primary`, `tertiary-container`, `on-tertiary(-container)`, `tertiary-fixed(-dim)`, `on-tertiary-fixed(-variant)` (zero consumers, verified). Keep `--color-tertiary-dim` (`TopAppBar.tsx:25`).
- [x] 0.2 `globals.css` — add `--color-success:#46d17f`, `--color-on-success:#00391c`, `--color-on-surface-muted:#94a3b8` (fixes WCAG AA fail: `#64748b`=3.7:1, `#475569`≈2.3:1 on `#141928`).
- [x] 0.3 `globals.css` — delete dead `--auth-bg/-surface/-surface-hover/-accent/-accent-hover/-text-primary/-text-secondary/-text-muted/-border` namespace (zero consumers, verified).
- [x] 0.4 `globals.css` — add plain `:root` intensity tokens: `--radius-card:12px`, `--radius-control:8px`, `--shadow-card`, `--space-card-p:1rem`, `--transition-standard:220ms ease`, `--surface-border:rgba(255,255,255,.05)`.
- [x] 0.5 `globals.css` — add `.surface-coach` override block: radius-card 10px, radius-control 8px, flatter/deeper shadow, space-card-p .75rem, transition 200ms, surface-border .06.
- [x] 0.6 `globals.css` — add `.surface-client` override block: radius-card 16px, radius-control 12px, dual-soft shadow, space-card-p 1.5rem, transition 280ms, surface-border .04.
- [x] 0.7 `globals.css` — rewrite `.neu-card`/`.neu-btn`/`.neu-btn-accent`/`.neu-inset` to consume `var(--radius-card)`, `var(--shadow-card)`, add `border:1px solid var(--surface-border)`, `transition:var(--transition-standard)`.
- [x] 0.8 `src/app/(dashboard)/layout.tsx` — apply `.surface-coach` on the root element.
- [x] 0.9 `src/app/(client-portal)/layout.tsx` and `src/app/(auth)/layout.tsx` — apply `.surface-client` on each root element.
- [x] 0.10 `src/components/ui/Alert.module.css` — `.error`/`.success` use `var(--color-error|success)` + `color-mix(in srgb, var(--color-*) 12%, transparent)` bg / 20% border, dropping `--auth-error/-success-bg` refs; also tokenize `.info` (`#93c5fd`, `rgba(59,130,246,...)`) → `var(--color-tertiary)`.
- [x] 0.11 Verify: `rg "auth-bg|auth-surface|auth-accent|auth-text|auth-border" src/app/globals.css` and `rg "surface-tint|primary-dim|primary-fixed|inverse-primary|tertiary-container|tertiary-fixed" src/app/globals.css` both zero matches; `rg "tertiary-dim" src` still shows the `TopAppBar.tsx` consumer.

## Phase 1: Coach Dashboard onto Tokens

- [x] 1.1 New `src/components/ui/Input.tsx` — token surface + `--radius-control` + `neu-inset`, Server Component.
- [x] 1.2 New `src/components/ui/Card.tsx` (from `GlassCard.tsx`) — add `padding?:'default'|'none'`, `as` tag; drop fixed `rounded-2xl`; update call sites (`WeightRecentRecords`, `WeightTrendsChart`, `PlanSectionCard`, etc.).
- [x] 1.3 New `src/components/ui/Button.tsx` (from `NeonButton.tsx`) — add `variant:'accent'|'surface'|'ghost'`, `size:'sm'|'md'`, mapped to `neu-btn-accent`/`neu-btn`.
- [x] 1.4 New `src/components/ui/Table.tsx` + `TableHead`/`TableRow`/`TableCell` — extracted from `ClientRosterTable.tsx` lines 76–149; tokenize `bg-[#0f172a]`/`border-[#1e293b]` → `neu-card`+`var(--surface-border)`.
- [x] 1.5 New `src/components/ui/Badge.tsx`/`StatusPill.tsx` — extracted from `ClientRosterTable.getPlanStatus` pill (line 127); token colors.
- [x] 1.6 `src/components/coach/CoachHeader.tsx` — `bg-[#0f172a]`/`border-[#1e293b]` → tokens; `text-[#64748b]` (coachEmail, line 31) → `text-on-surface-muted` (WCAG fix); swap search input for `Input`.
- [x] 1.7 `src/components/coach/ClientRosterTable.tsx` — consume `Table*`/`Badge` primitives; `text-[#64748b]` (header row, line 84) and `text-[#475569]` (sort indicator line 71, empty-state line 102) → `text-on-surface-muted`; remaining hex (`#1e293b`, `#2dd4bf`, `#94a3b8`, `#5eead4`) → tokens.
- [x] 1.8 `src/components/coach/TablePagination.tsx` — hex → tokens.
- [x] 1.9 `src/components/coach/CoachSidebar.tsx` — `bg-[#0f172a]`/`border-[#1e293b]`/`#2dd4bf`/`#94a3b8`/`#0d9488` → tokens; active-nav state via token utilities.
- [x] 1.10 `src/components/coach/MeasurementPointsEditor.tsx`, `StepGoalEditor.tsx`, `WeightGoalEditor.tsx` — hex → tokens. (Verification-only: `rg -o '#[0-9a-fA-F]{6}'` on all 3 files returns zero matches; they already use Tailwind named colors (`red-400`, `green-400`, etc.) and token-consuming `neu-inset`/`neu-btn-accent` classes, not hardcoded hex. No code change required or made.)
- [x] 1.11 `src/app/(dashboard)/clients/[clientId]/page.tsx` — replace ~10 `bg-[#0f172a] border-[#1e293b] rounded-xl p-6` + gradient wrappers with `<Card>`; `bg-[#0a0f1e]` → `bg-surface-dim`; remaining muted hex → `text-on-surface-muted` (16 hex occurrences total, verified).
- [x] 1.12 `src/app/(dashboard)/clients/page.tsx` — hex sweep + tokenize.

## Phase 2: Recharts Tokenization + `density` Prop

- [x] 2.1 `src/components/activity/TrendsChart.tsx` — add `density?:'compact'|'spacious'` (default `spacious`); `#2dd4bf`/`#10b981`→`var(--color-primary)`, `#3b82f6`→`var(--color-tertiary)`, tooltip border same; density drives bar/tooltip radius (4px/8px), font (0.7rem/0.85rem), height (h-64/h-80).
- [x] 2.2 `src/components/activity/WeightTrendsChart.tsx` — same `density` prop + token colors.
- [x] 2.3 `src/components/activity/MeasurementTrendsChart.tsx` — same `density` prop + token colors (prop plumbed for API symmetry; no coach call site renders this chart — it only ever runs `spacious` via client-portal `ActivityPageClient`).
- [x] 2.4 `src/app/(dashboard)/clients/[clientId]/page.tsx` — wire `density="compact"` into `TrendsChart` and `WeightTrendsChart` only (this page does not render `MeasurementTrendsChart`).
- [x] 2.5 Verify `src/components/activity/ActivityPageClient.tsx` passes no explicit `density` for any of the 3 charts (defaults to `spacious`) — verification only, no code change expected.

## Phase 3: Client Portal Pastel Pass

- [x] 3.1 Visual QA `src/components/activity/{SummaryCard,RecentRecords,WeightRecentRecords,BodyDiagram,BodyDiagramSilhouette,MeasurementHistory,AddMeasurementModal}.tsx` under `.surface-client` post-Phase-1 `Card` swap — mostly zero code change (already token-based); one exception found and deferred, see note below.
- [x] 3.2 `src/app/globals.css` — rename `--color-accent-pink` (currently `#2dd4bf`, misleadingly named) to a brand-semantic name (`--color-accent`) for naming clarity; update the 2 consumers.
- [x] 3.3 `src/components/layout/TopAppBar.tsx` — update `text-accent-pink`/`border-accent-pink` class usages to the renamed token from 3.2.
- [x] 3.4 `src/app/(client-portal)/dashboard/page.tsx`, `activity/page.tsx` — grep + tokenize any remaining hardcoded hex. (Verification-only: zero hex found across `src/components/dashboard`, `src/components/client`, `src/components/layout`, `src/app/(client-portal)`. No code change required or made.)

## Phase 4: Auth Unification

- [x] 4.1 New `src/components/auth/AuthShell.tsx` — extract shared blob+card markup (login/update-password `.module.css` are byte-identical); Server Component wrapping children in `.neu-card`.
- [x] 4.2 `src/app/(auth)/login/page.tsx` + `_LoginForm.tsx` — replace glass `.card`/`login.module.css` wrapper with `AuthShell`; remove `backdrop-filter:blur(16px)`.
- [x] 4.3 `src/app/(auth)/login/login.module.css` — remove pink/purple (`#ec4899`,`#8b5cf6`,`#f472b6`) blob gradients → teal/blue tokens.
- [x] 4.4 `src/app/(auth)/update-password/page.tsx` + `update-password.module.css` — mirror 4.2/4.3 (byte-identical source).
- [x] 4.5 `src/app/(auth)/reset-password/page.tsx` — full rebuild: `AuthShell` + tokens + `Input` + `Button` + `Alert`, replacing light-mode Tailwind scaffolding; fix Next.js 15 bug — type `searchParams` as `Promise` and `await` it.
- [x] 4.6 `src/app/(auth)/reset-password/actions.ts` — adjust if the page rebuild changes the `searchParams`/form shape.
- [x] 4.7 Verify all 3 auth pages consume `Alert` from `src/components/ui/Alert.tsx` (updated in 0.10) consistently.

## Phase 5: creator/viewer Route-Group Move + Final Cleanup

- [x] 5.1 **[Baseline]** Write `tests/route-move.spec.ts` asserting `/creator` and `/viewer` resolve 200 for authed users and redirect to `/login` unauthed — run pre-move to confirm current baseline passes.
- [x] 5.2 Move `src/app/creator/page.tsx` → `src/app/(dashboard)/creator/page.tsx`; update the `../../components/creator/Creator` relative import.
- [x] 5.3 Move `src/app/viewer/page.tsx` → `src/app/(client-portal)/viewer/page.tsx`; update relative imports.
- [x] 5.4 Verify `(dashboard)/layout.tsx` chrome (CoachHeader+CoachSidebar) now wraps `/creator` with no per-page duplication.
- [x] 5.5 Verify `(client-portal)/layout.tsx` chrome (TopAppBar+BottomNavBar) now wraps `/viewer` with no per-page duplication.
- [x] 5.6 **[Regression]** Re-run `tests/route-move.spec.ts` post-move — must still pass (proves URL-neutral move).
- [x] 5.7 Delete now-empty `src/app/creator/` and `src/app/viewer/` directories.
- [x] 5.8 Final grep sweep: `rg -o '#[0-9a-fA-F]{6}' src/components src/app` — zero matches outside `src/app/globals.css`; fix any stragglers.
- [x] 5.9 `CLAUDE.md` — correct stack table `ui: MUI 7 · Tailwind CSS v4` → `ui: Tailwind CSS v4 (hand-rolled, no MUI)`.
- [x] 5.10 `openspec/config.yaml` — correct `ui: MUI 7 + Tailwind CSS v4` → `ui: Tailwind CSS v4 (hand-rolled, no MUI)`.

## Verification (run after each phase, and once at the end)

- [x] V.1 `yarn playwright test` full regression run — the TDD-equivalent gate for this presentational change (no new `domain/services/` logic exists to unit test).
- [x] V.2 Contrast check on `(dashboard)` + `(auth)` routes confirming `on-surface-muted` (`#94a3b8`) resolves ≥4.5:1 — manual or axe-core via Playwright (open question from design.md; flag as follow-up if not automated this change).
- [x] V.3 `tsc --noEmit` clean; `yarn lint` clean.
