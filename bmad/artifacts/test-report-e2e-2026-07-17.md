# E2E validation report — 2026-07-17

## Result

- Browser: Google Chrome through Playwright's Chromium project
- Active checks: 6 passed, 0 failed
- Legacy checks: 22 skipped with an explicit incompatibility reason
- Duration: 37 seconds for the complete Chromium project

## Validated journeys

1. A configured user reaches the chat landing page without returning to onboarding.
2. The configured application shell renders its chat navigation structure.
3. A new conversation opens from the landing page and exposes the message input.
4. A new user sees the onboarding wizard.
5. The onboarding title and navigation controls render.
6. Moving from the profile step triggers the Ollama connection result.

## Repairs made to the harness

- The preconfigured browser state now uses the real `wollama_user` local-storage document.
- Local Chromium runs use the installed Chrome channel, so a downloaded Playwright browser is not required.
- Playwright starts Vite directly on port 5176 instead of relying on `npm` being globally available.
- The configured-user shell received two current, deterministic smoke checks.
- Obsolete suites no longer produce false positives from optional selectors.

## Remaining E2E debt

- Seven chat-management checks target an older `/chat` contract and obsolete CRUD controls.
- Nine companion-management checks target CRUD controls not exposed by the current selector.
- Four historical smoke checks target port 5173 and removed settings controls.
- One skills check targets the former shared database and backend startup contract.
- One multi-device check requires a dedicated CouchDB-compatible service and seeded identities.

Firefox, WebKit, Electron, and mobile-native execution were not validated in this pass because their browser/runtime dependencies are not installed in the current workspace.

## Command

```powershell
node node_modules/@playwright/test/cli.js test --config=client/playwright.config.ts --project=chromium
```
