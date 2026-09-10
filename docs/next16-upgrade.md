# Next 16 upgrade record

Owner: **Quirk-Systems/quirk-feed**. Status: **candidate under verification**.
Inspection date: 2026-09-10. Baseline: `1420ef2e8d3efc23519c7a3b88d5c2d18bb61720`.
Original dependency candidate: [PR #5](https://github.com/Quirk-Systems/quirk-feed/pull/5),
head `3e040633c434728ee4882de9bcea92b99c78c7c7`.

## Decision and boundaries

Complete the upgrade to stable **Next 16.3.4**, with matching `@next/env` and
`eslint-config-next`. Preserve the micro-feed, existing posts, public handles,
SQLite schema, and Quirk semantic authority. No merge, deployment, or live data
change is included in this candidate.

The baseline built with Next 15.5.22 and passed nine unit and six browser tests.
PR #5 installed 16.2.12 but failed during legacy `FlatCompat` lint configuration;
its later validation and browser checks were skipped. The eight advisories
applicable to Next 15 had already been patched in 15.5.21; security notes alone
did not require a major upgrade. This pass follows the user's subsequent
authorization to implement the full upgrade.

## Changes with a user benefit

- Native ESLint flat configuration restores validation. Route types are generated
  before type-checking, including on a clean checkout.
- A committed Bun lockfile and aligned runtime files make installations repeatable.
- Node-only, lazy SQLite startup prevents build-time database writes and reuses
  the connection through development reloads. Failed migrations close the
  connection and report the failure instead of silently continuing.
- Server Actions reject file values in text fields, enforce a 16 KiB request
  limit, and return a recoverable message when a write fails. Write-error logs
  include only a diagnostic code, not SQL parameters or post contents. The request limit
  supplements patched framework behavior; it is not a substitute for patching.
- Controlled form fields preserve drafts after rejected or unconfirmed requests,
  prevent editing/double submission while pending, and clear after confirmed saves.
- The timeline orders equal-second timestamps by insertion order and keeps its
  existing 100-post bound. No database migration or timestamp rewrite is needed.
- Read-only diagnostics report installed versions and database integrity; backups
  include WAL data and refuse to overwrite any existing destination.
- Browser tests use a unique database and port, never reuse a running server,
  and exercise write failure/retry and oversized requests in isolation.
- Dependabot configuration no longer requires nonexistent labels or generates
  duplicated commit scopes. The manifest no longer references a nonexistent local
  extensions file; its registry, required policy, and projections are unchanged.

## Dependency dispositions

| Existing candidate             | Disposition in this upgrade                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| #5: Next 16.2.12               | Advance to stable 16.3.4, with actual migration work                                                                           |
| #3 / #4: checkout / setup-node | Use version 7 actions and Node 24                                                                                              |
| #8: Tailwind helpers           | Upgrade to Tailwind 4-compatible helper/formatter versions                                                                     |
| #16: native SQLite             | Upgrade better-sqlite3 to 13.0.3 and matching type definitions                                                                 |
| #19: React test transform      | Upgrade plugin-react to 6.1.1 with explicit Vite 8                                                                             |
| #21: testing                   | Upgrade compatible testing packages, including Vitest 5                                                                        |
| #11: path-resolution plugin    | Remove it; Vite 8 supplies native tsconfig path resolution                                                                     |
| #9: ESLint 10                  | Keep ESLint 9.39.5: current React and JSX accessibility plugins do not support 10; update Prettier configuration independently |
| #10: TypeScript 7              | Use TypeScript 6.0.3: typescript-eslint 8.70.0 requires TypeScript below 6.1                                                   |
| #20: Node 26 types             | Match types to supported Node 24 instead of declaring APIs from an untested runtime                                            |

These are compatibility decisions, not suppressed test failures. Existing PRs
remain separate until a maintainer chooses their disposition. Recheck the actual
upstream peer ranges before advancing the deferred majors.

The transitive `@esbuild-kit/core-utils` used by Drizzle tooling still requests
vulnerable esbuild 0.18.20. A documented package override selects **0.28.2**;
verify schema generation as well as the normal build after any change to it.
Remove the override once the parent dependency resolves a patched version itself.

## Security paths and remaining operating limits

The app's public form reaches `createPost`, so Server Action CPU exhaustion and
action-reference disclosure prerequisites exist on affected framework versions.
There are no private action boundaries to infer from the current product. The
repository has no middleware/proxy, locale configuration, dynamic external
rewrites, server-side fetch caching, configured remote images, or Edge actions.
Normal startup is `next start`; a custom external hosting wrapper has not been
inspected. The newer Next 16.3.3 security release is included in 16.3.4.

This is not proof that a deployed instance runs these files. Use `bun run doctor`
inside the serving artifact, and separately verify its startup and proxy settings.
The public feed still needs an access/abuse/moderation/retention decision before
broader exposure. No authentication product or centralized Quirk policy was added.

## Verification receipt

Final validation results will be recorded here before handoff. Evidence must
distinguish local execution, hosted CI, and deployed behavior. A production-ready
or independently approved security claim has not been made.

Observed repair attempts: the initial latest-version install exposed unsupported
ESLint 10 and TypeScript 7 peer ranges. The local native build encountered a
container header-extraction ownership error; supplying unmodified Node headers
extracted without ownership changes allowed the native tests to execute. A new
test hook incorrectly returned a mock function under Vitest 5's teardown semantics;
the hook now returns nothing. Local browser asset downloads initially timed out;
the official fallback supplied Firefox/WebKit, but this container lacks the
system libraries needed to execute them. Hosted CI successfully installed all
browser dependencies. Its first browser run passed 16 cases; eight failure-path
cases stopped at an ambiguous alert locator that also matched Next's route
announcer. Those assertions now target the form's alert, retaining strict
matching and the full recovery/no-write checks.

Reusable deposit: the isolated E2E runner, database recovery fixtures, and serving
artifact diagnostic command are available in this repository. Reuse elsewhere
requires that system's own compatibility check. No cross-system promotion is claimed.

## Primary sources

- [Next 16 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [Next 16.3.4 release](https://github.com/vercel/next.js/releases/tag/v16.3.4)
- [Next 16.3.3 security release](https://github.com/vercel/next.js/releases/tag/v16.3.3)
- [Next 16.2.11 advisories](https://github.com/vercel/next.js/releases/tag/v16.2.11)
- [esbuild advisory](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99)
- Exact dependency versions and integrity hashes: `bun.lock`.

Receipt invalidators: source or dependency changes, changed runtime/hosting,
authentication changes, new middleware/rewrites/fetch/image paths, or new advisories.
