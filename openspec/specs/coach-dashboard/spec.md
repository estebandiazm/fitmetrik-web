# Spec: Coach Dashboard Redesign

## Overview

Complete redesign of the coach home page (`/clients`) with new Stitch UI, multi-role routing, data isolation, and invitation system parameterization. Consolidates routing, UI, invitation, and data-access requirements.

---

## Part 1: Route & Redirect

### Context

The current middleware (`src/middleware.ts`) already implements RBAC routing but has one gap: when `role === 'coach'` and `pathname === '/'`, it lets the request pass through instead of redirecting to `/clients`. Additionally, `src/app/page.tsx` acts as the de-facto coach home but must be removed.

### Requirements

- **Req 1**: A coach who logs in must land on `/clients`, not `/`.
- **Req 2**: Root `/` must always redirect — never render content — based on auth state and role:
  - Unauthenticated → `/login`
  - `role === 'coach'` → `/clients`
  - `role === 'client'` → `/dashboard`
  - Unknown role → `/login?error=Unknown+role.+Contact+your+administrator.`
- **Req 3**: `src/app/page.tsx` must be removed; the root path must have no page component.
- **Req 4**: Coaches must be blocked from accessing `/dashboard`; clients must be blocked from `/clients`. Both blocks already exist in middleware and must be preserved.
- **Req 5**: Unauthenticated users visiting any protected route are redirected to `/login`.
- **Req 6**: Auth callback (`/auth/callback`) and update-password (`/update-password`) routes remain unblocked regardless of auth state.

---

## Part 2: Coach Dashboard UI

### Context

The current coach home at `src/app/page.tsx` is a `'use client'` component with a basic MUI card list — no metrics, no sorting, no pagination. The redesign replaces it with a Server Component at `src/app/(dashboard)/clients/page.tsx` that matches the Stitch mockup: three metric cards at the top and a full client roster table below.

### Requirements

- **Req 7**: The `/clients` page must be a **Server Component** by default; client-side interactivity (sorting, pagination) is isolated in child Client Components.
- **Req 8**: The page renders **three metric cards**:
  - **Active Clients**: Total count of clients assigned to the current coach.
  - **Pending Plans**: Count of clients with no active diet plan.
  - **Avg. Completion %**: Average plan adherence rate across all clients (mocked as `0%` until real tracking exists).
- **Req 9**: The page renders a **client roster table** with the following columns (in order):
  1. CLIENT (name)
  2. GOAL (target weight)
  3. WEIGHT PROGRESS (mocked — current vs. target)
  4. PLAN STATUS (active plan present or not)
  5. LAST UPDATE (most recent `updatedAt` timestamp)
  6. ACTIONS (view / manage)
- **Req 10**: The table must support **column sorting** (at minimum by CLIENT name and LAST UPDATE).
- **Req 11**: The table must support **pagination** (page size: 10 rows; show total count and page controls).
- **Req 12**: The table must show an **empty state** when the coach has no clients (illustration + CTA to invite first client).
- **Req 13**: The page must fetch only the current coach's clients (see Part 4: Data Access & Security).
- **Req 14**: All UI on `/clients` and coach-scoped components (`src/components/coach/**`) MUST render using design tokens defined in `src/app/globals.css` — no hardcoded hex color values. The coach surface MUST apply the `.surface-coach` scope class (radius 8–12px, denser spacing, WCAG AA+ 4.5:1 minimum contrast). The system MUST NOT depend on MUI; styling MUST be hand-rolled Tailwind CSS v4 consuming tokens.
  - **Scenario: Coach dashboard renders on tokens**
    - GIVEN the `/clients` page and its child components
    - WHEN rendered
    - THEN no hardcoded 6-digit hex values appear in `src/components/coach/**`
    - AND all colors resolve through CSS custom properties declared in `globals.css` `@theme`
  - **Scenario: Coach surface meets contrast requirement**
    - GIVEN the `.surface-coach` scope class applied at `(dashboard)/layout.tsx`
    - WHEN any text/background pairing renders under that scope
    - THEN the contrast ratio is at least 4.5:1 (WCAG AA)
  - **Scenario: No MUI dependency**
    - GIVEN the coach dashboard's rendered output
    - WHEN inspecting `package.json` and component imports
    - THEN zero `@mui/*` or `@emotion/*` packages or imports are present

---

## Part 3: Coach Invitation Flow

### Context

The current `AuthProvider` port defines `inviteUser(email: string)` with no role parameter, and `SupabaseAuthProvider` hardcodes `data: { role: 'client' }` when calling `admin.inviteUserByEmail()`. A single email template (`InviteUserEmail`) is used for all invites. This makes it impossible to invite coaches through the platform. The fix parameterizes the role and adds a dedicated coach email template.

### Requirements

- **Req 15**: `AuthProvider.inviteUser` must accept a `role` parameter: `inviteUser(email: string, role: Role): Promise<{ id: string } | null>`.
- **Req 16**: `SupabaseAuthProvider.inviteUser` must pass the received `role` value into Supabase's `admin.inviteUserByEmail()` user metadata (`data: { role }`).
- **Req 17**: A new email template `InviteCoachEmail` must exist at `emails/InviteCoachEmail.tsx` with coach-specific copy (different from the client template which says "Tu nutricionista te ha invitado").
- **Req 18**: The existing `InviteUserEmail` template must be renamed to `InviteClientEmail` for clarity; its copy and behavior remain unchanged.
- **Req 19**: A new Server Action `inviteCoach(formData: FormData)` must:
  1. Call `authProvider.inviteUser(email, 'coach')`
  2. Create a `Coach` entity in MongoDB via `createCoach({ name, email })`
  3. Link the Supabase `authId` to the created Coach document
  4. Redirect to a success state on completion
