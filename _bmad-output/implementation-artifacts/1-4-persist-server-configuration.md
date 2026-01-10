# Story 1.4: Persist Server Configuration

## Overview

As a returning user, I want the app to remember my Ollama server URL, so that I don't have to reconfigure it every time.

## Acceptance Criteria

- **Given** I've successfully configured the server URL on first launch
- **When** I close and reopen the app
- **Then** the app uses the stored server URL
- **And** skips the onboarding wizard
- **And** displays the chat interface directly

## Implementation Plan

### 1. Store Server URL in Preferences

- When connection test succeeds in Story 1.3, URL is already saved to `userState.preferences.serverUrl`
- Preferences persist in RxDB/PouchDB local database

### 2. Check Onboarding Completion on App Load

- In `+layout.svelte`, read `userState.preferences.onboarding_completed` flag
- If `true`, skip onboarding and go directly to chat interface
- If `false` or undefined, show onboarding wizard

### 3. Load Stored URL in Onboarding

- When onboarding appears, pre-populate the server URL field with stored value if it exists
- User can override if needed

### 4. Test Coverage

- Verify stored URL is loaded on app restart
- Verify onboarding is skipped for returning users
- Verify flag transitions properly between first launch and return visits

## Technical Notes

### Data Flow

1. User completes Story 1.3 onboarding
2. `userState.preferences.onboarding_completed = true` is set
3. `userState.preferences.serverUrl` is stored
4. On next app load, `+layout.svelte` checks flag and routes accordingly
5. If onboarding was skipped, URL is still available for chat operations

### Files to Modify

- `client/src/routes/+layout.svelte` - Add onboarding completion check & routing
- `client/src/routes/onboarding/OnboardingWizard.svelte` - Pre-populate URL field if available
- `client/src/routes/chat/+page.svelte` or equivalent - Ensure chat interface loads for returning users

### Related Stories

- Story 1.1: Initial onboarding display
- Story 1.2: URL validation
- Story 1.3: Error handling & flag setting
- Story 1.4 (this): Persistence & routing

## Status

- **Priority:** High
- **Effort:** Small (2-3 hours)
- **Ready for Development:** Yes
