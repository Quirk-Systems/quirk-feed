# CLAUDE.md

## Project Overview

**quirk-feed** is a quirky micro-feed: post short updates and watch a newest-first timeline. It is a lean app derived from the Quirk Systems `project-scaffold`, keeping the scaffold's conventions (Next.js 15 App Router, TypeScript strict, Tailwind v4 CSS-first, shadcn/ui new-york, Drizzle ORM + SQLite, Vitest, Playwright) while trimming layers this product does not use (auth, server-state query, etc.).

## Tech Stack

| Category   | Tool                                 |
| ---------- | ------------------------------------ |
| Runtime    | Bun                                  |
| Framework  | Next.js 15 (App Router, Turbopack)   |
| Language   | TypeScript (strict)                  |
| Styling    | Tailwind CSS v4 + shadcn/ui          |
| Database   | Drizzle ORM (SQLite, better-sqlite3) |
| Unit tests | Vitest + Testing Library             |
| E2E        | Playwright                           |

## Commands

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `bun run dev`         | Dev server (runs migrations first)     |
| `bun run validate`    | lint + type-check + unit tests + build |
| `bun run test`        | Unit tests (watch)                     |
| `bun run test:e2e`    | Playwright E2E                         |
| `bun run db:generate` | Generate a Drizzle migration           |

## Feature map

- `src/lib/feed.ts` — pure helpers: `validatePost`, `sortByNewest`, `relativeTime` (unit-tested in `src/lib/feed.test.ts`).
- `src/app/actions.ts` — `createPost` server action (validate → insert → revalidate).
- `src/components/post-form.tsx` — client form using `useActionState`.
- `src/app/page.tsx` — server component that renders the timeline (`force-dynamic`).
- `src/lib/db/schema.ts` — `posts` table; migrations in `drizzle/`.
- `src/lib/db/index.ts` — opens SQLite (WAL) and self-applies migrations on startup, so the app boots clean in dev, production, and CI.

## Conventions

- Server Components by default; add `"use client"` only for interactivity.
- Import via the `@/` alias.
- Keep business logic in pure helpers under `src/lib/` and unit-test it; use E2E for DB-backed pages.
- Conventional commit messages.
