# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Full architecture decisions and conventions live in `AGENTS.md`. This file is the Claude Code–specific entry point. Read `AGENTS.md` before making architectural decisions.

---

## Commands

> **Package Manager**: We use **Yarn** (not npm) for faster dependency resolution, better lock file consistency, and improved monorepo support.

```bash
yarn dev       # Start development server (localhost:3000)
yarn lint      # Run ESLint
yarn email     # Start React Email dev server (localhost:3001)
```

E2E tests (Playwright):
```bash
yarn playwright test              # Run all E2E tests
yarn playwright test --ui         # Interactive UI mode
yarn playwright test <file>       # Run a single test file
```

Unit tests use **Vitest** (not yet configured — target `domain/services/`).

---

## Architecture

**Stack**: Next.js App Router · React 19 · TypeScript (strict) · Tailwind CSS v4 (hand-rolled, no MUI) · MongoDB (Mongoose) · Supabase Auth · Zod · Playwright

### Folder roles

| Path | Role |
|------|------|
| `src/app/` | Routes, layouts, Server Actions — Next.js App Router |
| `src/domain/` | **Pure business logic** — no React, no infra imports |
| `src/infrastructure/` | Ports (interfaces) + Adapters (Supabase, MongoDB) |
| `src/components/` | UI — `ui/` for atomic, `{feature}/` for domain components |
| `src/lib/registry.ts` | Simple DI — swap adapter here to change infrastructure |

### Dependency rule (strict)

```
app/ → components/, domain/, infrastructure/ports/
components/ → domain/types/
domain/ → NOTHING (pure TypeScript only)
infrastructure/adapters/ → infrastructure/ports/, domain/types/
```

`domain/` is the heart of the system. It must never import from `infrastructure/`, `components/`, or `app/`.

### Route groups

- `(auth)/` — login, password reset
- `(dashboard)/` — nutritionist-facing views
- `(client-portal)/` — read-only client views

### Domain model (abbreviated)

```
Nutritionist → (N) Client → (N) DietPlan
  DietPlan → Meal → MealBlock [BASE | ACOMPAÑAMIENTO | GRASA | FRUTA]
                              → FoodOption (name, grams)
           → SnackOption[]
```

### Key conventions

- **Server Components by default** — only add `'use client'` for interactivity
- **Server Actions** for mutations (in `src/app/actions/`)
- **Zod schemas** define all domain entities in `src/domain/types/`
- **Code in English**, Spanish is acceptable for domain-facing strings and block type names
- `kebab-case` for files, `PascalCase` for types and components
- No business logic in components — delegate to `domain/services/` or hooks

### Design (Stitch)

When a Stitch URL is provided, use `mcp_StitchMCP_get_screen` to fetch actual layout details. Never infer designs from text descriptions alone.
