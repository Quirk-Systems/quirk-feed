# Quirk Feed

Post short updates. Watch the newest-first timeline. Keep the quirk.

A small Next.js 16 App Router app with React 19, TypeScript, Tailwind CSS 4,
shadcn/ui, Drizzle ORM, and SQLite. Owned by **Quirk-Systems/quirk-feed**.


## Intended role — Bryan's decision, October 8, 2026

Feed's primary role is a **private Quirk activity surface** for human updates,
agent receipts and reviewable proposed moves. This is the selected direction,
not a claim that the existing micro-feed implements these capabilities.

The current app remains an unauthenticated text feed. Do not expose private
activity until access control and identity have been implemented and verified.
A display handle does not establish a human or agent identity.

### Required operating boundaries

- Human updates, agent receipts and proposed moves must be distinguishable.
  A proposal is not approval; displaying an approval is not an execution grant.
- Receipts must identify the actor, source object/version, attempted action,
  observed outcome and evidence reference. Report unknown or failed outcomes
  explicitly. Never infer completion from a posted message.
- Proposed moves must link to the responsible authority surface. Feed must not
  execute provider writes or manufacture grants from reactions, text or status.
- Imports require authenticated adapters, stable source IDs and idempotent
  ingestion. Retries must not duplicate events; ordering must preserve source
  timestamps separately from ingestion time.
- Keep provider credentials server-side and scoped to the adapter. Activity
  payloads and evidence links require secret filtering and access checks.
- Define retention, deletion, backup and restore behavior before storing private
  receipts. A timeline is not the authoritative evidence store.
- SQLite requires persistent local storage. CDN caching must not expose private
  responses; blob/media references require their own authorization and lifecycle.
  Multi-host writes, sync and external distribution remain unimplemented.
- Runtime filesystem traversal must have an explicit allowed root, symlink
  policy and bounded work. Do not assume lint-glob compatibility establishes
  safe media ingestion, backup traversal or recursive synchronization.

### Dependency repair admission

The Pet replacement is a candidate for Feed, not inherited proof. Preserve
Next lint enforcement and require Feed-specific tests of installed dependency
identity, every locked consumer, literal/relative/glob roots, hidden paths,
broken links, symlink cycles, out-of-root links and bounded termination.
Any unsupported root configuration must fail explicitly rather than silently
reduce lint coverage. Test audit integrity without ignored advisories.

Then verify frozen installation, security guards, application tests, production
build and existing/Ubuntu 26 browser workflows at the resulting exact commit.
Do not extend runtime or hosting support from a passing lint fixture.

Investigation status: Pet's inspected local patch targets Next ESLint 16.3.8,
matching Feed's declared version. Its inspected tests do not contain symlink-cycle
coverage. No replacement has been applied to Feed and no new compatibility
run is established. The existing braces exception remains.

## Start locally

Install Node **24.21.0** (pinned in `.node-version`) and Bun **1.4.2**.
Use the committed Bun lockfile; Bun installs dependencies, while Next.js and
database commands run on Node.

```bash
bun install --frozen-lockfile
bun run dev
```

