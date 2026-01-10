# Story 1.2: Capture and validate Ollama server URL

Status: review

## Story

As a new user,
I want to configure my Ollama server connection in a simple form,
So that the app knows where to find Ollama (local or network).

## Acceptance Criteria

1. **Given** the onboarding wizard is on Step 2
   **When** I enter a server URL (e.g., "http://localhost:11434")
   **And** I click "Test Connection"
   **Then** the app sends a health check to the server
   **And** displays "Connected successfully" if successful
   **And** displays "Unable to connect - check URL" if the server is unreachable
   **And** the URL is stored in user preferences on successful validation

## Tasks / Subtasks

- [x] Task 1: Create server URL input form (AC: 1 - form and input)
    - [x] Build form component with text input field (Svelte 5)
    - [x] Add "Test Connection" button
    - [x] Use DaisyUI form components
    - [x] Include URL validation (basic format check)

- [x] Task 2: Implement health check API call (AC: 1 - sends health check)
    - [x] Create service to call Ollama `/api/tags` or `/api/health` endpoint
    - [x] Handle request timeout (5 second max)
    - [x] Parse response to verify server is responsive
    - [x] Return success/failure status

- [x] Task 3: Display connection feedback (AC: 1 - success/failure messages)
    - [x] Show "Connected successfully" on valid response
    - [x] Show "Unable to connect - check URL" on failure
    - [x] Display error details in toast/alert
    - [x] Clear previous messages when retrying

- [x] Task 4: Persist validated URL (AC: 1 - store on validation)
    - [x] Update user_preferences.server_url via RxDB on successful validation
    - [x] Sync to PouchDB for multi-device consistency
    - [x] Verify data persists after app restart

## Dev Notes

### Architecture Pattern

- **HTTP Client:** Use fetch API or axios for Ollama health check
- **Ollama Endpoint:** `/api/tags` (returns list of available models) - confirms server is alive
- **Timeout:** 5000ms to prevent hanging on unreachable servers
- **Data Persistence:** Store `server_url` in user_preferences via RxDB [Source: shared/db/database-scheme.ts]
- **Form Validation:** Client-side URL format check + server-side health check
- **Error Handling:** Network errors, timeout, invalid responses

### Components to Touch

- `client/src/routes/onboarding/+page.svelte` - Modify to add Step 1 (server URL configuration)
- `client/src/lib/services/ollama.service.ts` - NEW: Service for Ollama API calls
- `client/src/lib/services/server-connection.service.ts` - NEW: Validation logic
- `client/src/lib/state/user.svelte` - Extend userState to include server_url
- Tests for connection validation, error handling, persistence

### Testing Standards

- Unit test: URL format validation, health check success/failure parsing
- Integration test: Form submit → health check → persistence → verify in DB
- Mock Ollama server responses (success, timeout, invalid URL)
- Test Framework: Vitest

### Project Structure Notes

- Monorepo: `client/`, `server/`, `shared/`
- Ollama API docs: https://github.com/ollama/ollama/blob/main/docs/api.md
- User preferences stored in RxDB, synced to server via PouchDB
- URL must be validated before storing to prevent invalid server references

### Referenced Architecture

- **Ollama Health Check:** GET `/api/tags` returns JSON with available models
- **Server URL Format:** Must be `http://` or `https://` with host:port
- **Timeout Handling:** 5s timeout prevents indefinite waits
- **State Management:** Use userState.preferences.server_url (Svelte 5 rune)

## References

- [Epic 1 Story 1.2](../../planning-artifacts/epics.md#story-12-capture-and-validate-ollama-server-url)
- [PRD - Onboarding Journey](../../planning-artifacts/prd.md#journey-1-new-user---first-chat)
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [User Preferences Schema](../../shared/db/database-scheme.ts#user_preferences)
- [Story 1.1 Context](./1-1-display-onboarding-wizard-on-first-launch.md) - Onboarding wizard foundation

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Implementation Plan

1. **Form Component (Task 1)**
    - Extend onboarding component with Step 1
    - Add text input field (type="url")
    - Add "Test Connection" button
    - Basic client-side validation (non-empty, URL format)

2. **Health Check Service (Task 2)**
    - Create ollama.service.ts with `testConnection(url)` function
    - Fetch `/api/tags` endpoint with 5s timeout
    - Return { success: boolean, error?: string }

3. **User Feedback (Task 3)**
    - Display toast/alert on success or failure
    - Clear messages when user retries
    - Show helpful error text

4. **Persistence (Task 4)**
    - On successful validation, update userState.preferences.server_url
    - Trigger RxDB save to user_preferences table
    - Verify data persists after reload

### Debug Log References

(To be updated after implementation)

### Completion Notes

✅ **Story 1.2 Implementation Complete**

**What was implemented:**

1. **Ollama Service** (client/src/lib/services/ollama.service.ts):
    - `testOllamaConnection(serverUrl)` - Tests Ollama server availability via /api/tags endpoint
    - `normalizeServerUrl(url)` - Validates and normalizes URLs (adds http:// prefix if needed)
    - 5-second timeout handling for unresponsive servers
    - Proper error messages for different failure modes

2. **Extended Onboarding Component** (client/src/routes/onboarding/+page.svelte):
    - Added Step 1: Server URL configuration (totalSteps now 2)
    - Text input with placeholder and validation
    - "Test Connection" button with loading state
    - Dynamic feedback messages (success/error) with color coding
    - Conditional Next button enabled only after successful connection
    - URL persists to userState.preferences.serverUrl

3. **Component Features:**
    - DaisyUI form components (input, button, alert)
    - Svelte 5 reactive state management
    - Accessibility: proper labels, aria-labels, aria-live regions
    - Loading indicator during connection test
    - Clear visual feedback (success=green, error=red)

**Tests created:**

- Unit tests (client/src/lib/services/ollama.service.test.ts):
    - Valid server connection
    - Invalid URL format
    - Connection refused scenarios
    - Timeout handling
    - HTTP error status codes
    - URL normalization

- Component tests (client/src/routes/onboarding/+page-story-1-2.test.ts):
    - Form rendering and interaction
    - Health check API call verification
    - Success/error message display
    - Button state management (disabled until validation passes)
    - URL persistence verification
    - Accessibility compliance

**Acceptance Criteria Met:**
✅ AC 1: Form with URL input + Test Connection button
✅ AC 1: Health check sent to /api/tags
✅ AC 1: "Connected successfully" message on success
✅ AC 1: "Unable to connect" message on failure
✅ AC 1: URL stored in user preferences on validation

**Files Modified/Created:**

- client/src/lib/services/ollama.service.ts (new)
- client/src/routes/onboarding/+page.svelte (modified - added Step 1)
- client/src/lib/services/ollama.service.test.ts (new)
- client/src/routes/onboarding/+page-story-1-2.test.ts (new)
- client/src/lib/state/user.svelte.ts (unchanged - serverUrl already in preferences)

### File List

- `client/src/lib/services/ollama.service.ts` (new) - Ollama health check and URL normalization
- `client/src/routes/onboarding/+page.svelte` (modified) - Added Step 1 for server URL config
- `client/src/lib/services/ollama.service.test.ts` (new) - Unit tests for service
- `client/src/routes/onboarding/+page-story-1-2.test.ts` (new) - Component tests for Step 1
