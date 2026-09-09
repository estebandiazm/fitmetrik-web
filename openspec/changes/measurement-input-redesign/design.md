# Design: Measurement Input Redesign

> Product decisions locked (Engram #22): blank/`0` are never persisted (no storage change, no viz patches); ranges are **removed**, not made configurable; only the `tracking` atomicity defect is inherited from `body-measurements-tracking`; a shared `ui/Modal` primitive is approved with `AddMeasurementModal` as first adopter.

## Technical Approach

Three independent seams, applied in this order so no layer ever advertises a bound another layer no longer enforces:

1. **Relax value validation** at all 6 `valueCm` sites to "finite, non-negative", and move the "`0`/blank = no-data" rule into one pure domain helper reused by both the modal and the server action.
2. **Add `src/components/ui/Modal`** — a flat-prop, responsive, hand-rolled dialog primitive following the existing `Button`/`Input`/`Card` style (no new packages).
3. **Rebuild the modal body** as a grouped numeric tile grid on top of that primitive, and **reorder the `tracking` route** to validate everything before persisting anything.

## Architecture Decisions

### D1 — `ui/Modal` primitive shape

| Option | Tradeoff | Decision |
|---|---|---|
| Flat props (`title`, `footer`, `children`) | Structure is guaranteed; less flexible | **Chosen** — matches every existing `ui/` primitive; makes the scroll-body + sticky-footer contract mandatory instead of opt-in |
| Compound `Modal.Header/Body/Footer` | More flexible | Rejected — zero precedent in `src/components/ui/`, and a consumer can silently break the sticky-footer/`dvh` contract |

Sub-decisions:

| Concern | Choice | Rationale |
|---|---|---|
| Sheet vs dialog | Pure Tailwind media breakpoint: overlay `items-end sm:items-center`, panel `w-full rounded-t-[var(--radius-card)] max-h-[85dvh] sm:max-w-md sm:rounded-[var(--radius-card)] sm:max-h-[90dvh]` | Viewport-level decision → media query, not container query; **no JS**, so it is correct on first paint with no hydration flash |
| Focus trap | Hand-rolled: capture `document.activeElement` on open, focus `initialFocusRef` (else first focusable), `Tab`/`Shift+Tab` wrap via a `querySelectorAll` of focusables on the panel, restore focus on close | Proposal forbids new deps. `inert` on the app root is a later enhancement, noted not taken |
| Scroll lock | `document.body.style.overflow = 'hidden'` guarded by a **module-level open counter**, restoring the previous inline value at zero | The primitive targets 4 adopters; a naive per-instance lock unlocks the page while a second modal is still open |
| Escape / backdrop | `onKeyDown` on the panel container (bubbles from any focused child) + a sibling backdrop `onClick`; both gated by `closeOnEscape` / `closeOnBackdrop`, default `true` | No global listener to leak |
| Portal | `createPortal(node, document.body)` behind a `mounted` flag set in `useEffect` | `document` is absent during SSR under Next 16 |
| Surface scope | Render a hidden sentinel `<span ref={anchorRef} hidden />` **in place**; on open resolve `anchorRef.current?.closest('.surface-client, .surface-coach')` and copy that class onto the portal root. Optional `surfaceScope` prop overrides | Directly kills the documented "tokens lost on portal" risk: an adopter cannot lose `--radius-card` / `--space-card-p` by forgetting a prop |
| Keyboard inset | Subscribe to `window.visualViewport` `resize`/`scroll`; `inset = max(0, innerHeight − (vv.height + vv.offsetTop))`; apply as `style={{ paddingBottom: inset }}` on the overlay | `dvh` alone does not shrink for the iOS keyboard; no-ops to `0` where `visualViewport` is unsupported |

### D2 — Grouped grid layout

| Concern | Choice | Rationale |
|---|---|---|
| Group source | New pure `MEASUREMENT_GROUPS: Record<slug, groupLabel>` + `groupPoints()` in `src/domain/services/bodyMeasurements.ts`, unknown slug → `Otros` | Adding a `group` field to `MeasurementPoint` would touch the Zod schema, the Mongoose subschema, the coach editor **and** need a backfill — the proposal guarantees no data-shape change. Deriving from `bodyCoords.y` is fragile |
| Input element | `type="text" inputMode="decimal" enterKeyHint="next"` + sanitize-on-change (digits and one separator; `,` → `.` at parse) | `type="number"` accepts `e`/`+`/`-`, breaks on comma locales, and scroll-wheel-mutates. Sanitizing also makes site 6 (`min`/`max` attrs) disappear by construction |
| Tile | `grid-cols-2 sm:grid-cols-3`: label, big `tabular-nums` value, `cm` suffix, `−`/`+` steppers (`step 0.5`, clamped at `0`), reference line `última: 85 cm (Δ -1.2)` | 8 points fit ~4 rows → the "one screen" success criterion without inner scrolling |
| Reference data | Add **optional** `measurements?: BodyMeasurement[]` prop, wired one line in `ActivityPageClient` (already in scope there); value from `groupByPoint`, Δ from the existing `getDeltaForLast` | The only non-N+1 source. Additive and optional, so the "props unchanged" contract holds for existing callers |
| Auto-advance | `Enter` focuses the next tile via an ordered ref list; last tile is `enterKeyHint="done"` and only blurs | Auto-advancing on digit count is a footgun for decimals; auto-submitting on the last field is destructive |
| `preselectedSlug` | `ring-2 ring-primary` + focus + `scrollIntoView({ block: 'center' })`; **anatomical order preserved** | Reordering groups per entry point makes the layout unlearnable |
| Blank / `0` | Both allowed while typing; `0` shows a muted `no se guarda` hint; the footer counter and the built batch both exclude them | Honest about the no-data rule instead of silently discarding |

### D3 — Partial save (the fork)

**Choice: client-side pre-filter. The server batch stays atomic.**

| Option | Tradeoff | Decision |
|---|---|---|
| Client-side pre-filter | Modal drops blank/`0`, flags unparseable fields per-tile, and submits **only** the valid entries. Server semantics untouched | **Chosen** |
| Server-side partial persistence | Server persists valid rows and returns per-row errors | Rejected — it would weaken REQ-BMT-02's all-or-none exactly while D5 strengthens the same guarantee across actions. Two contradictory atomicity stories in one change |

Behaviour: submit builds `{ entries, fieldErrors }` from the pure `buildMeasurementEntries()`. Valid entries are sent as one atomic batch; flagged tiles keep their text and error. If any tile was flagged the modal stays open after a successful save (saved tiles clear and show a check); otherwise it closes. Spec wording therefore reads: *a submitted batch is persisted all-or-none; composing that batch is a client concern.* No contradiction with D5.

### D4 — The 6 `valueCm` sites

| # | Site | Before | After |
|---|---|---|---|
| 1 | `domain/types/BodyMeasurement.ts:6` | `z.number().positive().max(300)` | `z.number().min(0)` |
| 2 | `domain/services/bodyMeasurements.ts:30-41` | two range branches vs `point.minCm/maxCm` | `!Number.isFinite(v)` → error; `v < 0` → error; else ok. `point` kept for the message label |
| 3 | `app/actions/clientActions.ts:366` | `validateMeasurement` range throw | same call, now non-range; batch first runs `toPersistableEntries()` so a `0` is skipped as no-data, never stored |
| 4 | `lib/models/Client.ts:67` | `{ min: 0.1, max: 300 }` | `{ min: 0 }` (last-resort negative floor) |
| 5 | `api/.../tracking/route.ts:8` | `z.number().positive().max(300)` | `z.number().min(0)` |
| 6 | `AddMeasurementModal.tsx:169-178` | `min`/`max` attrs, `({minCm}–{maxCm} cm)` hint, midpoint placeholder | all removed; `type="text" inputMode="decimal"`, placeholder `—` |

`MEASUREMENT_POINTS_CATALOG` ranges: **kept as data, read by nobody.** `MeasurementPointSchema` and `MeasurementPointSubSchema` still require `minCm`/`maxCm` (product decision: no migration), so the values must exist — but they must **not** feed placeholders or stepper hints, which would re-advertise a bound we no longer enforce. Retitle the `REQ-BMT-07` comment to `legacy, unenforced`.

Zod 4 note: `z.number()` already rejects `NaN` and `±Infinity`, so `.min(0)` yields "finite, non-negative". A boundary test asserts this rather than assuming it.

### D5 — `tracking/route.ts` atomicity

Current order: `addDailyStep` **persists** → `addDailyWeight` **persists** → measurements validate-and-persist. An invalid measurement therefore returns 400 with steps already written.

| Option | Tradeoff | Decision |
|---|---|---|
| Validate-all-then-persist-all | Costs one extra read on measurement POSTs; leaves a narrow mid-persist DB-failure window | **Chosen** |
| Mongoose session/transaction | Fully closes the window, but requires a replica set (unverified for this deployment) and threading a session through 3 independently-saving actions | Rejected for this change; recorded as follow-up |

Implementation: extract pure `validateMeasurementEntries(points, entries)` into `domain/services/bodyMeasurements.ts`; add a **read-only** `validateMeasurementBatch(clientId, entries)` action (loads the client, runs the pure validator, writes nothing); the route calls it **before** the `entry.steps` block and returns 400 on failure. `addMeasurementEntries` keeps its own validation as defence in depth. Residual risk (a DB error between two persists) is accepted and documented.

## Data Flow

    Tiles ─ sanitize ─→ values{slug:string}
                            │  buildMeasurementEntries()  (pure, domain)
                            ▼
              { entries[] , fieldErrors{} }        blank/0 dropped, bad flagged
                    │                │
                    │                └──→ per-tile error, tile stays open
                    ▼
          addMeasurementEntries(clientId, entries)   ← atomic batch, all-or-none

    POST /tracking
      validateMeasurementBatch ──fail──→ 400, nothing persisted
               │ ok
               ▼
      addDailyStep → addDailyWeight → addMeasurementEntries

## File Changes

| File | Action | Description |
|---|---|---|
| `src/components/ui/Modal.tsx` | Create | Responsive sheet/dialog primitive (D1) |
| `src/components/activity/AddMeasurementModal.tsx` | Modify | Grouped tile grid on `ui/Modal`; site 6; optional `measurements` prop |
| `src/components/activity/ActivityPageClient.tsx` | Modify | One line: pass `measurements` to the modal |
| `src/domain/services/bodyMeasurements.ts` | Modify | `validateMeasurement` (site 2); new `MEASUREMENT_GROUPS`, `groupPoints`, `toPersistableEntries`, `buildMeasurementEntries`, `validateMeasurementEntries`; catalog comment |
| `src/domain/types/BodyMeasurement.ts` | Modify | Site 1 |
| `src/app/actions/clientActions.ts` | Modify | Site 3 + new read-only `validateMeasurementBatch` |
| `src/lib/models/Client.ts` | Modify | Site 4 |
| `src/app/api/clients/[clientId]/tracking/route.ts` | Modify | Site 5 + validate-first ordering |
| `openspec/specs/{body-measurements-tracking,unified-tracking-api,ui-design-system}/spec.md` | Modify | REQ-BMT-02/04, REQ-BMT-07 REMOVED, REQ-UTA-04, new modal-primitive requirement |
| `tests/unit/domain/services/bodyMeasurements.spec.ts`, `tests/unit/domain/types/BodyMeasurement.spec.ts`, `tests/unit/api/tracking.spec.ts`, `tests/body-measurements.spec.ts` | Modify/Create | See below |

## Interfaces / Contracts

```ts
// src/components/ui/Modal.tsx
export const SURFACE_SCOPE = { client: 'surface-client', coach: 'surface-coach' } as const;
export type SurfaceScope = (typeof SURFACE_SCOPE)[keyof typeof SURFACE_SCOPE];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;                                   // wired to aria-labelledby
  children: React.ReactNode;                       // scrollable body
  footer?: React.ReactNode;                        // sticky, keyboard-offset
  surfaceScope?: SurfaceScope;                     // omitted -> auto-detected
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  closeOnBackdrop?: boolean;                       // default true
  closeOnEscape?: boolean;                         // default true
  size?: 'sm' | 'md' | 'lg';
  testId?: string;
}

// src/domain/services/bodyMeasurements.ts — pure, no React, no infra
export function toPersistableEntries<T extends { valueCm: number }>(entries: T[]): T[];
export function buildMeasurementEntries(
  points: MeasurementPoint[], values: Record<string, string>, date: Date
): { entries: BodyMeasurement[]; fieldErrors: Record<string, string> };
export function validateMeasurementEntries(
  points: MeasurementPoint[], entries: Array<{ pointSlug: string; valueCm: number }>
): ValidationResult;
export function groupPoints(points: MeasurementPoint[]): Array<{ group: string; points: MeasurementPoint[] }>;
```

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (domain) | Boundary per site: `0`, `-1`, `0.1`, `450`, `NaN`, `Infinity`, `""`; future-date refine | Vitest, existing node env — `bodyMeasurements.spec.ts` (invert range cases) + new `BodyMeasurement.spec.ts` |
| Unit (domain) | `buildMeasurementEntries` drops blank/`0`, flags `"1.2.3"`, still returns the valid siblings; `toPersistableEntries` never emits `0`; every catalog slug has a group (drift guard) | Vitest, pure — this is where the D3 fork is actually verified |
| Unit (API) | Valid steps + invalid measurement → 400 **and** `addDailyStep` not called | Extend `tests/unit/api/tracking.spec.ts`; the harness already mocks the actions, so mock `validateMeasurementBatch` rejecting |
| E2E | Update POM `fillMeasurementInput` for the new tile markup | `tests/body-measurements.spec.ts` — suite is 0/5 on missing fixtures (out of scope), not a gate |

**React Testing Library + jsdom: recommended NO for this change.** Cost is 5 devDeps (`jsdom`, `@testing-library/react`, `user-event`, `jest-dom`, `@vitejs/plugin-react`), a second Vitest project (current config is `environment: 'node'`, `include: tests/unit/**/*.spec.ts`), and first-harness debugging — on a PR already forecast **High** against the 400-line budget. The mitigation is structural: the risky logic (the partial-save fork, grouping, the no-data rule) is extracted into pure functions covered by the existing runner, leaving only DOM-behavioural concerns (focus trap, Escape, scroll-lock) untested. Those are `ui/Modal`'s, and the right gate for them is the Playwright suite once its fixtures land. Recorded as a follow-up: *add component-test infrastructure alongside the other three modal migrations.*

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. The `tracking` route is pre-existing and its `x-api-key` auth is untouched.

## Migration / Rollout

No migration. No data-shape change: `minCm`/`maxCm` stay populated, `valueCm` stays a required number, `0` is never written. Rows written under the relaxed schema outside the old `0.1–300` window read fine under the old code and only re-fail on edit — the documented rollback caveat.

## Open Questions

- [ ] Does the target MongoDB deployment run as a replica set? Only affects whether the D5 transaction follow-up is viable; does not block this change.
- [ ] `Otros` fallback group copy — confirm the Spanish label with the owner during apply (cosmetic; unreachable while the catalog stays at 8 slugs).