Open [localhost:3000](http://localhost:3000). No environment file or external
service is required. The first request creates `local.db` and applies the
committed migrations. An optional `.env` can set `DATABASE_URL` to a SQLite
**file path**, such as `./data/feed.db`; parent directories are created.

Use a persistent, writable local disk. Native SQLite requires a Node server;
Edge runtimes and ephemeral serverless filesystems are not supported.

## Use the feed

- Enter up to 280 characters. Handles are optional and limited to 40 characters.
- Blank handles become `anon`. The timeline shows the newest 100 posts, including
  deterministic ordering when multiple posts share a timestamp.
- A confirmed save clears the form and refreshes the timeline.
- A failed save preserves the draft. If the connection fails after submission,
  check the timeline before retrying because the server may have saved it.
- Theme selection persists in the browser.

This is an **unauthenticated shared feed**. A handle is display text, not a verified
identity. Public hosting requires a separate decision about access, abuse controls,
moderation, and retention. The framework upgrade does not supply those policies.

## Commands

| Command                                 | What it does                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `bun run dev`                           | Development server using Turbopack                                                                         |
| `bun run build`                         | Production build; does not initialize the database                                                         |
| `bun run start`                         | Serve the production build                                                                                 |
| `bun run preview`                       | Build and start production locally                                                                         |
| `bun run validate`                      | Formatting, zero-warning lint, generated route types, type-check, unit/integration tests, production build |
| `bun run test`                          | Vitest watch mode                                                                                          |
| `bun run test:run`                      | Run unit, component, action, and database tests                                                            |
| `bun run test:coverage`                 | Run tests with V8 coverage                                                                                 |
| `bun run test:e2e:install`              | Install browser engines and OS dependencies                                                                |
| `bun run test:e2e`                      | Build and test Chromium, Firefox, WebKit, and mobile Chromium                                              |
| `bun run test:e2e:ui`                   | Open Playwright UI with an isolated database                                                               |
| `bun run lint:fix`                      | Apply supported lint fixes                                                                                 |
| `bun run format`                        | Format source and documentation                                                                            |
| `bun run format:check`                  | Check formatting                                                                                           |
| `bun run db:migrate`                    | Apply committed migrations explicitly                                                                      |
| `bun run db:generate`                   | Generate a migration after a schema edit                                                                   |
| `bun run db:studio`                     | Open the local database editor; it can modify data                                                         |
| `bun run db:push`                       | Apply schema directly; disposable development databases only                                               |
| `bun run db:backup -- ./feed-backup.db` | Create a consistent backup without overwriting a file                                                      |
| `bun run doctor`                        | Read database integrity and installed Node/Next/React versions                                             |
| `bun run clean`                         | Remove dependencies and build output; preserve the database                                                |

Run commands from the repository root. The development and production commands
must use the same intended database path.

## Verification

```bash
bun install --frozen-lockfile
bun run validate
bun run test:e2e:install
bun run test:e2e
bun audit
```

The E2E runner always creates a temporary database and port, refuses reuse of an
existing server, and cleans up its database afterward. Direct `playwright test`
is intentionally rejected without the runner's isolation settings. Tests inject
write failures and oversized requests only into this disposable instance.

CI uses the same pinned runtimes and frozen install, checks that validation does
not modify tracked files, and preserves browser failure traces for seven days.
The app's CI actions are pinned to verified full commit SHAs, and checkout does
not retain Git credentials. Each job records the tested commit and its parents:
pull-request CI normally tests GitHub's synthetic merge, not the head alone.

## Operate and recover

For production, install and build the reviewed commit, then start it on the
persistent host. Set `NODE_ENV=production` when running the database commands to
load the production environment with Next's normal environment-file precedence.

```bash
bun run db:migrate
bun run doctor
bun run build
bun run start
```

Run `doctor` inside the **serving artifact** to establish installed versions.
A repository manifest, dependency PR description, or historic CI run is not proof
of the deployed version. The command checks an existing database read-only; it
does not create one. It also checks the columns and `rowid` used by the timeline;
this is a query-compatibility check, not certification of the full schema or
migration history.

Before an upgrade, create a backup to a new filename:

```bash
bun run db:backup -- ./feed-before-upgrade.db
```

The backup API includes data in SQLite's WAL. Do not copy only a live `.db` file.
The backup destination's parent directory must already exist. Store backups
outside version control and protect them like the original database.

The command stages the transfer privately, reopens the copy read-only, and
requires a full SQLite `integrity_check` before publishing it without replacing
an existing file. This adds a scan of the backup before success is reported.
The destination filesystem must support
hard links. A killed process can leave a private `.quirk-feed-backup-*` staging
directory beside the destination; remove it only after confirming no backup job
is using it. An incomplete transfer never creates the requested backup filename.
An integrity check proves neither freshness nor survival of a host power loss.
Confirm the destination filesystem's hard-link and durability guarantees before
using this recovery path in production; the CI fixtures do not simulate power loss.

If startup fails, check the database path, disk permissions, disk capacity, and
the committed `drizzle/` directory. Migration errors stop initialization and are
logged; they are never silently treated as success. The page presents a retry
state, and failed posts return a generic error without revealing database details.

For this upgrade, the database schema is unchanged. To roll back code, stop the
app and restore the previous reviewed artifact using the same database. To
restore data, stop every app process first, preserve the current database and
its `-wal`/`-shm` files together, and put the verified backup at `DATABASE_URL`
with no stale sidecars at that destination. Run `doctor` before reopening access.
Do not restore a database while the app is serving requests.

## Maintenance decisions

See [the upgrade record](docs/next16-upgrade.md) for dependency compatibility,
security-path findings, verification evidence, and limits. Keep `next`,
`@next/env`, and `eslint-config-next` aligned. Update the Bun lockfile with every
dependency change and validate it before review.

## License

[Apache 2.0](LICENSE).
