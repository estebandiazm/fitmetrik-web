# Delta for coach-dashboard

**Change**: ui-system-redesign
**Scope**: This delta modifies ONLY Req 14 ("Part 2: Coach Dashboard UI") of `openspec/specs/coach-dashboard/spec.md`. All other requirements (routing, invitations, sortable/paginated roster, data isolation) are unchanged and are not restated here.

---

## MODIFIED Requirements

### Requirement: Coach Surface Visual System (Req 14)

All UI on `/clients` and coach-scoped components (`src/components/coach/**`) MUST render using design tokens defined in `src/app/globals.css` — no hardcoded hex color values. The coach surface MUST apply the `.surface-coach` scope class (radius 8–12px, denser spacing, WCAG AA+ 4.5:1 minimum contrast). The system MUST NOT depend on MUI; styling MUST be hand-rolled Tailwind CSS v4 consuming tokens.
(Previously: "All UI must follow the existing dark theme (`bg-[#0a0f1e]` palette) and MUI 7 + Tailwind v4 conventions" — factually stale; MUI is not installed, and the hardcoded palette predates the token system.)

#### Scenario: Coach dashboard renders on tokens
- GIVEN the `/clients` page and its child components
- WHEN rendered
- THEN no hardcoded 6-digit hex values appear in `src/components/coach/**`
- AND all colors resolve through CSS custom properties declared in `globals.css` `@theme`

#### Scenario: Coach surface meets contrast requirement
- GIVEN the `.surface-coach` scope class applied at `(dashboard)/layout.tsx`
- WHEN any text/background pairing renders under that scope
- THEN the contrast ratio is at least 4.5:1 (WCAG AA)

#### Scenario: No MUI dependency
- GIVEN the coach dashboard's rendered output
- WHEN inspecting `package.json` and component imports
- THEN zero `@mui/*` or `@emotion/*` packages or imports are present
