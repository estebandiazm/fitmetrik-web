# auth-ux Specification

## Purpose
TBD - created by archiving change login-ux-improvement. Update Purpose after archive.

## Requirements
### Requirement: Stitch UI Login Screen
The system SHALL present the login screen matching the Stitch "Web Login Screen" design metrics and color palette.

#### Scenario: User visits login
- **WHEN** user navigates to `/login`
- **THEN** they see the branded dark mode login with email input and magic link trigger matching the Stitch project

#### Scenario: Invalid login attempt
- **WHEN** user submits an invalid email or Supabase rejects the magic link creation
- **THEN** system displays a styled error message matching the design system instead of unstyled text

### Requirement: Stitch UI Update Password Screen
The system SHALL present an update password screen matching the Stitch "Web Change Password" design and intelligently handle multiple authentication contexts.

#### Scenario: User arrives from invite or recovery link (Recovery Mode)
- **WHEN** user clicks the Supabase invite or recovery link and arrives at `/update-password?type=recovery`
- **THEN** they are prompted to enter only a "New Password" and "Confirm New Password" using the new UI

#### Scenario: Active user requests password change (Manual Update)
- **WHEN** an authenticated user manually navigates to `/update-password`
- **THEN** they are prompted to enter their "Current Password", "New Password", and "Confirm New Password" to authorize the change

### Requirement: Seamless Logout
The system SHALL provide a clear and styled logout experience.

#### Scenario: User clicks logout
- **WHEN** user clicks logout from the dashboard or portal
- **THEN** system clears the Supabase session, shows a visually cohesive loading indicator or toast, and redirects cleanly to `/login`

### Requirement: Root Redirect for Unauthenticated Users
The system SHALL redirect unauthenticated users attempting to access the root URL (`/`) to the login page.

#### Scenario: Unauthenticated user visits root
- **WHEN** an unauthenticated user navigates to `/`
- **THEN** the system redirects them to `/login`


<----------------------------------------------------------------------------------------------------------------------- SYNCED FROM fix-update-password-bug -->


## MODIFIED Requirements

### Requirement: Stitch UI Update Password Screen
The system SHALL present an update password screen matching the Stitch "Web Change Password" design and intelligently handle multiple authentication contexts.

#### Scenario: User arrives from invite or recovery link (Recovery Mode)
- **WHEN** user clicks the Supabase invite or recovery link and arrives at `/update-password?type=recovery`
- **THEN** they are prompted to enter only a "New Password" and "Confirm New Password" using the new UI

#### Scenario: Active user requests password change (Manual Update)
- **WHEN** an authenticated user manually navigates to `/update-password`
- **THEN** they are prompted to enter their "Current Password", "New Password", and "Confirm New Password" to authorize the change

<----------------------------------------------------------------------------------------------------------------------- SYNCED FROM multi-role-coach -->

## NEW Requirements (from multi-role-coach)

### Requirement: Role value 'coach' replaces 'nutritionist'
The system SHALL recognise `'coach'` as the valid role value for coach users. The `AuthProvider` port SHALL update its role type union to `'coach' | 'client'`. The `SupabaseAuthProvider` SHALL map `user_metadata.role === 'coach'` accordingly. Middleware SHALL route users with role `'coach'` to `/clients`.

#### Scenario: Coach role routes to /clients
- **WHEN** a Supabase session with user_metadata.role = "coach" is evaluated
- **THEN** the middleware grants access and routes the user to /clients

#### Scenario: Nutritionist role is rejected
- **WHEN** a Supabase session with user_metadata.role = "nutritionist" is evaluated
- **THEN** the user is redirected to /login (unrecognised role)

#### Scenario: Client role routes to /dashboard
- **WHEN** a Supabase session with user_metadata.role = "client" is evaluated
- **THEN** the middleware grants access and routes the user to /dashboard

### Requirement: Middleware RBAC routing updated
Middleware SHALL check for role `'coach'` to grant access to `/clients` and other coach-facing routes. A user with role `'nutritionist'` SHALL be treated as having an unrecognised role and SHALL be redirected to `/login`.

#### Scenario: Unauthenticated user redirected to login
- **WHEN** no active Supabase session exists and a request is made to any protected route
- **THEN** the middleware redirects the user to /login

#### Scenario: AuthProvider type does not include 'nutritionist'
- **WHEN** TypeScript strict mode is enabled
- **THEN** attempting to assign role = "nutritionist" to an AuthProvider Role type SHALL raise a compilation error

### Requirement: Login action implements multi-role redirect
The login Server Action (`src/app/(auth)/login/actions.ts`) SHALL read `user_metadata.role` from the Supabase session after successful authentication and redirect to the correct route based on role value. Unknown/missing roles SHALL return the user to `/login` with an error message instead of redirecting to a protected route.

#### Scenario: Coach logs in and is redirected to clients list
- **WHEN** a Supabase user with user_metadata.role = "coach" submits valid credentials on /login
- **THEN** the system redirects them to /clients

#### Scenario: Client logs in and is redirected to dashboard
- **WHEN** a Supabase user with user_metadata.role = "client" submits valid credentials on /login
- **THEN** the system redirects them to /dashboard

#### Scenario: User with unknown role is denied redirect
- **WHEN** a Supabase user with user_metadata.role = "nutritionist" submits valid credentials on /login
- **THEN** the system does NOT redirect to a protected route and displays an error message on /login

<----------------------------------------------------------------------------------------------------------------------- SYNCED FROM ui-system-redesign -->

## NEW Requirements (from ui-system-redesign)

### Requirement: Neumorphic Client-Scope Visual Treatment
Auth pages (`login`, `reset-password`, `update-password`) MUST apply the `.surface-client` scope treatment and MUST render using the shared `.neu-card` component instead of the legacy glassmorphism `.card` / CSS Modules. Dead `--auth-*` near-black/green tokens MUST be removed from `globals.css`; `--auth-error` and `--auth-success` MUST be folded into the main `@theme` block.

#### Scenario: Login page renders neumorphic card
- **WHEN** a user navigates to `/login`
- **THEN** the form is contained in a `.neu-card` element, not the legacy glassmorphism `.card`
- **AND** the surrounding layout carries the `.surface-client` scope class

#### Scenario: Reset password page matches the system
- **WHEN** a user navigates to `/reset-password`
- **THEN** it uses `.surface-client` tokens and `.neu-card`, matching login/update-password — no unstyled light-mode scaffolding

#### Scenario: Dead auth tokens removed
- **GIVEN** `src/app/globals.css`
- **WHEN** searched for `--auth-bg`, `--auth-surface`, `--auth-surface-hover`, `--auth-accent`, `--auth-accent-hover`, `--auth-text-primary`, `--auth-text-secondary`, `--auth-text-muted`, `--auth-border`
- **THEN** zero matches remain
- **AND** `--auth-error` / `--auth-success` exist only inside the main `@theme` block
