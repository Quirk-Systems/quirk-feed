# Working on Quirk Feed

Owner: **Quirk-Systems/quirk-feed**. This is a small shared micro-feed, not an
authenticated social platform. Preserve its post-and-timeline flow and public
handle semantics unless the user explicitly changes the product boundary.

## Runtime and commands

Next.js 16 App Router, React 19, TypeScript 6.0, Tailwind 4, Drizzle + native
SQLite, Vitest 5, Playwright, Node 24, Bun 1.4.2. Exact runtime files and
`package.json` are authoritative. Use `bun install --frozen-lockfile`.

`bun run validate` runs formatting, lint, route type generation, type-checking,
tests, and build. `bun run test:e2e` adds browser proof using its own database.
Never run tests or migrations against a user's database.

## Feature map

- `src/app/page.tsx`: dynamic Node page using the database timeline query.
- `src/app/actions.ts`: validate text fields, save, then revalidate.
- `src/components/post-form.tsx`: controlled draft, pending state, recovery.
- `src/lib/feed.ts`: pure input validation and time helpers.
- `src/lib/db/connection.ts`: open, migrate, close on initialization failure.
- `src/lib/db/index.ts`: server-only lazy singleton.
- `src/lib/db/queries.ts`: newest-first query with deterministic ties and limit.
- `scripts/database.ts`: explicit migration, read-only doctor, safe backup.
- `scripts/e2e.mjs`: isolated browser-test database and port.
- `docs/next16-upgrade.md`: scoped decisions and verification receipt.

## Conventions

Use Server Components by default and `@/` imports inside app source. Use explicit
`.ts` imports only where Node's native TypeScript runner needs them. Keep SQLite
on the server; add focused failure cases alongside behavior changes. Preserve
existing migration files and data. Do not swallow initialization errors.

Do not disable lint rules to hide upgrade defects. ESLint 10 and TypeScript 7
remain outside the installed lint plugins' supported ranges; recheck upstream
compatibility before upgrading them. Vite handles TypeScript path aliases
natively, so no separate path-resolution plugin is needed.

Keep code, commands, README, and tests aligned. A passing candidate does not prove
production deployment or grant merge/deploy authority.
