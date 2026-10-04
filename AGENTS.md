# AGENTS.md — FitMetrik

> Architecture decisions and guidelines for AI-native development.
> Complementary to OpenSpec (which manages functional specs and changes).
> This document defines **how** we build; OpenSpec defines **what** we build.

---

## 1. Product Vision

**FitMetrik** is a nutritional plan management platform that evolves in phases:

| Phase | Scope | Status |
|-------|-------|--------|
| **MVP** | Personal nutrition plan calculator (1 nutritionist, 1 client) | ✅ Current |
| **V1** | Multi-client: one nutritionist manages N clients with plans, progress tracking, and history | 🔲 Next |
| **V2** | Multi-nutritionist: SaaS platform where multiple nutritionists operate with their clients | 🔲 Future |
| **V3** | Gyms + nutrition: schedule management, training programs (CrossFit), integration with nutrition plans | 🔲 Vision |

### Fundamental Principle

> **Solo dev + AI-native**: All decisions prioritize individual development speed assisted by AI,
> while maintaining the ability to scale when the product requires it. Don't over-engineer for future cases
> that don't exist yet, but prepare the contracts so that changes are possible.

---

## 2. Architecture

### 2.1 Style: Next.js Monolith — Feature-First with Infrastructure Ports

**Decision**: Full-stack monolith with Next.js App Router. Feature-first for code organization,
with interfaces (ports) only for interchangeable infrastructure (DB, Auth, AI).

**Rationale**:
- No heavy backend logic that justifies separate services
- Next.js App Router already offers Server Components, Server Actions, and API Routes as "backend"
- Feature-first allows AI to generate complete features without knowing the entire system
- Infrastructure ports prepare for provider changes without full hexagonal ceremony
- If a separate backend needs to be extracted in the future, infrastructure interfaces already define the contracts

### 2.2 Folder Structure

```
src/
├── app/                          # Next.js App Router (routes and layouts)
│   ├── (auth)/                   # Route group: login, onboarding
│   │   └── login/page.tsx
│   ├── (dashboard)/              # Route group: nutritionist views
│   │   ├── layout.tsx
│   │   ├── clients/              # Feature: client management
│   │   │   ├── page.tsx
│   │   │   └── [clientId]/
│   │   │       ├── page.tsx
│   │   │       └── plans/
│   │   │           └── [planId]/page.tsx
│   │   └── templates/            # Feature: plan templates
│   │       └── page.tsx
│   ├── (client-portal)/          # Route group: client view (read-only)
│   │   ├── layout.tsx
│   │   ├── my-plan/page.tsx
│   │   └── progress/page.tsx
│   └── api/                      # API routes (if needed)
│       └── plans/route.ts
│
├── domain/                       # Pure business logic (NO infrastructure dependencies)
│   ├── types/                    # Entities and value objects (Zod schemas)
│   │   ├── Client.ts
│   │   ├── DietPlan.ts
│   │   ├── Food.ts
│   │   ├── Nutritionist.ts
│   │   ├── Progress.ts
│   │   └── BodyMeasurement.ts
│   └── services/                 # Deterministic business logic
│       ├── DietEngine.ts         # Portion calculation and equivalences
│       └── FoodDatabase.ts       # Food catalog abstraction
│
├── infrastructure/               # Ports & Adapters (infrastructure only)
│   ├── ports/                    # Interfaces (contracts)
│   │   ├── PlanRepository.ts     # Plan CRUD
│   │   ├── ClientRepository.ts   # Client CRUD
│   │   ├── ProgressRepository.ts # Progress tracking
│   │   ├── AuthProvider.ts       # Authentication
│   │   └── AIProvider.ts         # AI generation (future)
│   └── adapters/                 # Concrete implementations
│       ├── local/                # Adapter: localStorage (current MVP)
│       │   └── LocalStoragePlanRepository.ts
│       └── supabase/             # Adapter: Supabase (when migrated)
│           ├── SupabasePlanRepository.ts
│           └── SupabaseAuthProvider.ts
│
├── components/                   # Shared UI components
│   ├── ui/                       # Atomic components (Button, Card, Input)
│   ├── plan/                     # Domain components: plan visualization
│   ├── progress/                 # Domain components: tracking
│   └── layout/                   # Shell, navigation, sidebars
│
├── hooks/                        # Shared custom hooks
│   ├── usePlan.ts
│   └── useProgress.ts
│
├── lib/                          # Utilities and configuration
│   ├── registry.ts               # Service registry (simple adapter injection)
│   └── utils.ts
│
└── styles/                       # Global styles and theme
    └── globals.css
```

