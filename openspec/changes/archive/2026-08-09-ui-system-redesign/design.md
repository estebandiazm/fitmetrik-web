# Design: Unified Dark Neumorphic Design System

## Technical Approach

Token-first CSS cascade. One `@theme` brand palette + a new set of plain
`:root` semantic "intensity" custom properties, overridden per route group via
`.surface-coach` / `.surface-client` scope classes. `.neu-*` classes and shared
`src/components/activity/*` inherit the correct treatment for free — the only
JS-reachable exception is the 3 recharts components (a `density` prop). New
`src/components/ui/` primitives replace inline-styled ad-hoc markup. Implements
proposal Phases 0–5.

## Architecture Decisions

### Decision: Semantic tokens as `:root` custom props, NOT inside `@theme`
**Choice**: Brand hues stay in `@theme` (compile-time utilities); intensity
tokens (`--radius-card`, `--shadow-card`, `--space-card-p`,
`--transition-standard`, `--radius-control`) live in plain `:root` + `.surface-*`.
**Alternatives**: All in `@theme`; per-surface duplicated palettes.
**Rationale**: `@theme` generates utilities at build time and does not support
runtime cascade override per scope. Intensity values must resolve through the
DOM cascade from a scope class, which requires plain custom properties.

### Decision: Non-shadow shape cue (1px border) on both surfaces
**Choice**: Add `border: 1px solid rgba(255,255,255,0.06)` (coach) /
`rgba(255,255,255,0.04)` (client) to `.neu-card`/`.neu-btn`.
**Rationale**: Neumorphic edges are shadow-defined and vanish under
`prefers-contrast: more` / `forced-colors`. A hairline border is a
contrast-independent boundary. Matches existing `border-white/10` patterns.

### Decision: `color-mix()` for Alert translucent backgrounds
**Choice**: Fold `--auth-error`/`--auth-success` into `@theme` as
`--color-success`/`--color-on-success`; derive Alert bg/border via `color-mix`.
**Rationale**: Removes the entire `--auth-*` namespace without adding `*-bg`
tokens; `color-mix` is supported by Tailwind v4's target browsers.

### Decision: Delete all stale Material-3 tokens (audit result below)
`rg` confirmed every listed stale token has **zero consumers outside
globals.css** → delete, no remap needed. `--color-tertiary-dim` (#22d3ee, NOT
stale) is consumed by `TopAppBar.tsx:25` → keep.

## Token System

### Stale-token audit (`rg "<token>" src`, run this session)
| Token | Consumers | Action |
|---|---|---|
| `surface-tint`, `primary-dim`, `primary-fixed(-dim)`, `on-primary-fixed(-variant)`, `inverse-primary`, `tertiary-container`, `on-tertiary(-container)`, `tertiary-fixed(-dim)`, `on-tertiary-fixed(-variant)` | globals.css only | **Delete** |
| `--color-tertiary-dim` #22d3ee | `TopAppBar.tsx:25` | Keep (already cyan) |
| `--auth-bg/-surface/-surface-hover/-accent/-accent-hover/-text-*/-border` | none (grep-verified) | **Delete** |
| `--auth-error/-error-bg/-success/-success-bg` | `Alert.module.css` | **Rename** → `@theme` |

### Intensity tokens (current → proposed)
`.neu-card` today: `border-radius:1.25rem`; shadow `6/6/20 rgba(0,0,0,.35), -6/-6/20 rgba(255,255,255,.02)`.

| Token | `:root` base | `.surface-coach` (Evolution) | `.surface-client` (Pastel) |
|---|---|---|---|
| `--radius-card` | 12px | 10px | 16px |
| `--radius-control` | 8px | 8px | 12px |
| `--shadow-card` | `6px 6px 20px rgba(0,0,0,.35), -6px -6px 20px rgba(255,255,255,.02)` | `4px 4px 12px rgba(0,0,0,.5), -1px -1px 2px rgba(255,255,255,.03)` (flatter, deeper) | `-5px -5px 15px rgba(255,255,255,.03), 5px 5px 15px rgba(0,0,0,.4)` (dual soft) |
| `--space-card-p` | 1rem | 0.75rem | 1.5rem |
| `--transition-standard` | 220ms ease | 200ms ease | 280ms ease |
| `--surface-border` | `rgba(255,255,255,.05)` | `rgba(255,255,255,.06)` | `rgba(255,255,255,.04)` |

`.neu-card/.neu-btn/.neu-btn-accent/.neu-inset` rewritten to consume
`var(--radius-card)`, `var(--shadow-card)`, `border:1px solid var(--surface-border)`,
`transition: var(--transition-standard)`.

New `@theme`: `--color-success:#46d17f`, `--color-on-success:#00391c`
(brightness-matched to `--color-error:#ff716c`/`--color-on-error:#490006`).

### Contrast facts (computed this session)
| Pair | Ratio | Verdict |
|---|---|---|
| `#e2e4f6` on `#141928` | 13.9:1 | AAA |
| `#e2e4f6` on `#0a0e1a` | 15.3:1 | AAA |
| `#94a3b8` on `#141928` | 6.8:1 | AA |
| **`#64748b` on `#141928`** | **3.7:1** | **FAIL AA** |
| `#475569` on `#141928` | ~2.3:1 | FAIL |

