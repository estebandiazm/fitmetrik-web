# Proposal: Unified Dark Neumorphic Design System

## Intent

A prior partial rebrand (dark neumorphic direction, teal/cyan/blue replacing an older pink/purple brand) was left incomplete, so the app now runs **three disconnected visual paradigms** at once:

- **Coach dashboard** (`src/components/coach/*`, `src/app/(dashboard)/clients/**`) hardcodes hex values (`bg-[#0f172a]`, `border-[#1e293b]`) and never adopted the `globals.css` tokens.
- **Client portal** (`src/app/(client-portal)/**`) already consumes tokens (`bg-surface-dim`, `neu-btn-accent`) — so coach and client sit on entirely different styling systems, not just different intensities.
- **Auth pages** (`login`, `reset-password`, `update-password`) still render the OLD pink/purple gradient (`#ec4899 → #8b5cf6`) via CSS Modules plus a glassmorphism `.card`. `reset-password` is unstyled light-mode scaffolding matching nothing.

`globals.css` also carries stale Material-3 tokens still holding old pink/purple hex, a dead `--auth-*` namespace (zero consumers, grep-verified), and there are no shared `src/components/ui/` primitives — every page hand-rolls styling inline. This is inconsistent to use, hard to maintain, and a WCAG contrast risk.

**Stack correction**: `CLAUDE.md` and `openspec/config.yaml` claim "MUI 7" — this is FALSE. `package.json` has zero `@mui/*`/`@emotion/*` deps and zero imports (grep-verified). The app is 100% hand-rolled Tailwind + CSS Modules. This proposal records that correction.

## Scope

### In Scope
- Unify coach dashboard, client portal, and auth under one dark neumorphic ("soft UI") design system, same brand-hue family (teal `#2dd4bf` / cyan `#22d3ee` / blue `#3b82f6`).
- **Two treatment intensities** via scoped CSS: **Soft UI Evolution** (coach — denser, radius 8–12px, WCAG AA+ 4.5:1) and **Soft UI Pastel** (client + auth — warmer, radius 12–16px, dual soft shadow).
- Single `@theme` brand palette + semantic intensity tokens (`--radius-card`, `--shadow-card`, `--space-card-p`, `--transition-standard`) overridden per surface via `.surface-coach` / `.surface-client` classes applied once at each route group's `layout.tsx`.
- New `src/components/ui/` primitives: `Card` (from `GlassCard`), `Button` (from `NeonButton`, variants), `Table`/`Row`/`Cell` (extracted from `ClientRosterTable`), `Input`, `Badge`/`StatusPill`.
- Tokenize the 3 recharts components with an explicit `density` prop for chart-internal JS values CSS can't reach.
- Convert auth glassmorphism `.card` → solid `.neu-card`; rebuild `reset-password` from scratch on tokens.
- Move `src/app/creator` → `(dashboard)/creator` and `src/app/viewer` → `(client-portal)/viewer` (URL-neutral route-group moves) and add full nav chrome to both.
- Stale-token cleanup: audit each Material-3 token (`rg` per token), remove-if-unused or remap to brand family; delete dead `--auth-*` namespace except `--auth-error`/`--auth-success` folded into `@theme`.

### Out of Scope
- No MUI adoption — stay hand-rolled Tailwind + CSS Modules.
- No new brand hue/palette; teal/cyan/blue family stays.
- No third design paradigm (glassmorphism, flat/material) anywhere.
- No functional/data changes to coach-client relationships, invitations, or routing logic beyond the URL-neutral creator/viewer moves.

## Capabilities

### New Capabilities
- `ui-design-system`: unified dark-neumorphic token architecture (single brand-hue palette + semantic intensity tokens), the two surface treatments (Evolution/Pastel), and the shared `src/components/ui/` primitives.

