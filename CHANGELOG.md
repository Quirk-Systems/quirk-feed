# Changelog

## Unreleased candidates

- **Blocked:** replace stale PR #23 with a Bun-generated ESLint 10 lockfile
  candidate. The current React lint plugin crashes under ESLint 10; import and
  accessibility plugins also exclude it from their peer ranges. This is not a
  shipped upgrade. See [compatibility evidence](docs/eslint10-compatibility.md).
