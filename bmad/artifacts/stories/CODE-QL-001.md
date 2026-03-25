# CODE-QL-001 — Increase unit test coverage for authentication module

Module: authentication
Severity: Critical
Owner: Backend Team
Target Date: 2026-03-25

Issue:
Insufficient unit test coverage for authentication module (62% vs target 85%).

Evidence:

- Coverage report: path/to/coverage (replace with actual)
- CI job output: link/to/ci-job

Remediation:

- Add unit tests for edge cases: token expiry, refresh flow, invalid tokens, concurrency.
- Update CI to enforce coverage threshold for the authentication module.
- Add integration tests where appropriate.

Acceptance Criteria:

- Authentication module coverage >= 85% as reported by coverage tool.
- All new and existing tests pass in CI.
- Tests added under tests/auth/ with clear naming and coverage reports.

BMAD Action:
`bmad dev story CODE-QL-001`
