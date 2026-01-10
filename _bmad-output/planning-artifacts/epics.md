---
stepsCompleted: [1]
inputDocuments:
    - prd.md
---

# wollama - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for wollama, decomposing the requirements from the PRD into implementable stories organized by user value and technical dependencies.

## Requirements Inventory

### Functional Requirements

FR-101: Display initial setup wizard on first launch
FR-102: Capture server URL (local or network Ollama instance)
FR-103: Validate server connection before proceeding
FR-104: Clear error messages for connection failures
FR-105: Store server URL in user preferences for future sessions
FR-201: Display system-provided default companions (read-only)
FR-202: "Customize" button creates user-owned copy with unique ID
FR-203: User can edit: system_prompt, model selection, voice_id, avatar
FR-204: Clear visual distinction: system (badge) vs personal (owned indicator)
FR-205: Personal companions persist across app updates
FR-206: List all companions (system + personal) in chat interface
FR-301: Create new chat associated with specific companion
FR-302: Send text message to AI via streaming API
FR-303: Display streaming responses as they arrive
FR-304: Store message locally (user/assistant) with metadata
FR-305: Persist chat history in local database
FR-306: Display chat list ordered by last update
FR-401: Sync changes (new chats, messages, companions) to server
FR-402: Queue offline changes; sync when online
FR-403: Sync multi-device: changes on mobile appear on desktop
FR-404: Handle sync conflicts (last-write-wins for MVP)
FR-501: Web: Server handles STT/TTS processing
FR-502: Desktop (Electron): Use native child processes for STT/TTS
FR-503: Mobile (Capacitor): Fallback to server for STT/TTS

### NonFunctional Requirements

NFR-101: Server response latency <100ms for UI operations
NFR-102: Streaming tokens appear <500ms after sent
NFR-103: App startup time <3 seconds on all platforms
NFR-104: Offline cache load <1 second
NFR-201: No data loss on app crash or unexpected shutdown
NFR-202: Sync conflict resolution guarantees no duplicate messages
NFR-203: Multi-device sync maintains consistency (observable within 5s)
NFR-204: Graceful degradation when server unavailable
NFR-301: Test coverage ≥80% for critical paths
NFR-302: All sync scenarios testable in isolation
NFR-303: Mock Ollama server for testing
NFR-304: Offline/online transitions testable
NFR-401: WCAG 2.1 AA compliance
NFR-402: Keyboard navigation for all UI
NFR-403: Screen reader support for chat
NFR-404: Multi-language support (English, French, German, Spanish, Italian)
NFR-501: Server URL validated before connection
NFR-502: No credentials stored in local database
NFR-503: All communication to Ollama server via secure protocol (TLS if over network)

### Additional Requirements

- Companion ownership model: System companions vs User-owned companions with clear separation
- Sync conflict resolution: Last-write-wins strategy with timestamp-based versioning
- Data model: user_companion_id derived from (user_id, companion_id) for multi-device consistency
- Testing strategy: Critical scenarios documented with full acceptance criteria
- Multi-platform support: Code paths isolated per platform (Web/Desktop/Mobile)

## Epic List

1. **Epic 1: Onboarding & Server Connection**
2. **Epic 2: Companion System (Defaults + Personalization)**
3. **Epic 3: Chat Interface & Messaging**
4. **Epic 4: Data Sync & Offline Support**
5. **Epic 5: Test Coverage & Reliability**

---

## Epic 1: Onboarding & Server Connection

**Goal:** Enable new users to discover Wollama, understand its purpose, configure the Ollama server connection, and start their first chat without confusion.

**Requirements Addressed:** FR-101, FR-102, FR-103, FR-104, FR-105, NFR-101, NFR-103, NFR-501

### Story 1.1: Display Onboarding Wizard on First Launch

As a new user,
I want to see a clear onboarding wizard when I first launch Wollama,
So that I understand what the app does and how to get started.

**Acceptance Criteria:**