**Action**: replace hardcoded muted `text-[#64748b]`/`text-[#475569]`
(CoachHeader email, ClientRosterTable headers/empty-state, clients page) with a
token meeting 4.5:1 — introduce `--color-on-surface-muted:#94a3b8`.

## Component Changes

| Component | Current → Target |
|---|---|
| `GlassCard.tsx`→`Card.tsx` | Add `padding?: 'default'|'none'`, `as` tag. Server Component. Keep `neu-card`; drop fixed `rounded-2xl` (radius now token). |
| `NeonButton.tsx`→`Button.tsx` | Add `variant: 'accent'|'surface'|'ghost'`, `size: 'sm'|'md'`. Maps to `neu-btn-accent`/`neu-btn`. Client (has handlers). |
| `Table*` (new) | Extract `Table/TableHead/TableRow/TableCell` from `ClientRosterTable` markup (lines 76–149); tokenize `#0f172a`/`#1e293b`→`neu-card`+border. Server Components; roster stays Client (sort state). |
| `Input.tsx` (new) | Token surface + `--radius-control` + `neu-inset`; replaces CoachHeader search + reset-password inputs. Server Component. |
| `Badge.tsx`/`StatusPill.tsx` (new) | From roster `getPlanStatus` pill (line 127); token colors. Server. |
| `clients/[clientId]/page.tsx` | Replace ~10 `bg-[#0f172a] border-[#1e293b] rounded-xl p-6` + gradient wrappers with `<Card>`; `bg-[#0a0f1e]`→`bg-surface-dim`; muted hex→token. |
| `CoachHeader/CoachSidebar` | Hex→tokens; `#64748b`→`on-surface-muted`; use `Input`. |
| Auth `.module.css` (login≡update-password, byte-identical) | Extract `AuthShell.tsx` (blobs+card). `.card` glass (`backdrop-filter: blur(16px)`)→`neu-card`. Remove pink/purple (`#ec4899/#8b5cf6/#f472b6`)→teal/blue. |
| `reset-password/page.tsx` | Full rebuild: light-mode Tailwind → `AuthShell`+tokens+`Input`+`Button`+`Alert`. Note: `searchParams` typed sync but Next 15 wants `Promise` — align to `await props.searchParams`. |
| `Alert.module.css` | `.error/.success`: `color: var(--color-error|success)`; `background: color-mix(in srgb, var(--color-*) 12%, transparent)`; border 20%. |

### Recharts `density` prop
Add `density?: 'compact' | 'spacious'` (default `'spacious'`). Convert literal
fills to tokens: `#2dd4bf`→`var(--color-primary)`, `#3b82f6`→`var(--color-tertiary)`,
`#10b981`→`var(--color-primary)`, tooltip border to same.

| Value | Bar/tooltip radius | Font | Height |
|---|---|---|---|
| `compact` | 4px | 0.7rem | h-64 |
| `spacious` | 8px | 0.85rem | h-80 |

Wire `density="compact"` from `clients/[clientId]/page.tsx` (TrendsChart,
WeightTrendsChart only). `ActivityPageClient.tsx` uses default `spacious` (all 3).
**Note**: coach detail has NO MeasurementTrendsChart — it only renders spacious.

## Shared Component Strategy

`activity/*` (SummaryCard, RecentRecords, WeightRecentRecords, BodyDiagram*,
MeasurementHistory, AddMeasurementModal) need zero code change ONCE
`clients/[clientId]/page.tsx` stops wrapping them in hardcoded `bg-[#0f172a]`
divs — replace those with `Card` so the `.surface-coach` cascade reaches them.
The charts are the only forked concern (density).

## Migration Sequencing (informs tasks, not a replacement)

Phase 0 (globals.css tokens + `.surface-*` in 3 layouts + border cue +
stale/`--auth-*` cleanup + Alert) hard-blocks 1–5. Then: 1 coach hex→token +
Card wrappers, 2 charts, 3 client pass, 4 auth (AuthShell + reset-password), 5
creator/viewer moves + nav. Each phase is an independent revertible PR.

### Route-move (threat check)
`src/app/creator`→`(dashboard)/creator`, `viewer`→`(client-portal)/viewer`.
Route groups `()` are URL-path-neutral → `/creator`,`/viewer` unchanged
(verified). Both pages already enforce `authProvider.getSession()`; no auth
boundary change. Add `CoachHeader+CoachSidebar` to creator, `TopAppBar+BottomNavBar`
to viewer — cleanest via a nested `layout.tsx` per group so nav isn't
duplicated per page (mirrors how client-detail currently inlines chrome).

## Threat Matrix

N/A for shell/subprocess/PR automation/executable classification. Only routing
changes (creator/viewer): URL-neutral route-group moves, no new auth surface,
both routes already session-gated. RED test: assert `/creator` and `/viewer`
resolve 200 post-move for authed users, redirect to `/login` unauthed.

## Open Questions

- [ ] `--color-on-surface-muted` exact hex — proposing `#94a3b8` (6.8:1). Confirm.
- [ ] Contrast verification mechanism: axe-core via Playwright (preferred, automatable) vs manual. Recommend axe on `(dashboard)` + `(auth)` routes.
- [ ] `TopAppBar` default `avatarUrl`/`clientName` are hardcoded placeholders — in scope to wire real data, or leave?
