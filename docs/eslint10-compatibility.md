# ESLint 10 compatibility attempt

Observed: 2026-10-07. Disposition: **blocked; do not merge**.
Base: `a338ea3e0158437167cd875bb4655b67c3b9dc68` (current `main` at inspection).
Supersedes the stale npm-and-yarn updater attempt in [PR #23](https://github.com/Quirk-Systems/quirk-feed/pull/23).

## Candidate

Changed only the ESLint requirement to `^10.10.0` and regenerated `bun.lock`
with Bun 1.4.2. It resolves ESLint 10.12.0. Next.js, `@next/env`, and
`eslint-config-next` remain 16.3.8. The existing Bun-native Dependabot
configuration is retained. No lint rules are disabled or plugin APIs patched.

## Concrete compatibility blocker

`bun run validate` passes formatting, then exits at lint with:

```text
ESLint: 10.12.0
TypeError: Error while loading rule 'react/display-name': contextOrFilename.getFilename is not a function
Occurred while linting drizzle.config.ts
```

The stack points to `eslint-plugin-react/lib/util/version.js:31`, then
`usedPropTypes.js` and `Components.js`. A direct `bun run lint` reproduces it.

| Installed package               | ESLint peer support    | Result for ESLint 10                |
| ------------------------------- | ---------------------- | ----------------------------------- |
| eslint-config-next 16.3.8       | >=9.0.0                | Config itself accepts 10            |
| eslint-plugin-react 7.37.5      | ^3 through ^8, or ^9.7 | Excludes 10; crashes loading a rule |
| eslint-plugin-import 2.32.0     | ^2 through ^8, or ^9   | Excludes 10                         |
| eslint-plugin-jsx-a11y 6.10.2   | ^3 through ^9          | Excludes 10                         |
| eslint-plugin-react-hooks 7.1.1 | Includes ^10.0.0       | Accepts 10                          |
| typescript-eslint 8.70.0        | Includes ^10.0.0       | Accepts 10                          |

These ranges are read from the installed package manifests and match the
candidate lockfile. A successful Bun install does not prove plugin compatibility.

## Local verification

Runtime: Node 24.21.0 and Bun 1.4.2, matching the committed runtime files.

| Command/check                           | Observed result                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| bun install --frozen-lockfile           | Pass; lockfile unchanged                                                                                                                   |
| bun run validate                        | Fail at lint after formatting passes; later stages skipped                                                                                 |
| bun run type-check                      | Pass, run independently                                                                                                                    |
| bun run test:run                        | 33/33 pass on sequential rerun; first concurrent run had one 5-second CLI test timeout                                                     |
| bun run build                           | Pass, run independently                                                                                                                    |
| bun run test:e2e:install                | Blocked: OS dependency installation fails on setgroups/setegid/seteuid permissions                                                         |
| bun run test:e2e                        | Build and server startup succeed; all 24 cases fail at browser launch because browser executables are absent; no browser behavior verified |
| bun audit --ignore=GHSA-vfj7-8cjw-p6xm  | Fail: sharp 0.35.4 and source-map-js 1.2.1 have high advisories; their lock entries are byte-identical to base main                        |
| Pinned semantic core registry lint      | 0 errors, 21 existing missing-alias warnings                                                                                               |
| Repository semantic manifest validation | Pass, policy mode required                                                                                                                 |
| git diff --check                        | Pass                                                                                                                                       |

The semantic commands use policy commit
`92e5b2d928f25d0fedae87aaad2ef764a806065d`, exactly as the repository's reusable
workflow does. The required manifest keys, registry authority, and policy mode
were checked. This does not grant canonical, runtime, or deployment authority.

Initial native SQLite installation failed while node-gyp extracted Node headers
with unsupported ownership operations. Extracting the same Node 24.21.0 headers
with `tar --no-same-owner` and rebuilding locally succeeded. This is a local
environment workaround, not a repository change.

## What unblocks this update

Obtain an upstream linting stack whose React, import, and accessibility plugins
support ESLint 10 and whose rules execute without removed-context-API failures.
Regenerate the Bun lockfile from then-current main and rerun frozen installation,
full validation, audit, all four E2E projects, and pinned semantic governance.
Preserve the checks and rule coverage. Do not merge this candidate merely because
installation or application build succeeds.

Results apply to this candidate's dependency/configuration bytes. Dependency,
source, base, runtime, or policy changes require fresh verification. Hosted checks
and exact-head links belong in the replacement PR discussion.