### 2.3 Dependency Rules

```
app/ → components/, hooks/, domain/, infrastructure/ports/
components/ → domain/types/, domain/services/ (pure functions), app/actions/ (Server Actions), hooks/
hooks/ → infrastructure/ports/, domain/
domain/ → NOTHING (pure, no imports from infra or UI)
infrastructure/adapters/ → infrastructure/ports/, domain/types/
```

> **Golden rule**: `domain/` NEVER imports from `infrastructure/`, `components/`, or `app/`.
> It is the heart of the system and must work without Next.js, without Supabase, without anything external.
>
> `components/` NEVER imports from `infrastructure/` (adapters or ports); data access goes through Server Actions in `app/actions/` or hooks.

### 2.4 Dependency Injection (Simple)

DO NOT use DI frameworks. A single `registry.ts` file exports concrete implementations:

```typescript
// src/lib/registry.ts
import { LocalStoragePlanRepository } from '@/infrastructure/adapters/local/LocalStoragePlanRepository';
import type { PlanRepository } from '@/infrastructure/ports/PlanRepository';

// Change here when migrating to Supabase
export const planRepository: PlanRepository = new LocalStoragePlanRepository();
```

This allows changing a single file to migrate all infrastructure.

---

## 3. Domain Model

### 3.1 Core Entities

```
Nutritionist (1) ──── (N) Client
     │                      │
     │                      ├── (N) DietPlan (history)
     │                      │        ├── (1-2) Diet (e.g., 6 days, 1 day)
     │                      │        │      └── (N) Meal
     │                      │        │            └── (N) MealBlock (BASE, SIDE_DISH, FAT, FRUIT)
     │                      │        │                  └── (N) FoodOption (with calculated grams)
     │                      │        └── (N) SnackOption
     │                      │
     │                      ├── (N) ProgressEntry
     │                      │        ├── daily weight
     │                      │        ├── daily steps
     │                      │        └── open questions
     │                      │
     │                      └── (N) BodyMeasurement
     │                               └── leg, glute, waist, bicep (by date)
     │
     └── (N) FoodTemplate (custom catalog per nutritionist)
              └── groups, bases, side dishes, fats, fruits
```

### 3.2 Tenancy

- **Model**: Single DB with `nutritionistId` as a filter on all queries
- A nutritionist has N clients
- A client belongs to a nutritionist (and optionally to a gym in V3)
- A gym has N clients (relationship independent of nutritionist)
- Plans always belong to a single nutritionist

### 3.3 Nutrition Plan (based on real-world structure)

A `DietPlan` contains 1-2 `Diet` (day-of-week variants):
- **Diet**: Applies to N specific days (e.g., "Use 6 days of the week")
- Each Diet has: Meals → MealBlocks → FoodOptions
- Blocks classified by type: `BASE`, `ACOMPAÑAMIENTO`, `GRASA`, `FRUTA`, `SUPLEMENTO`
- Snack section with numbered options
- General plan recommendations
- Fruit section with gram equivalence table

### 3.4 Nutritionist Workflow

1. Client submits monthly progress → weight, steps, body measurements, questions
2. Nutritionist analyzes client's evolution data
3. Nutritionist adjusts/creates a new plan based on client's goals and preferences
4. Plan is delivered to the client (currently as image/PDF)
5. **AI Opportunity**: Automate step 3 by generating a draft for the nutritionist to review

