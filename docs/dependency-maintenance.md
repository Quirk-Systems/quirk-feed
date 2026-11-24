# Dependency and platform maintenance

Owner: Quirk Systems / Bryan. These rules govern this application's dependency
maintenance; they do not authorize merges, releases or deployments.

## Required proof

- Read the current base and resolve packages from the committed Bun lockfile.
  Regenerate it with the repository's pinned Bun, using targeted changes only.
  A newer generator requires an unchanged readable lock format and a successful
  frozen install on the pinned runtime before adoption.
  Review every changed package, including optional native binaries for Linux
  glibc/musl, macOS, Windows and supported CPU architectures.
- CI must install with `bun install --frozen-lockfile`. Run
  `bun run security:test` and `bun run security:check`, then the existing lint,
  type-check, unit, build and browser checks. Check that validation did not
  rewrite tracked files.
- The security check examines every locked Sharp and source-map-js copy,
  including nested copies. It rejects missing/malformed evidence and unreviewed
  prereleases. It is a regression floor, not a complete vulnerability scanner.
  Keep the live advisory audit alongside it.
- A major upgrade requires compatible peer ranges and an actual lint/build
  pass. ESLint 10 remains unsuitable while the React plugin calls the removed
  `getFilename` API. Do not disable rules, shim APIs or override peers to make a
  candidate appear compatible.
- Record source SHA, OS image, Node/Bun versions, resolved versions, commands
  and observable results. A source, runtime, runner image or lockfile change
  invalidates previous compatibility proof.
- Test a forthcoming runner independently before relying on `ubuntu-latest`.
  Use the node-gyp bundled with configured Node/npm for native SQLite builds;
  fail if unavailable. Never depend on runner-global tools or silently download
  a new global toolchain.
- Node support is limited to declared release lines. A future major is a
  candidate until native install, validation and browsers pass on that line.
  macOS, Windows, musl and other CPU targets require their own evidence;
  the portable lockfile alone does not prove runtime portability.
- Advisory exceptions require a named GHSA, actual dependency/exposure chain,
  owner, reason, review date and removal condition. Revisit within 30 days and
  whenever a fixed release or exposure change appears. Never silence new
  findings merely to unblock CI.

## Security intervention — October 8, 2026

Pin transitive security overrides to `sharp@0.35.5` and
`source-map-js@1.2.2`. This prevents a fresh resolution returning to the observed
affected versions while keeping Next, React and the lint stack unchanged.

- [Sharp GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w):
  versions below 0.35.5 are affected. Prebuilt 0.35.5 provides fixed librsvg.
  A globally supplied librsvg must independently be at least 2.63.2; application
  lockfile repair does not patch a system library.
- [source-map-js GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q):
  affected range is >=1.0.0,<1.2.2; malformed indexed maps can block the event
  loop. The observed build consumers include PostCSS/Tailwind. External map
  reachability is not established.

Exact overrides are temporary remediation constraints, not perpetual freezes.
Review them by November 7, 2026 or when a newer security fix appears; replace or
remove only after the resolved graph and validation prove equal protection.

## Recovery and handoff

A failed gate leaves the PR a candidate. Preserve failing logs, name the first
failed install/configuration path, repair only that path, and rerun affected
checks at the new head. Missing evidence stays unknown. Do not claim broad
platform compatibility from one passing image.

Rollback restores the prior manifest, lockfile, guard and workflow together,
which may restore vulnerable packages. Prefer forward repair; restoring an
affected version requires explicit risk acceptance. Recheck the main branch
before updating any candidate so unrelated changes are preserved.

Status: proposed maintenance rules and security repair. Hosted checks determine
admission; no production deployment or system-library inspection is established.
