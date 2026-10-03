# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two roles, distinct contexts:

- **Coach / nutritionist** — manages N clients, builds and edits personalized nutrition plans (meals, meal blocks, food options), reviews client progress and measurements. Primarily **desktop**, data-management-heavy workflows.
- **Client** — views their assigned plan, logs daily activity (weight, steps, body measurements) in a read-only-for-plans, write-for-logs portal. Primarily **mobile**, quick consult/log sessions.

## Product Purpose

FitMetrik is a nutritional plan management platform. It lets a nutritionist create, calculate, and manage personalized nutrition plans for their clients, and lets clients track their progress against those plans.

Phased roadmap (from AGENTS.md):

| Phase | Scope | Status |
|---|---|---|
| MVP | Personal nutrition plan calculator, 1 nutritionist / 1 client | current |
| V1 | Multi-client: one nutritionist, N clients, progress tracking + history | next |
| V2 | Multi-nutritionist SaaS | future |
| V3 | Gyms + nutrition: training programs (CrossFit), schedule integration | vision |

## Positioning

Undecided — not yet established as a confirmed product fact. The redesign should not invent a competitive claim; this stays open until the user states one.

## Operating Context

- Coach-facing workflows: client roster management, plan creation (meals → meal blocks `[BASE | ACOMPAÑAMIENTO | GRASA | FRUTA]` → food options), goal editing (weight/step goals), measurement point configuration, client progress review.
- Client-facing workflows: viewing the assigned plan, logging daily weight/steps, logging body measurements, viewing trend charts and summaries.
- Auth via Supabase; data persistence via MongoDB/Mongoose.

## Capabilities and Constraints

- Stack: Next.js App Router, React 19, TypeScript (strict), Tailwind CSS v4 (hand-rolled components, migrated off MUI — README's MUI badge is stale), MongoDB (Mongoose), Supabase Auth, Zod, Playwright E2E.
- Route groups: `(auth)` login/password reset, `(dashboard)` coach-facing, `(client-portal)` client-facing.
- A `claude.ai/design` project ("Fitmetrik Design System") already syncs the current atomic UI layer (Button, Card, Modal, Table, Input, Alert, Badge, StatusPill + MetricCard/SummaryCard/PlanCard/TablePagination) — this existing sync will need to be re-run after the redesign's components are finalized.
- **Language: Spanish-first.** UI copy targets a Spanish-speaking (LatAm) audience and should be written/completed in Spanish. Code, identifiers, and comments stay in English per project convention (CLAUDE.md).
- Device priority: coach workflows optimize for desktop; client workflows optimize for mobile.

## Brand Commitments

None binding. The user explicitly granted full freedom to reinvent the visual identity (name "FitMetrik" may stay or change, no committed palette/logo/tone) as part of this redesign — new-work.md owns proposing directions.

## Evidence on Hand

- Current implementation (code + the recently-synced design system) is the only visual evidence on hand — no external brand assets, logos, or marketing materials found in the repo.
- Recent commit history shows an already-completed internal unification pass ("unify UI/UX design system across coach, client, and auth", "unify app header + eslint 9 setup") — the current look is a deliberate, recent baseline, not legacy cruft. Treat it as real evidence/anti-reference per new-work, not as something nobody cared about.

## Product Principles

1. Coach workflows are operate-mode: scanability and data density matter more than expression — the coach manages many clients and plans in a session.
2. Client workflows are also operate-mode but lighter-touch: quick glance-and-log sessions on mobile, not data entry marathons.
3. Spanish-first copy is a product fact, not a localization afterthought — written natively, not translated-sounding.
4. The platform has an explicit multi-phase growth path (solo → multi-client → multi-tenant SaaS → gyms) — the redesign should not paint itself into a corner that single-nutritionist assumptions would make expensive to undo later.

## Accessibility & Inclusion

No product-specific requirement established yet; standard web accessibility practice applies by default.