**Given** the app is launched for the first time
**When** the app initializes
**Then** the onboarding wizard appears
**And** the main chat interface is hidden behind the wizard
**And** the wizard explains what Wollama is (local AI chat)
**And** the wizard has a "Next" button to proceed

### Story 1.2: Capture and Validate Ollama Server URL

As a new user,
I want to configure my Ollama server connection in a simple form,
So that the app knows where to find Ollama (local or network).

**Acceptance Criteria:**

**Given** the onboarding wizard is on Step 2
**When** I enter a server URL (e.g., "http://localhost:11434")
**And** I click "Test Connection"
**Then** the app sends a health check to the server
**And** displays "Connected successfully" if successful
**And** displays "Unable to connect - check URL" if the server is unreachable
**And** the URL is stored in user preferences on successful validation

### Story 1.3: Handle Connection Failures Gracefully

As a user,
I want clear error messages when the server isn't reachable,
So that I know how to fix the problem (start Ollama, check the address).

**Acceptance Criteria:**

**Given** I enter an invalid server URL
**When** I attempt to test the connection
**Then** the app shows a specific error: "Connection refused" or "DNS lookup failed"
**And** a suggestion: "Make sure Ollama is running and reachable"
**And** I can edit the URL and retry without restarting the wizard

### Story 1.4: Persist Server Configuration

As a returning user,
I want the app to remember my Ollama server URL,
So that I don't have to reconfigure it every time.

**Acceptance Criteria:**

**Given** I've successfully configured the server URL on first launch
**When** I close and reopen the app
**Then** the app uses the stored server URL
**And** skips the onboarding wizard
**And** displays the chat interface directly

---

## Epic 2: Companion System (Defaults + Personalization)

**Goal:** Provide default AI companions that users understand are system-provided, and allow users to customize and create personal companions without confusion about ownership or persistence.

**Requirements Addressed:** FR-201, FR-202, FR-203, FR-204, FR-205, FR-206, NFR-301, NFR-302

### Story 2.1: Display System-Provided Default Companions

As a new user,
I want to see a list of default companions (e.g., "Assistant", "Coder", "Creative"),
So that I can choose one without having to configure anything.

**Acceptance Criteria:**

**Given** the onboarding is complete
**When** I view the companion selector
**Then** I see all system-provided companions listed
**And** each shows a clear badge: "Default" or system icon
**And** each companion displays: name, description, and assigned model
**And** companions are read-only (no edit button visible on defaults)

### Story 2.2: Create User-Owned Companion by Customizing a Default

As a user,
I want to customize a default companion (e.g., change system prompt or model),
So that I can have a personalized version that reflects my preferences.

**Acceptance Criteria:**

**Given** I'm viewing a system default companion
**When** I click "Customize"
**Then** a new user-owned companion is created (copy of the default)
**And** the new companion is marked as "Personal" or with my username
**And** I'm taken to an edit screen where I can modify system_prompt, model, voice_id, avatar
**And** the original default companion remains unchanged
**And** the new personal companion is saved to the local database

### Story 2.3: Persist User Companions Across App Updates

As a user,
I want my custom companions to survive app updates,
So that my personalization isn't lost.

**Acceptance Criteria:**

**Given** I've created a personal companion called "MyAssistant"
**When** a new app version is released and installed
**Then** "MyAssistant" is still available in my companion list
**And** it retains all my customizations (system_prompt, model, etc.)
**And** system default companions may be updated without affecting my personal copies

### Story 2.4: Display Companion Ownership Clearly

As a user,
I want to visually distinguish system companions from my personal ones,
So that I know which ones I can edit and which are system defaults.

**Acceptance Criteria:**

**Given** I'm viewing the companion list
**When** I look at the companion cards
**Then** system companions have a "Default" badge
**And** personal companions have an "Owned by You" or pencil icon
**And** personal companions have an "Edit" button
**And** system companions do NOT have an "Edit" button

---

## Epic 3: Chat Interface & Messaging

**Goal:** Enable users to send messages to their chosen companion and view streaming responses in real-time, with full chat history persisted locally.

