# Changelog

## Unreleased — 2026-10-08

- Add Ubuntu 26.04 validation and browser preflight jobs, keeping existing CI
  check names, runner labels, runtime pins, frozen installs, audit policy, and
  database isolation. The probes verify the exact PR head and record the image.
- Give the new browser job its own failure-artifact name. No workflow gains
  write permissions. Revert the two added jobs to remove the preflight.
- Passing local checks do not establish hosted Ubuntu 26 compatibility; use the
  workflow run and tested head before choosing migration or an Ubuntu 24 hold.

- Repair the confirmed Ubuntu 26 native SQLite install failure (`node-gyp: command
not found`) by exposing node-gyp already bundled with the configured Node/npm
  runtime before each frozen install. No global package download is added.
- Run the additive Ubuntu 26 browser probe independently, so an unrelated audit
  finding does not prevent collecting browser evidence. Existing validation and
  E2E dependencies remain unchanged; audit findings still fail CI.
