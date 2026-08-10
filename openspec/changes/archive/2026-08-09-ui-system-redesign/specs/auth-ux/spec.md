# Delta for auth-ux

**Change**: ui-system-redesign
**Scope**: `auth-ux` has functional requirements (login, update-password, logout, redirects) but zero visual-system coverage. This delta ADDS the missing visual-treatment requirement; existing requirements are unchanged.

---

## ADDED Requirements

### Requirement: Neumorphic Client-Scope Visual Treatment

Auth pages (`login`, `reset-password`, `update-password`) MUST apply the `.surface-client` scope treatment and MUST render using the shared `.neu-card` component instead of the legacy glassmorphism `.card` / CSS Modules. Dead `--auth-*` near-black/green tokens MUST be removed from `globals.css`; `--auth-error` and `--auth-success` MUST be folded into the main `@theme` block.

#### Scenario: Login page renders neumorphic card
- GIVEN a user navigates to `/login`
- WHEN the page renders
- THEN the form is contained in a `.neu-card` element, not the legacy glassmorphism `.card`
- AND the surrounding layout carries the `.surface-client` scope class

#### Scenario: Reset password page matches the system
- GIVEN a user navigates to `/reset-password`
- WHEN the page renders
- THEN it uses `.surface-client` tokens and `.neu-card`, matching login/update-password — no unstyled light-mode scaffolding

#### Scenario: Dead auth tokens removed
- GIVEN `src/app/globals.css`
- WHEN searched for `--auth-bg`, `--auth-surface`, `--auth-surface-hover`, `--auth-accent`, `--auth-accent-hover`, `--auth-text-primary`, `--auth-text-secondary`, `--auth-text-muted`, `--auth-border`
- THEN zero matches remain
- AND `--auth-error` / `--auth-success` exist only inside the main `@theme` block