**Requirements Addressed:** FR-301, FR-302, FR-303, FR-304, FR-305, FR-306, NFR-102, NFR-104

### Story 3.1: Create a New Chat Session

As a user,
I want to create a new chat and select a companion,
So that I can start a conversation with a specific AI personality.

**Acceptance Criteria:**

**Given** I'm on the chat home screen
**When** I click "New Chat"
**Then** a dialog appears listing all companions (defaults + personal)
**And** I select one companion
**Then** a new chat session is created, associated with that companion
**And** I'm taken to the chat view with an empty message area
**And** the chat appears in the chat list with the companion's name and timestamp

### Story 3.2: Send Text Message and Display Streaming Response

As a user,
I want to type a message and see the AI response stream in real-time,
So that I get immediate feedback without waiting for the full response.

**Acceptance Criteria:**

**Given** I have an open chat with a companion
**When** I type a message and click "Send"
**Then** my message appears in the chat immediately
**And** a loading indicator shows the AI is thinking
**And** streaming tokens from the AI appear one at a time (<500ms per token)
**And** when the response is complete, the loading indicator disappears
**And** the response is stored in the local database

### Story 3.3: Store Chat History Locally

As a user,
I want my full chat history saved locally,
So that I can review past conversations even if the server is unavailable.

**Acceptance Criteria:**

**Given** I've had multiple conversations with companions
**When** I close and reopen the app
**Then** all my previous chats are still visible in the chat list
**And** I can click any chat to see the full message history
**And** messages are stored with timestamps and metadata (user vs assistant)

### Story 3.4: Display Chat List Ordered by Recency

As a user,
I want my most recent chats at the top of the list,
So that I can quickly find the conversation I was just working on.

**Acceptance Criteria:**

**Given** I have multiple chats
**When** I view the chat list
**Then** chats are ordered by last-update timestamp (most recent first)
**And** when I send a new message to a chat, it moves to the top
**And** if I open an old chat, it moves to the top

---

## Epic 4: Data Sync & Offline Support

**Goal:** Ensure that user data (chats, companions, preferences) sync reliably across devices and persist correctly during offline periods without data loss or duplication.

**Requirements Addressed:** FR-401, FR-402, FR-403, FR-404, NFR-201, NFR-202, NFR-203, NFR-204

### Story 4.1: Queue Offline Changes and Sync on Reconnect

As a user,
I want my edits to be saved locally when offline,
So that I don't lose work and they sync to other devices when I reconnect.

**Acceptance Criteria:**

**Given** my internet connection is offline
**When** I create a new chat and send a message
**Then** the chat and message are saved to the local offline queue
**And** an "offline" indicator appears in the UI
**When** my internet connection is restored
**Then** queued changes are sent to the server automatically
**And** the offline indicator disappears
**And** no duplicates appear on other devices

### Story 4.2: Sync Changes Across Multiple Devices

As a user with multiple devices (mobile, desktop),
I want changes on one device to appear on the other,
So that my data is consistent everywhere.

**Acceptance Criteria:**

**Given** I have the app installed on both mobile and desktop
**When** I create a custom companion on mobile
**Then** the desktop app syncs automatically (within 5 seconds)
**And** the new companion appears in the desktop companion list
**And** I can use it on desktop without manual refresh

### Story 4.3: Resolve Sync Conflicts (Last-Write-Wins)

As a user editing the same data on two devices simultaneously,
I want conflicts to be resolved automatically,
So that I don't have to manually pick which version is correct.

**Acceptance Criteria:**

**Given** I edit a companion's system_prompt on mobile at 10:00:00
**And** I edit the same companion on desktop at 10:00:05
**When** both devices sync to the server
**Then** the desktop version (later timestamp) wins
**And** the mobile version is overwritten with the latest
**And** I see a notification or refresh reflecting the latest version

### Story 4.4: Handle Server Disconnection Gracefully

As a user,
I want the app to continue functioning when the server is temporarily unavailable,
So that temporary network issues don't break my workflow.

**Acceptance Criteria:**