### Modified Capabilities
- `ui-theme`: **superseded in full** — replaces the stale pink/purple glassmorphism + magenta-gradient button requirements with the neumorphic teal/cyan/blue token system.
- `coach-dashboard`: corrects **Req 14** (currently mandates "MUI 7 + `bg-[#0a0f1e]` palette") to require the token-based neumorphic system, no MUI. All other `coach-dashboard` requirements (data isolation, invitations, sortable/paginated roster) are unchanged.

## Approach

Token-first cascade so shared components inherit the right treatment for free:

1. **Phase 0 — Token foundation** (blocks all others): rewrite `globals.css` `@theme` + semantic tokens, `.neu-*` classes consume vars, apply `.surface-*` scope in each `layout.tsx`; stale-token + `--auth-*` cleanup.
2. **Phase 1 — Coach dashboard** onto tokens + Evolution treatment; reconcile stale `coach-dashboard` Req 14.
3. **Phase 2 — Recharts** tokenization + `density` prop (colors from `var(--token)`).
4. **Phase 3 — Client portal** Pastel treatment pass.
5. **Phase 4 — Auth unification**: extract shared `AuthShell`, `.card` → `.neu-card`, rebuild `reset-password`, remove pink/purple.
6. **Phase 5 — creator/viewer** route-group moves + nav chrome + final hardcoded-hex grep sweep.

`src/components/activity/*` are shared between coach client-detail and client-portal activity; they inherit treatment purely via CSS cascade (no forking) except the 3 charts' `density` prop.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/globals.css` | Modified | Token rewrite, stale/dead-token cleanup |
| `src/app/(dashboard)/layout.tsx`, `(client-portal)/layout.tsx` | Modified | Apply `.surface-*` scope class |
| `src/components/coach/**`, `(dashboard)/clients/**` | Modified | Hardcoded hex → tokens |
| `src/components/ui/` | New | Card, Button, Table, Input, Badge primitives |
| `src/components/activity/*` (3 charts) | Modified | `density` prop; token colors |
| `src/app/(auth)/**` | Modified | AuthShell, neu-card, rebuild reset-password |
| `src/app/creator`, `src/app/viewer` | Moved | Into route groups + nav chrome |
| `openspec/specs/ui-theme/spec.md`, `coach-dashboard/spec.md` (Req 14) | Modified | See Capabilities |
| `CLAUDE.md`, `openspec/config.yaml` | Modified | Correct false "MUI 7" stack claim |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Client portal regresses while re-pointing existing tokens | Med | Phase 3 is an isolated pass; portal already token-based, changes are treatment values not structure |
| Route-group moves change perceived UX (standalone tools → integrated) | Med | Explicitly accepted decision; URLs unchanged, only chrome added |
| Stale-token removal breaks an unnoticed consumer | Med | `rg "<token>" src` audit per token before removing vs. remapping |
| Chart `density` prop drifts from CSS intensities | Low | Colors stay `var(--token)`; density only covers JS-only values |
| Auth losing glassmorphism accent feels flat | Low | Accepted tradeoff for total paradigm consistency |

## Rollback Plan

Phases are independently revertible commits/PRs. Phase 0 is the only hard dependency; reverting it reverts the token layer and later phases cascade back. Old hardcoded-hex styling and CSS Modules remain in git history for per-phase revert. No data/schema/API changes, so rollback is presentation-only.

## Dependencies

- Phase 0 (token foundation) must land before Phases 1–5.
- No external dependencies; no new packages.

## Success Criteria

- [ ] Coach dashboard, client portal, and auth render one coherent neumorphic system in the teal/cyan/blue family.
- [ ] Zero hardcoded hex remains in `src/components/coach/**` and auth (final grep sweep clean).
- [ ] Coach surface meets WCAG AA (4.5:1) contrast.
- [ ] No glassmorphism, pink/purple, or MUI anywhere; `reset-password` matches the system.
- [ ] `creator`/`viewer` live under their route groups with full nav chrome; URLs unchanged.
- [ ] `ui-theme` and `coach-dashboard` Req 14 specs updated; `CLAUDE.md`/`config.yaml` stack corrected.