---

## 4. Tech Stack

### 4.1 Firm Decisions

| Technology | Usage | Notes |
|------------|-------|-------|
| **Next.js 15** (App Router) | Full-stack framework | Vite and react-router-dom removed |
| **TypeScript** (strict) | Language | Everything typed, no `any` |
| **Zod** | Schema validation | Data contracts, structured outputs for AI |
| **React 19** | UI | Server Components by default |

### 4.2 Current Decisions (interchangeable via ports)

| Technology | Usage | Port | Can migrate to |
|------------|-------|------|----------------|
| **MUI 7** | UI Components | — | Tailwind + shadcn/ui |
| **localStorage** | Persistence | `PlanRepository` | Supabase, PlanetScale |
| **Supabase** | Authentication | `AuthProvider` | Auth.js, Clerk |
| **No AI** | Generation | `AIProvider` | Vercel AI SDK, OpenAI |

### 4.3 Infrastructure

| Aspect | Decision | Notes |
|--------|----------|-------|
| **Hosting** | To be decided | Vercel is the natural option for Next.js |
| **DB** | To be decided | Evaluate costs: Supabase vs PlanetScale vs Neon |
| **Auth** | Supabase Auth | Unified login at `/login`, explicit invite process via Supabase Admin API, and Middleware RBAC. |

---

## 5. AI-Native Development

### 5.1 Principle

AI is first a development tool (code generation) and then a product feature (plan generation).

### 5.2 For Development

- All code must be generated with sufficient context: this AGENTS.md + OpenSpec specs + skills
- Prefer pure functions and small functions so AI can generate and unit test them
- Use Zod schemas as contracts: AI can generate code that respects the schema without seeing the full implementation
- OpenSpec defines functional specs; AGENTS.md defines technical constraints

### 5.3 For Product (future)

- **Plan draft**: AI generates a draft based on client history + nutritionist strategy → nutritionist reviews and adjusts → saved
- **AI Input**: Zod schemas of `DietPlan`, `ProgressEntry` history, `BodyMeasurement`, client preferences
- **AI Output**: Zod-validated `DietPlan` (structured output)
- **Validation**: The nutritionist ALWAYS reviews before delivering to the client

### 5.4 Candidate Processes for AI

| Process | Priority | Complexity |
|---------|----------|------------|
| Generate nutrition plan draft | High | Medium |
| Automatically calculate food equivalences | Medium | Low |
| Analyze client progress trends | Medium | Medium |
| Suggest adjustments based on weight evolution | Low | High |

---

## 6. Code Conventions

### 6.1 General

- **Code language**: English (variable names, functions, classes, files)
- **Domain language**: Spanish is acceptable in user-facing strings and block types (`ACOMPAÑAMIENTO`, `FRUTA`) since it is the nutritionist's domain language
- **Files**: `kebab-case` for component files, `PascalCase` for types/schemas
- **Functions**: Descriptive English verbs (`calculatePortions`, `generatePlan`)
- **Clean Code**: Apply principles from the `clean-code` skill (functions < 20 lines, descriptive names, no side effects)

### 6.2 Next.js

- Follow principles from the `nextjs-best-practices` skill
- **Server Components by default**: Only `'use client'` when interactivity is needed
- **Server Actions** for data mutations
- **Route Groups** to separate contexts: `(auth)`, `(dashboard)`, `(client-portal)`
- **Loading/Error states**: Use `loading.tsx` and `error.tsx` on each route

### 6.3 Domain

- `domain/` is pure: only TypeScript, no React, Next.js, or infrastructure imports
- Entities with Zod schemas + inferred TypeScript types
- Services as classes with static methods (current) or pure functions
- All calculation logic in `domain/services/` with unit tests

### 6.4 Components

- Atomic UI components in `components/ui/`
- Domain components in `components/{feature}/`
- Props typed with explicit interfaces
- No business logic in components — delegate to `domain/services/` or hooks