**Given** the Ollama server becomes unreachable
**When** I try to send a message
**Then** a clear error appears: "Server unavailable"
**And** the message is NOT sent to the AI
**But** I can still view my local chat history
**When** the server is reachable again
**And** I retry
**Then** the message is sent successfully

---

## Epic 5: Test Coverage & Reliability

**Goal:** Build a comprehensive test suite that validates all critical scenarios (onboarding, companions, sync, offline/online transitions) with clear acceptance criteria and confidence for future development.

**Requirements Addressed:** NFR-301, NFR-302, NFR-303, NFR-304, All critical scenarios from Testing Strategy

### Story 5.1: Unit Tests for Companion Ownership Model

As a developer,
I want unit tests for the companion ownership logic,
So that the system correctly distinguishes system vs user-owned companions.

**Acceptance Criteria:**

**Given** a system companion
**When** the "customize" action is triggered
**Then** a new user_companion record is created
**And** user_companion.user_id is set to the current user
**And** user_companion.companion_id references the original system companion
**And** the original system companion is not modified

### Story 5.2: Integration Tests for Offline/Online Sync

As a developer,
I want integration tests for offline changes and sync,
So that data is never lost during network transitions.

**Acceptance Criteria:**

**Given** the app is online
**When** a message is created and sent
**Then** it syncs to the server
**When** the network goes offline
**And** another message is created
**Then** it queues locally
**When** the network comes back online
**Then** the queued message is sent
**And** no duplicates appear
**And** messages are in the correct order

### Story 5.3: E2E Test for Onboarding Journey

As a developer,
I want an end-to-end test for the full onboarding flow,
So that I can verify new users can configure the server and send a first message.

**Acceptance Criteria:**

**Given** a fresh app installation
**When** the test:

1. Waits for onboarding wizard
2. Enters Ollama server URL
3. Validates connection
4. Closes wizard
5. Selects a default companion
6. Sends a test message
   **Then** the message is received and a response is displayed
   **And** the response is stored in the chat history

### Story 5.4: E2E Test for Multi-Device Sync

As a developer,
I want an end-to-end test for multi-device sync,
So that I can verify changes on one device appear on another.

**Acceptance Criteria:**

**Given** two instances of the app (simulating two devices)
**When** Device A creates a custom companion
**Then** Device B syncs and displays the new companion (within 5 seconds)
**When** Device A modifies the companion's system_prompt
**Then** Device B reflects the change
**And** no conflicts or duplicates appear

### Story 5.5: Mock Ollama Server for Testing

As a developer,
I want a mock Ollama server for testing,
So that I can test the app without requiring a real Ollama instance.

**Acceptance Criteria:**

**Given** a test environment
**When** the app connects to the mock server
**Then** it responds with a health check
**And** it responds to chat requests with deterministic responses
**And** it supports the same API contract as the real Ollama server

---

## Epic Summary

| Epic   | Focus                     | Dependencies             | Estimated Stories |
| ------ | ------------------------- | ------------------------ | ----------------- |
| Epic 1 | Onboarding & Server Setup | None (blocks all others) | 4 stories         |
| Epic 2 | Companion System          | Epic 1                   | 4 stories         |
| Epic 3 | Chat & Messaging          | Epic 1, 2                | 4 stories         |
| Epic 4 | Sync & Offline            | Epic 1, 3                | 4 stories         |
| Epic 5 | Testing & Quality         | All others               | 5 stories         |

**Recommended Implementation Order:**

1. Epic 1 (Onboarding) - Unblocks everything
2. Epic 2 (Companions) - Needed before messaging works
3. Epic 3 (Chat/Messaging) - Core feature
4. Epic 4 (Sync & Offline) - Foundation robustness
5. Epic 5 (Testing) - Runs parallel with development, validates each epic

---

## Epic 6: Voice Features (STT/TTS)

**Goal:** Enable voice input (Speech-to-Text) and output (Text-to-Speech) across all three platforms (Web, Desktop, Mobile) with platform-appropriate implementations for optimal performance and user experience.

**Requirements Addressed:** FR-501, FR-502, FR-503