- **Req 20**: The existing `inviteClient` action must be updated to call `authProvider.inviteUser(email, 'client')` (explicit role instead of relying on hardcoded default).
- **Req 21**: Supabase must receive the correct template for each role. Coach invites must trigger the `InviteCoachEmail` template; client invites must trigger the `InviteClientEmail` template. This is configured in the Supabase dashboard (email template mapping).
- **Req 22**: Both invite flows must handle the error case where Supabase returns an error (e.g., email already registered) and surface it to the caller without crashing.

---

## Part 4: Data Access & Security

### Context

The current coach home calls `getClients()` which executes `ClientModel.find()` with no filter — every coach sees every client in the database. This is a data isolation bug. The fix requires two steps: (1) resolve the current coach's MongoDB `_id` from the Supabase session `authId`, and (2) use `getClientsByCoachId(coachId)` instead of `getClients()`. Additionally, the `inviteClient` Server Action currently reads `NEXT_PUBLIC_DEFAULT_COACH_ID` from the environment; this must be replaced with the authenticated coach's actual ID.

### Requirements

- **Req 23**: The `/clients` dashboard page must resolve the current coach identity by calling `getCoachByAuthId(session.user.id)` — where `session` comes from `authProvider.getSession()`.
- **Req 24**: The `/clients` dashboard page must fetch clients by calling `getClientsByCoachId(coach.id)`. The unfiltered `getClients()` must NOT be used in any coach-facing dashboard path.
- **Req 25**: If `getCoachByAuthId()` returns `null` (coach record not found for the authenticated user), the page must render an error state and log the anomaly — it must NOT proceed to fetch clients.
- **Req 26**: The `inviteClient` Server Action must resolve the current coach's ID from the session (via `authProvider.getSession()` → `getCoachByAuthId(session.user.id)`) instead of reading `NEXT_PUBLIC_DEFAULT_COACH_ID`.
- **Req 27**: The `NEXT_PUBLIC_DEFAULT_COACH_ID` environment variable must be removed from usage after Req 26 is implemented.
- **Req 28**: No coach must be able to read, modify, or reference clients belonging to another coach — this must be enforced at the data-fetching layer (server action / DB query), not solely at the UI layer.
- **Req 29**: All data-fetching for the dashboard must occur in Server Components or Server Actions — no client-side fetching of raw client data.

---

## Acceptance Criteria

- [ ] Root route redirects authenticated coaches to `/clients` (not `/`)
- [ ] Root route redirects unauthenticated users to `/login`
- [ ] Coach dashboard loads at `/clients` as a Server Component with three metric cards
- [ ] Client roster table displays with sorting and pagination (page size: 10)
- [ ] Empty state renders when coach has no clients
- [ ] Data isolation: coaches see only their own clients
- [ ] Coach identity is resolved from Supabase session, not hardcoded env var
- [ ] `inviteUser` port method accepts `role` parameter
- [ ] `inviteClient` and `inviteCoach` Server Actions exist and use correct email templates
- [ ] Coach invitation creates Coach document in MongoDB
- [ ] All invite flows handle Supabase errors gracefully
- [ ] E2E tests validate login redirect and no-flicker behavior

---

## Testing Scenarios

### Routing & Auth
1. Coach logs in → lands on `/clients` (not `/`)
2. Coach navigates to `/` → redirects to `/clients`
3. Client navigates to `/` → redirects to `/dashboard`
4. Unauthenticated user visits `/` → redirects to `/login`
5. Coach tries to access `/dashboard` → redirected to `/clients`
6. Client tries to access `/clients` → redirected to `/dashboard`

### Dashboard UI
7. Coach with 5 clients → metric cards show correct counts, table shows 5 rows
8. Coach with 0 clients → empty state renders
9. Coach sorts table by client name → rows re-order A-Z (toggle Z-A on second click)
10. Coach sorts table by last update → rows re-order by timestamp
11. Coach paginates through 25 clients → 3 pages of 10 rows each
12. Coach clicks action button → navigates to client detail page

### Data Isolation
13. Coach A and Coach B both logged in → each sees only their own clients
14. Coach identity lookup fails → page renders error state, logs anomaly
15. `inviteClient` uses session coach ID (not hardcoded env var)

### Invitation
16. Coach invites client → client receives email with `InviteClientEmail` template
17. Coach invites coach → coach receives email with `InviteCoachEmail` template
18. Invite to already-registered email → Server Action returns error, no duplicate created
19. Missing `SERVICE_ROLE_KEY` → `AuthProvider.inviteUser` logs error, returns null

---

## Files Modified

- `src/middleware.ts` — fix root redirect for coaches
- `src/app/page.tsx` — removed
- `src/app/(dashboard)/clients/page.tsx` — new Server Component
- `src/infrastructure/ports/auth-provider.ts` — add `role` parameter to `inviteUser`
- `src/infrastructure/adapters/supabase-auth-provider.ts` — pass role to Supabase
- `src/app/actions/invite-client.ts` — use session coach ID instead of env var
- `src/app/actions/invite-coach.ts` — new Server Action
- `emails/InviteUserEmail.tsx` → `emails/InviteClientEmail.tsx` (renamed)
- `emails/InviteCoachEmail.tsx` — new email template
- Environment: remove `NEXT_PUBLIC_DEFAULT_COACH_ID` from `.env.local`

---

## Known Limitations

- Avg. Completion % metric is mocked as `0%` until plan adherence tracking exists
- Weight progress column is mocked — real weight tracking not yet implemented
- Client detail page route is TBD in design phase
