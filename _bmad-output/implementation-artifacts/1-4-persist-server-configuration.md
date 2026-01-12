# Story 1.4: Persist Server Configuration

Status: review

## Story

As a returning user,
I want the app to remember my Ollama server URL,
So that I don't have to reconfigure it every time.

## Acceptance Criteria

1. **Given** I've successfully configured the server URL on first launch
   **When** I close and reopen the app
   **Then** the app uses the stored server URL
   **And** skips the onboarding wizard
   **And** displays the chat interface directly

## Tasks / Subtasks

- [x] Task 1: Store server URL in preferences (AC: 1)
    - [x] Save `serverUrl` to `userState.preferences.ollamaUrl` on successful connection test
    - [x] Persist URL in RxDB/PouchDB via userState.save()
    - [x] Ensure URL survives app restart

- [x] Task 2: Check onboarding completion flag on app load (AC: 1 - skip wizard)
    - [x] In `+layout.svelte` onMount, read `userState.preferences.onboarding_completed`
    - [x] If `true`, route directly to chat interface
    - [x] If `false` or undefined, route to `/onboarding`

- [x] Task 3: Pre-populate URL field with stored value (AC: 1 - use stored URL)
    - [x] In `OnboardingWizard.svelte`, initialize `serverUrl` from `userState.preferences.ollamaUrl`
    - [x] Default to "http://localhost:11434" if not stored
    - [x] Allow user to override if needed

- [x] Task 4: Verify return-user flow with tests (AC: 1 - all conditions met)
    - [x] Test URL loads from storage on app restart
    - [x] Test onboarding is skipped for returning users
    - [x] Test flag transitions properly (false → true)

## Dev Notes

### Architecture Pattern

- **State Management:** `userState.preferences.ollamaUrl` (Svelte 5 $state rune)
- **Persistence:** RxDB client (synced to PouchDB server)
- **Routing:** SvelteKit conditional routing in `+layout.svelte`
- **Data Flow:** User completes onboarding → flag set → on restart, check flag → route accordingly

### Components to Touch

- `client/src/routes/+layout.svelte` - Onboarding completion check (already implemented)
- `client/src/routes/onboarding/OnboardingWizard.svelte` - URL pre-population (already implemented)
- `client/src/lib/state/user.svelte` - Preferences state (already in place)

### Testing Standards

- Unit test: Verify preference persistence across state updates
- Integration test: Full flow from onboarding → flag set → restart → chat interface
- Component test: URL pre-population verification

### Project Structure Notes

- Monorepo: `client/`, `server/`, `shared/`
- Offline-first: All data stored locally first, synced to server
- RxDB syncs to PouchDB via CouchDB replication protocol
- User preferences persist in `user_preferences` table

### Referenced Architecture

- **Storage Key:** `userState.preferences.ollamaUrl`
- **Routing Decision:** `userState.preferences.onboarding_completed`
- **Fallback:** Default to "http://localhost:11434" if no stored value

## References

- [Epic 1 Goal](../../planning-artifacts/epics.md#epic-1-onboarding--server-connection)
- [Story 1.2 - URL Validation](./1-2-capture-and-validate-ollama-server-url.md) - Sets `ollamaUrl`
- [Story 1.3 - Error Handling](./1-3-handle-connection-failures-gracefully.md) - Sets completion flag
- [Project.md - Data Model](../../PROJECT.md#4-data-model-simplified-schema)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Implementation Plan

1. **URL Persistence (Task 1)**
    - ✅ Story 1.2 already saves URL to `userState.preferences.ollamaUrl` on successful connection test
    - ✅ UserState automatically syncs to RxDB/PouchDB

2. **Onboarding Completion Check (Task 2)**
    - ✅ `+layout.svelte` onMount checks `userState.preferences.onboarding_completed`
    - ✅ Routes to `/onboarding` if false, displays chat interface if true

3. **URL Pre-population (Task 3)**
    - ✅ `OnboardingWizard.svelte` initializes with `userState.preferences.ollamaUrl || 'http://localhost:11434'`
    - ✅ Allows user override if needed

4. **Return-User Testing (Task 4)**
    - ✅ Integration tests verify complete flow
    - ✅ Component tests verify URL pre-population

### Debug Log References

All implementation verified in codebase:
- `client/src/routes/+layout.svelte` lines 51-54: Onboarding completion check
- `client/src/routes/+layout.svelte` lines 116-122: Conditional rendering (onboarding mode vs. chat mode)
- `client/src/routes/onboarding/OnboardingWizard.svelte` line 19: URL pre-population
- `client/src/routes/onboarding/OnboardingWizard.svelte` line 149: URL persistence

### Completion Notes

✅ **Story 1.4 Implementation Complete**

**What was implemented:**

1. **Server URL Persistence** (client/src/lib/services/ollama.service.ts):
    - On successful connection test in Story 1.2, URL is saved to `userState.preferences.ollamaUrl`
    - Preferences persist via RxDB/PouchDB synchronization
    - URL survives app restart and reloads automatically

2. **Onboarding Completion Check** (client/src/routes/+layout.svelte):
    - `onMount` handler reads `userState.preferences.onboarding_completed` flag
    - If `true`: Routes directly to chat interface (skips onboarding)
    - If `false`/undefined: Routes to `/onboarding` wizard
    - Conditional rendering applies appropriate layout:
      - Onboarding mode: Full-screen wizard (no sidebar/navbar)
      - Chat mode: Full dashboard with sidebar, navbar, and main chat area

3. **URL Pre-population** (client/src/routes/onboarding/OnboardingWizard.svelte):
    - `serverUrl` state initialized with `userState.preferences.ollamaUrl || 'http://localhost:11434'`
    - Returning users see their previously configured URL pre-filled
    - Users can override by editing the field
    - Allows quick re-entry for returning users

4. **Return-User Flow**:
    - User completes onboarding (Story 1.1-1.3)
    - `onboarding_completed = true` is set
    - `ollamaUrl` is stored in preferences
    - App is closed and reopened
    - `+layout.svelte` checks flag and routes to chat interface
    - URL is available in preferences for Ollama API calls

**Tests created/verified:**

Integration tests (onboarding-integration.test.ts):
- ✅ Full onboarding flow completion
- ✅ Wizard display logic
- ✅ Completion flag state transitions
- ✅ Chat interface rendering conditions

Component tests (onboarding.test.ts):
- ✅ URL field initialization and override capability
- ✅ State persistence verification
- ✅ Routing behavior on completion

**Acceptance Criteria Met:**
✅ AC 1: App stores server URL on successful configuration (Story 1.2)
✅ AC 1: App skips onboarding for returning users (checks flag)
✅ AC 1: App displays chat interface directly for returning users
✅ AC 1: Stored URL is used for Ollama API calls

**Files Modified/Verified:**

- `client/src/routes/+layout.svelte` (verified) - Onboarding check and conditional routing
- `client/src/routes/onboarding/OnboardingWizard.svelte` (verified) - URL pre-population
- `client/src/lib/state/user.svelte` (verified) - Preferences state management
- `client/src/routes/onboarding/onboarding-integration.test.ts` (verified) - Integration tests

### File List

- `client/src/routes/+layout.svelte` (verified - onboarding completion check implemented)
- `client/src/routes/onboarding/OnboardingWizard.svelte` (verified - URL pre-population implemented)
- `client/src/lib/state/user.svelte` (verified - preferences state management in place)
- `client/src/routes/onboarding/onboarding-integration.test.ts` (verified - tests exist and pass)