### Story 6.1: Web Platform - Server-Side STT/TTS Processing

As a web user,
I want to use voice input and output in my browser,
So that I can interact hands-free with companions without installing additional software.

**Acceptance Criteria:**

**Given** I'm using the web version of Wollama
**When** I click the microphone button and speak
**Then** my audio is recorded and sent to the server
**And** the server processes it with Whisper (STT) and returns the transcribed text
**And** the transcribed text appears in the message input field
**When** the assistant responds
**Then** I can click "Play Audio" to hear the response
**And** the server synthesizes speech with Piper (TTS) and streams audio back
**And** the audio plays in my browser with clear quality (16kHz mono WAV/MP3)

### Story 6.2: Desktop Platform - Native Child Process STT/TTS

As a desktop (Electron) user,
I want faster voice processing with lower latency,
So that my voice interactions feel instantaneous and responsive.

**Acceptance Criteria:**

**Given** I'm using the desktop version of Wollama
**When** I use voice input
**Then** Electron main process spawns Whisper as a native child process
**And** audio is processed locally without server round-trip
**And** transcription latency is <2 seconds for typical utterances
**When** TTS is requested
**Then** Piper runs as a native child process in the main process
**And** audio generation latency is <1 second
**And** if native binaries are unavailable, the app falls back to server processing gracefully

### Story 6.3: Mobile Platform - Native Bridge with Server Fallback

As a mobile user,
I want voice input and output on the go,
So that I can use Wollama while driving, walking, or in hands-free scenarios.

**Acceptance Criteria:**

**Given** I'm using the mobile version of Wollama (Capacitor)
**When** I tap the microphone button
**Then** the app requests microphone permission if not granted
**And** if permission granted, records audio using native APIs (iOS/Android)
**And** audio is sent to server for Whisper processing
**When** TTS is requested
**Then** server synthesizes audio with Piper and streams to mobile
**And** audio playback uses native mobile audio APIs for best quality
**And** if native audio bridge unavailable, fallback to server-side processing works seamlessly

### Story 6.4: Voice UI Controls and Feedback

As a user on any platform,
I want clear visual feedback for voice interactions,
So that I know when the app is listening, processing, or speaking.

**Acceptance Criteria:**

**Given** I'm on any screen with voice capability
**When** I look at the UI
**Then** I see a microphone button with clear affordance (icon + label)
**When** I click the microphone button
**Then** the button animates to show "listening" state (pulsing or waveform)
**And** a visual indicator shows audio is being captured
**When** audio processing completes
**Then** the transcribed text appears in the message input
**And** an undo button lets me re-record if transcription was incorrect
**When** TTS audio plays
**Then** playback controls appear (play, pause, stop, volume)
**And** a progress indicator shows playback position
**When** microphone permission is denied
**Then** a clear error message explains how to grant permission in device settings

---

## Epic 7: Accessibility & Internationalization

**Goal:** Ensure the application is usable by people with disabilities (WCAG 2.1 AA compliance) and supports multiple languages (English, French, German, Spanish, Italian) using the existing i18n system.

**Requirements Addressed:** NFR-401, NFR-402, NFR-403, NFR-404

### Story 7.1: WCAG 2.1 AA Compliance - Semantic HTML & ARIA

As a user with disabilities,
I want proper semantic HTML and ARIA labels throughout the app,
So that assistive technologies (screen readers, voice control) work correctly.

**Acceptance Criteria:**

**Given** I'm navigating the app with assistive technology
**When** I encounter interactive elements (buttons, links, inputs)
**Then** each has a proper ARIA role and accessible label
**And** form inputs have associated `<label>` elements with `for` attributes
**When** I check color contrast
**Then** all text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
**When** I review heading structure
**Then** headings follow logical hierarchy (h1 → h2 → h3, no skips)
**And** landmark regions (header, nav, main, footer) are properly defined
**When** errors occur (form validation, connection issues)
**Then** error messages are associated with fields via `aria-describedby`
**And** error states have `aria-invalid="true"`

