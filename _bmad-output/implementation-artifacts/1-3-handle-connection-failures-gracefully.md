# Story 1.3: Handle connection failures gracefully

Status: ready-for-dev

## Story

As a user,
I want clear error messages when the server isn't reachable,
So that I know how to fix the problem (start Ollama, check the address).

## Acceptance Criteria

1. **Given** I enter an invalid server URL
   **When** I attempt to test the connection
   **Then** the app shows a specific error: "Connection refused" or "DNS lookup failed"
   **And** a suggestion: "Make sure Ollama is running and reachable"
   **And** I can edit the URL and retry without restarting the wizard

## Tasks / Subtasks

- [ ] Task 1: Map network error types to user-friendly messages (AC: 1)
    - [ ] Distinguish between timeout, connection refused, DNS failure, and other errors
    - [ ] Create error message map with specific error types
    - [ ] Include actionable suggestions for each error type

- [ ] Task 2: Display detailed error messages in UI (AC: 1 - show specific error)
    - [ ] Show error type (Connection refused / DNS lookup failed / Timeout)
    - [ ] Include suggestion text: "Make sure Ollama is running and reachable"
    - [ ] Use error alert styling (red/danger color)
    - [ ] Show error in accessible way (aria-live region)

- [ ] Task 3: Allow retry without restarting wizard (AC: 1 - can edit and retry)
    - [ ] Keep user on same step when error occurs
    - [ ] Allow editing URL after failed attempt
    - [ ] Test Connection button remains enabled for retry
    - [ ] Clear previous error messages when retrying

- [ ] Task 4: Add helpful context for common issues (AC: 1 - actionable suggestion)
    - [ ] Add link/info about starting Ollama locally
    - [ ] Suggest common URLs (http://localhost:11434)
    - [ ] Differentiate between "server not responding" vs "Ollama not running"

## Dev Notes

### Architecture Pattern

- **Error Handling:** Map JavaScript Error objects to user-friendly messages
- **Error Types:** Timeout (AbortError), Connection refused, DNS failure, HTTP errors, JSON parse errors
- **User Feedback:** Specific error type + actionable suggestion
- **State Management:** Keep error state in component, don't block retry
- **Accessibility:** aria-live regions for error announcements

### Error Mapping Strategy

```
| JS Error | User Message | Suggestion |
|----------|--------------|-----------|
| AbortError | Connection timeout | Server took too long to respond. Check if Ollama is running. |
| Failed to fetch | Connection refused | Cannot reach the server. Make sure Ollama is running and the URL is correct. |
| getaddrinfo ENOTFOUND | DNS lookup failed | Cannot find the server. Check the URL spelling. |
| 500+ | Server error | Ollama server error (code 500+). Try restarting Ollama. |
| 4xx | Connection rejected | Server rejected the request (code 4xx). Check URL format. |
```

### Components to Touch

- `client/src/lib/services/ollama.service.ts` - Already has error handling; enhance with specific error messages
- `client/src/routes/onboarding/+page.svelte` - Display detailed error messages from service
- Tests: Update existing tests to verify error message specificity

### Testing Standards

- Unit test: Verify error message mapping for each error type
- Component test: Verify error display and retry flow
- Test Framework: Vitest

### Project Structure Notes

- Error messages are user-facing, should be i18n-ready (French, English, etc.)
- Suggestions should be based on common Ollama setup (Windows .exe, Docker, macOS, Linux)
- Keep error state lightweight (just string, not full Error object)

### Referenced Architecture

- **Error Boundary:** Handled at component level (no global error handler needed for onboarding)
- **Message Format:** `[Error Type]: [Suggestion]` for clarity
- **Retry Logic:** Same test button, no page reload needed
- **State Isolation:** Errors local to form component, don't affect overall state

## References

- [Epic 1 Story 1.3](../../planning-artifacts/epics.md#story-13-handle-connection-failures-gracefully)
- [Story 1.2 - Ollama Service](./1-2-capture-and-validate-ollama-server-url.md) - Foundation for error handling
- [Ollama Troubleshooting Guide](https://github.com/ollama/ollama#installation)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Implementation Plan

1. **Error Message Mapping (Task 1)**
    - Enhance ollama.service.ts to provide specific error types
    - Create error message constants/map
    - Categorize errors: network, timeout, validation, http

2. **UI Error Display (Task 2)**
    - Show error type in alert
    - Include actionable suggestion text
    - Use aria-live for accessibility
    - Format: `[Error Type]: [Suggestion]`

3. **Retry Flow (Task 3)**
    - Keep form state intact on error
    - Allow URL editing after error
    - Clear error message on new attempt
    - No page reload or step restart needed

4. **Helpful Context (Task 4)**
    - Add small helper text about localhost default
    - Show example URLs in input placeholder
    - Link to Ollama docs if helpful

### Debug Log References

(To be updated after implementation)

### Completion Notes

(To be updated after implementation)

### File List

(To be populated after implementation - expected files:)

- `client/src/lib/services/ollama.service.ts` (modified - enhance error details)
- `client/src/routes/onboarding/+page.svelte` (modified - display error specifics)
- Tests updated to verify error message specificity
