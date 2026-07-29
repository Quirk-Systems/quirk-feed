# quirk-feed

A quirky micro-feed. Post short updates, watch the timeline.

Built on the Quirk Systems scaffold: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · Vitest · Playwright · Bun.

## MVP feature

- **Post** a short update (handle optional, body up to 280 chars).
- **Timeline** renders newest-first with compact relative timestamps.
- Posts persist via Drizzle + SQLite. The database self-migrates on startup, so the app boots clean in dev, production, and CI.

Core logic lives in pure, unit-tested helpers (`src/lib/feed.ts`); the post mutation is a server action (`src/app/actions.ts`); the page (`src/app/page.tsx`) is a server component that reads the timeline.

## Getting Started

```bash
bun install
cp .env.example .env
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `bun run dev`         | Start dev server (migrates first)      |
| `bun run validate`    | Lint + type-check + unit tests + build |
| `bun run test`        | Unit tests (watch)                     |
| `bun run test:e2e`    | E2E tests (Playwright)                 |
| `bun run db:generate` | Generate a Drizzle migration           |
| `bun run db:studio`   | Open Drizzle Studio                    |

## License

[Apache 2.0](LICENSE)
