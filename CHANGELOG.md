# Changelog

## Unreleased — dependency security and platform hardening

- Resolve Sharp 0.35.5 and source-map-js 1.2.2 with reviewed overrides.
- Check all locked copies, including nested resolutions; reject missing,
  malformed and prerelease evidence. Regression tests cover vulnerable copies.
- Preserve lint/type-check/unit/build/browser gates; use frozen installs,
  bounded read-only CI and bundled Node/npm native-build tooling.
- Add explicit Ubuntu 26 probes and maintenance rules with version-bound proof,
  security exception review, rollback limits and platform support boundaries.
- ESLint remains on its compatible 9.x line; no rule or peer bypass is added.
- Include the native SQLite provisioning and Ubuntu 26 preflight from draft
  PR #32; retain its original validation dependency and existing braces exception.