---

## 7. Testing

### 7.1 Strategy

| Layer | Test Type | Tool | Priority |
|-------|-----------|------|----------|
| `domain/services/` | Unit tests | Vitest | **High** — calculation logic must be deterministic |
| `infrastructure/adapters/` | Integration tests | Vitest | Medium — validate contracts with real providers |
| `app/` (full routes) | E2E tests | Playwright | Medium — critical nutritionist flows |

### 7.2 Rules

- Every domain service must have unit tests
- Infrastructure adapters must test against their port contracts
- E2E for critical flows: create plan, view plan, record progress
- AI can generate and maintain tests; consider AI-assisted TDD

---

## 8. Workflow

### 8.1 OpenSpec + AGENTS.md (Complementary)

| Aspect | OpenSpec | AGENTS.md |
|--------|---------|-----------|
| **What it defines** | Functional specs, changes, proposals | Architecture, conventions, technical decisions |
| **Granularity** | Per feature/change | Project-wide |
| **Evolution** | Changes are archived when implemented | Updated when architectural decisions are made |
| **Consumer** | AI + Developer when implementing a change | AI + Developer as global context |

### 8.2 Git Workflow

**Convention**: 1 OpenSpec change = 1 branch = 1 PR.

The PR serves as the **walkthrough and traceability record** for each change. No external reviewers needed — the PR documents what was done, decisions made, and verification results.

| Element | Convention | Example |
|---------|-----------|---------|
| **Branch name** | `change/<openspec-change-name>` | `change/clean-vite-react-router` |
| **PR title** | OpenSpec change name (human-readable) | "Clean Vite/React Router legacy" |
| **PR body** | Walkthrough: what changed, why, verification results | Use `pr-creator` skill |
| **Merge strategy** | Regular merge (preserves commit history) | `git merge --no-ff` |
| **Target branch** | `main` | — |

**Exceptions**: Trivial one-file fixes (typos, config tweaks) can go directly to `main`.

### 8.3 Development Flow

1. Consult `AGENTS.md` for global technical context
2. Use OpenSpec to define the change (`/opsx-new`, `/opsx-ff`)
3. Create feature branch: `git checkout -b change/<name>`
4. Implement following the conventions in `AGENTS.md` (`/opsx-apply`)
5. Verify with the defined testing strategy
6. Create PR to `main` with walkthrough summary
7. Merge PR
8. Archive the change (`/opsx-archive`)
9. Update `AGENTS.md` if new architectural decisions were made

---

## 9. Pending Decisions

| Decision | Context | When to Decide |
|----------|---------|----------------|
| DB Provider (Supabase vs PlanetScale vs Neon) | Evaluate costs and features for expected volume | Before V1 (multi-client) |
| Auth Provider | **Decided:** Supabase Auth is now implemented using the `AuthProvider` port. | ✅ Resolved |
| UI Library (keep MUI vs migrate to Tailwind + shadcn/ui) | Tailwind is more AI-friendly and flexible; MUI already works | During full Next.js migration |
| Hosting (Vercel vs alternatives) | Vercel is natural for Next.js but evaluate costs | Before V1 |
| AI Provider (OpenAI vs Anthropic vs other) | For plan draft generation | V2 or when the nutritionist confirms the workflow |

---

## 10. Design & UI Implementation (Stitch)

When a design URL from Stitch is provided in a requirement or OpenSpec (e.g., `https://stitch.withgoogle.com/projects/...`):

1. **Mandatory MCP Usage**: The AI MUST use the `mcp_StitchMCP_get_screen` tool to fetch the actual layout details, HTML Code, and dimensions of the specific node.
2. **Never Hallucinate Designs**: Do not rely solely on text descriptions or high-level goals. You must extract and adapt the exact structure provided by the Stitch MCP response.
3. **Integration**: Adapt the fetched semantic structure into the project's Next.js component structure as faithfully as possible to match the provided Premium Design.
