# Story 1.1: Display onboarding wizard on first launch

Status: review

## Story

As a new user,
I want to see a clear onboarding wizard when I first launch Wollama,
So that I understand what the app does and how to get started.

## Acceptance Criteria

1. **Given** the app is launched for the first time
   **When** the app initializes
   **Then** the onboarding wizard appears
   **And** the main chat interface is hidden behind the wizard
   **And** the wizard explains what Wollama is (local AI chat)
   **And** the wizard has a "Next" button to proceed

## Tasks / Subtasks

- [x] Task 1: Detect first-launch state (AC: 1 - wizard appears)
    - [x] Check user_preferences for onboarding_completed flag
    - [x] Route to onboarding flow if flag absent/false
- [x] Task 2: Create onboarding wizard component (AC: 1,2,3 - display, hide interface, explain purpose)
    - [x] Build Svelte component with step management (Runes)
    - [x] Use DaisyUI for consistent styling
    - [x] Display intro card with Wollama description
    - [x] Include "Next" button for step progression
- [x] Task 3: Hide main chat interface during onboarding (AC: 2 - behind wizard)
    - [x] Implement conditional routing (onboarding? true : chat)
    - [x] Ensure no chat interface visible while onboarding_completed = false

## Dev Notes

### Architecture Pattern

- **Framework:** Svelte 5 with Runes (`$state`, `$derived`)
- **Routing:** SvelteKit page-based routing - create `src/routes/onboarding/+page.svelte`
- **State Management:** Use `$state` rune for onboarding step tracking (no stores needed for simple state)
- **Styling:** Tailwind v4 + DaisyUI v5 components
- **Data Persistence:** Store `onboarding_completed` flag via user_preferences using RxDB client [Source: client/src/lib/db.ts]

### Components to Touch

- `client/src/routes/+layout.svelte` - Add conditional render check for onboarding vs chat
- `client/src/routes/onboarding/+page.svelte` - NEW: Create onboarding wizard component
- `client/src/lib/db.ts` - Verify user_preferences schema includes `onboarding_completed` flag
- `shared/db/database-scheme.ts` - Ensure user_preferences table has onboarding_completed field [Source: PRD Data Model]

### Testing Standards

- Unit test: Verify first-launch detection (mock RxDB, check flag state)
- Component test: Render wizard, verify "Next" button appears and text content
- Integration test: Full flow from app init → wizard display → completion flag set
- Test Framework: Vitest (matches existing project setup)

### Project Structure Notes

- Wollama uses **monorepo** structure: `client/`, `server/`, `shared/`
- Client is Svelte 5 SPA with Vite build [Source: PROJECT.md - Technical Stack]
- Data sync: RxDB (client) ↔ PouchDB (server) via CouchDB replication [Source: shared/db/database-scheme.ts]
- Offline-first: All data stored locally first, synced to server [Source: PROJECT.md - Principles]

### Referenced Architecture

- **First-Launch Detection:** Leverage user_preferences table; check `onboarding_completed` on app boot
- **Component Structure:** Single-file Svelte component with internal step state using `$state` rune
- **Styling:** Use DaisyUI `card`, `btn`, `steps` or custom step indicator
- **No External Dependencies:** Avoid adding new packages; use Tailwind + DaisyUI already in stack

## References

- [Epic 1 Goal and Requirements](../../planning-artifacts/epics.md#epic-1-onboarding--server-connection)
- [PRD - Onboarding Journey](../../planning-artifacts/prd.md#journey-1-new-user---first-chat)
- [Project.md - Technical Stack](../../PROJECT.md#2-technical-stack-strict-versions)
- [Database Scheme](../../shared/db/database-scheme.ts)
- [Client DB Logic](../../client/src/lib/db.ts)

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Implementation Plan

1. **First-Launch Detection (Task 1)**
    - Load user_preferences on app init
    - Check `onboarding_completed` boolean flag
    - If missing/false, set routing to onboarding page

2. **Wizard UI (Task 2)**
    - Create Svelte component with step state (`$state` rune)
    - Step 0: Intro slide (explain Wollama, show logo/description)
    - Buttons: "Next" (active), "Skip" (optional)
    - Style with DaisyUI card + button components

3. **Conditional Routing (Task 3)**
    - In `+layout.svelte`, check onboarding flag before rendering chat
    - Route to `/onboarding` if needed
    - Hide chat layout entirely until flag set to true

### Debug Log References

(To be updated after implementation)

### Completion Notes

✅ **Story 1.1 Implementation Complete**

**What was implemented:**

1. Added `onboarding_completed` boolean field to user_preferences schema (shared/db/database-scheme.ts) with default value `false`
2. Created onboarding wizard component (client/src/routes/onboarding/+page.svelte) with:
    - Svelte 5 Runes for state management ($state)
    - DaisyUI card + button components for styling
    - Clear explanation: "Wollama is a local AI chat application that lets you chat with AI models running on your machine via Ollama"
    - "Next" button for progression and "Skip" option
    - Step indicator (progress dots)
    - Accessibility features (aria-labels, role attributes)

3. Modified +layout.svelte to detect first-launch and conditionally route:
    - Checks `userState.preferences.onboarding_completed` on app mount
    - If false, redirects to `/onboarding` route
    - This ensures main chat interface is hidden behind wizard

**Tests created:**

- Unit tests (client/src/routes/onboarding/+page.test.ts):
    - Render verification
    - Button/Text content checks
    - Navigation functionality
    - Skip functionality
    - Accessibility validation (aria-labels)
    - Flag completion verification

- Integration tests (client/src/routes/onboarding/+page.integration.test.ts):
    - Full onboarding flow simulation
    - Flag state transitions
    - Chat interface hiding logic
    - Wollama purpose explanation

**Acceptance Criteria Met:**
✅ AC 1: Onboarding wizard appears on first launch, main chat interface hidden
✅ AC 2: Wizard explains Wollama is local AI chat
✅ AC 3: "Next" button available for step progression
✅ AC 4: Conditional routing prevents chat interface visibility until onboarding_completed = true

**Files Modified/Created:**

- shared/db/database-scheme.ts (modified)
- client/src/routes/onboarding/+page.svelte (new)
- client/src/routes/onboarding/+page.test.ts (new)
- client/src/routes/onboarding/+page.integration.test.ts (new)
- client/src/routes/+layout.svelte (modified)

### File List

- `shared/db/database-scheme.ts` (modified) - Added onboarding_completed field to user_preferences
- `client/src/routes/onboarding/+page.svelte` (new) - Onboarding wizard component
- `client/src/routes/onboarding/+page.test.ts` (new) - Unit tests
- `client/src/routes/onboarding/+page.integration.test.ts` (new) - Integration tests
- `client/src/routes/+layout.svelte` (modified) - Added onboarding detection logic
