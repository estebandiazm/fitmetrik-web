# ui-design-system Specification

**Change**: ui-system-redesign (new capability)

## Purpose

Unified dark-neumorphic token architecture — one brand-hue palette, semantic intensity tokens, and two scoped surface treatments — so coach, client-portal, and auth surfaces render one coherent design system instead of three disconnected paradigms.

## Requirements

### Requirement: Brand Hue Token Palette

The system SHALL define a single brand-hue color palette in `src/app/globals.css` `@theme` — teal `#2dd4bf` (primary), cyan `#22d3ee` (secondary), blue `#3b82f6` (tertiary) — as the only brand palette. No pink/purple/magenta brand tokens SHALL remain.

#### Scenario: Token audit finds one brand family
- GIVEN the `globals.css` `@theme` block
- WHEN inspected
- THEN primary/secondary/tertiary color tokens resolve to teal/cyan/blue values only

### Requirement: Semantic Intensity Tokens

The system SHALL define semantic tokens `--radius-card`, `--shadow-card`, `--space-card-p`, and `--transition-standard`, each overridden per surface scope, so consuming components inherit the correct treatment intensity without forking.

#### Scenario: Component consumes semantic token
- GIVEN a `.neu-card` rendered under `.surface-coach`
- WHEN CSS resolves `--radius-card`
- THEN it resolves to the coach-scoped value, not a hardcoded literal

### Requirement: Surface Scope Classes

The system SHALL provide two scope classes applied once at each route group's root layout: `.surface-coach` (`(dashboard)/layout.tsx` — radius 8–12px, denser spacing, WCAG AA+ 4.5:1 minimum contrast) and `.surface-client` (`(client-portal)/layout.tsx` and `(auth)/layout.tsx` — radius 12–16px, spacious, dual soft shadow).

#### Scenario: Coach layout applies its scope
- GIVEN `(dashboard)/layout.tsx`
- WHEN rendered
- THEN the root element carries `.surface-coach` and no descendant applies its own scope class

#### Scenario: Client and auth layouts apply their scope
- GIVEN `(client-portal)/layout.tsx` and `(auth)/layout.tsx`
- WHEN rendered
- THEN each root element carries `.surface-client`

### Requirement: Shared Component Cross-Scope Rendering

Components under `src/components/activity/*` MUST render correctly under either `.surface-coach` or `.surface-client` via CSS cascade alone, without forked variants — except the 3 Recharts components (`TrendsChart`, `WeightTrendsChart`, `MeasurementTrendsChart`), which MUST accept an explicit `density: 'compact' | 'spacious'` prop for chart-internal values CSS cannot reach. Chart colors MUST still resolve from `var(--token)`.

#### Scenario: Non-chart activity component adapts via cascade
- GIVEN `SummaryCard` rendered once under `.surface-coach` and once under `.surface-client`
- WHEN inspected
- THEN visual treatment (radius/shadow/spacing) differs per scope with zero prop or code fork

#### Scenario: Chart component receives density prop
- GIVEN `WeightTrendsChart` rendered under `.surface-coach` with `density="compact"`
- WHEN it renders
- THEN chart-internal spacing/sizing matches the compact treatment
- AND chart colors still resolve from CSS custom properties, not inline hex

### Requirement: Typography Token

The system SHALL use `Manrope` as the primary/default typeface across the entire application, declared once in `globals.css` `@theme` (`--font-headline`) and applied via the global `body` font-family stack.
(Relocated from `ui-theme` — behavior unchanged.)

#### Scenario: User visits any page
- GIVEN any route (authorized or unauthorized)
- WHEN the page renders
- THEN text renders using the `Manrope` font family

### Requirement: Route-Group Integration for Creator and Viewer

The plan creator (`src/app/creator`) MUST move to `(dashboard)/creator` and the plan viewer (`src/app/viewer`) MUST move to `(client-portal)/viewer`, without changing their public URLs, and MUST render inside their route group's full nav chrome (header/sidebar).

#### Scenario: Coach navigates from clients list to creator and back
- GIVEN a coach on `/clients`
- WHEN they navigate to the plan creator and back
- THEN header and sidebar chrome persist across both views — no standalone/chromeless page

#### Scenario: Creator and viewer URLs unchanged
- GIVEN the pre-move public URLs for creator and viewer
- WHEN the route-group move is complete
- THEN the same URLs resolve to the moved pages — no redirect, no 404

### Requirement: Zero Hardcoded Hex Outside Token Declarations

The system MUST NOT contain hardcoded 6-digit hex color literals in `src/components/**` or `src/app/**`, except inside `src/app/globals.css` token declarations (`@theme`/`:root` blocks). This is the exit check for the whole change.

#### Scenario: Final grep sweep is clean
- GIVEN the completed change
- WHEN running `rg -o '#[0-9a-fA-F]{6}' src/components src/app`
- THEN zero matches are returned outside `src/app/globals.css`