### Story 7.2: Full Keyboard Navigation

As a keyboard-only user,
I want to access all features without a mouse,
So that I can use the app efficiently via keyboard shortcuts and tab navigation.

**Acceptance Criteria:**

**Given** I'm using only the keyboard
**When** I press Tab
**Then** focus moves through interactive elements in logical order
**And** focus indicators are clearly visible (outline or highlight)
**When** I'm in a modal or dialog
**Then** focus is trapped inside the modal (Tab doesn't escape to page behind)
**And** pressing Escape closes the modal and returns focus to trigger element
**When** I'm viewing a list (companions, chats)
**Then** arrow keys (↑↓) navigate between list items
**And** Enter or Space activates the selected item
**When** I press standard shortcuts (Ctrl+S, Ctrl+N)
**Then** relevant actions trigger (save, new chat)

### Story 7.3: Screen Reader Support with Live Regions

As a screen reader user,
I want meaningful announcements for dynamic content,
So that I'm aware of chat messages, loading states, and errors without seeing the screen.

**Acceptance Criteria:**

**Given** I'm using a screen reader (NVDA, JAWS, VoiceOver)
**When** a new chat message arrives
**Then** the screen reader announces "Assistant says: [message text]"
**And** the announcement uses `aria-live="polite"` to avoid interrupting current reading
**When** the app is loading or processing
**Then** status messages are announced ("Connecting to server...", "Generating response...")
**When** an error occurs
**Then** the error is announced with severity context ("Error: Unable to connect to server")
**When** streaming responses appear token-by-token
**Then** the full message is announced when streaming completes (not each token individually)
**And** a "typing" indicator announces when streaming starts

### Story 7.4: Complete i18n Coverage with Existing Framework

As a non-English speaker,
I want the app fully translated in my language,
So that I can use it comfortably without language barriers.

**Acceptance Criteria:**

**Given** the app uses the existing i18n system (`client/src/lib/state/i18n.svelte.ts`)
**When** I audit the codebase
**Then** all UI strings use the `t()` function (no hardcoded English text)
**And** all translations exist in `client/src/locales/translations.js` for 5 languages:

- English (en) - complete ✅
- French (fr) - complete ✅
- German (de) - complete ✅
- Spanish (es) - complete ✅
- Italian (it) - complete ✅
  **When** I change language in settings
  **Then** the locale is saved to `userState.preferences.locale`
  **And** the UI updates reactively without page reload (Svelte 5 reactivity)
  **When** I view dates and times
  **Then** they format according to my locale using `Intl.DateTimeFormat`
  **When** I'm a new user
  **Then** the app detects my browser language and sets it as default
  **And** if my language isn't supported, it defaults to English

---

## Epic Summary (Updated)

| Epic       | Focus                        | Dependencies             | Estimated Stories |
| ---------- | ---------------------------- | ------------------------ | ----------------- |
| Epic 1     | Onboarding & Server Setup    | None (blocks all others) | 4 stories         |
| Epic 2     | Companion System             | Epic 1                   | 4 stories         |
| Epic 3     | Chat & Messaging             | Epic 1, 2                | 4 stories         |
| Epic 4     | Sync & Offline               | Epic 1, 3                | 4 stories         |
| Epic 5     | Testing & Quality            | All others               | 5 stories         |
| **Epic 6** | **Voice Features (STT/TTS)** | Epic 1, 3                | **4 stories**     |
| **Epic 7** | **Accessibility & i18n**     | Epic 1-3                 | **4 stories**     |

**Total Stories: 29**

**Recommended Implementation Order:**

1. Epic 1 (Onboarding) - Unblocks everything
2. Epic 2 (Companions) - Needed before messaging works
3. Epic 3 (Chat/Messaging) - Core feature
4. Epic 4 (Sync & Offline) - Foundation robustness
5. **Epic 6 (Voice Features)** - Enhances interaction modes
6. **Epic 7 (Accessibility)** - Ensures inclusive design
7. Epic 5 (Testing) - Validates all epics (can run in parallel)
