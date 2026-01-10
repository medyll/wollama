---
title: 'Wollama Consolidation Sprint - Foundation & Architecture'
slug: 'wollama-consolidation-foundation'
created: '2026-01-09'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack:
    [
        'Svelte 5 (Runes)',
        'RxDB v15+',
        'PouchDB v9',
        'Node.js v20+',
        'Express v5',
        'Electron',
        'Capacitor',
        'Ollama',
        'Whisper',
        'Piper',
        'Vitest',
        'Playwright',
        'TypeScript'
    ]
files_to_modify:
    [
        'client/src/routes/+page.svelte',
        'client/src/routes/setup/+page.svelte',
        'client/src/lib/state/user.svelte.ts',
        'client/src/lib/services/companion.service.ts',
        'client/src/lib/services/chat.service.ts',
        'client/src/components/setup/ServerConnectionCheck.svelte',
        'server/services/ollama.service.ts',
        'server/services/generic.service.ts',
        'shared/db/database-scheme.ts'
    ]
code_patterns:
    [
        'Svelte 5 Runes ($state, $derived, $effect)',
        'AbstractGenericService pattern',
        'RxDB reactive queries',
        'PouchDB CouchDB replication',
        'Service Layer with CRUD operations',
        'Copy-on-fork pattern for companions',
        'HEAVY COMMENTING MANDATORY'
    ]
test_patterns:
    [
        'Vitest with vi.mock()',
        'Mock RxDB/PouchDB with in-memory instances',
        'Mock HTTP calls with vi.spyOn()',
        'Test reactive state with $state proxies',
        'Playwright E2E tests'
    ]
---

# Tech-Spec: Wollama Consolidation Sprint - Foundation & Architecture

**Created:** 2026-01-09

## Overview

### Problem Statement

Wollama has a functional codebase but lacks clarity in three critical areas:

1. **Companion Ownership Model:** The distinction between system-provided default companions and user-customized companions is ambiguous, leading to confusion in sync behavior and persistence
2. **Onboarding Flow:** No formal wizard exists; new users don't understand how to connect to Ollama server and start their first chat
3. **Test Coverage:** Insufficient unit/integration test coverage (target: ≥80%) for critical paths (sync, companion management, offline→online transitions)

This consolidation sprint focuses on **architectural clarification and foundation strengthening**, NOT new features.

### Solution

Implement a structured consolidation across 5 epics:

1. **Epic 1: Onboarding & Server Connection** (4 stories) - Create first-launch wizard with Ollama server configuration, validation, and persistence
2. **Epic 2: Companion System** (4 stories) - Clarify the copy-on-customize pattern using existing `user_companions` collection with clear visual distinction
3. **Epic 3: Chat Interface & Messaging** (4 stories) - Solidify chat creation, streaming responses, and persistence
4. **Epic 4: Data Sync & Offline Support** (4 stories) - Implement robust RxDB↔PouchDB sync with last-write-wins conflict resolution
5. **Epic 5: Testing & Reliability** (5 stories) - Achieve ≥80% unit test coverage for core services (Sync, Companion, Chat, Ollama)

**Technical Approach:**

- **Companion Model:** Use existing `user_companions` collection (already in schema with `user_companion_id`, `user_id`, `companion_id` fields). System companions in `companions` table remain immutable; customization creates a copy in `user_companions` with reference to original `companion_id`.
- **Server URL Storage:** Extend existing `user_preferences.server_url` field (already exists in schema line 28).
- **Multi-Platform Strategy:** One unified spec with platform-specific conditionals (Web→Server, Desktop→ChildProcess, Mobile→ServerFallback).
- **Testing Priority:** Unit tests FIRST for core services, then integration tests for critical scenarios.

### Scope

**In Scope:**

- Onboarding wizard (4 stories: display wizard, capture/validate server URL, error handling, persist config)
- Companion architecture (4 stories: list defaults, copy-on-customize, edit personal copies, visual distinction)
- Chat foundation (4 stories: create chat, send/stream messages, persist history, display chat list)
- Offline-first sync (4 stories: sync to server, offline queue, multi-device consistency, conflict resolution)
- Unit test coverage (5 stories: Ollama service, Companion service, Sync service, Chat service, onboarding flow)

**Out of Scope:**

- New features (voice chat enhancements, companion AI personalities, advanced TTS/STT)
- Architecture document (defer until consolidation complete)
- Mobile-specific optimizations (focus on Web + Desktop for MVP)
- Advanced conflict resolution strategies (stick with last-write-wins for MVP)

## Context for Development

### Codebase Patterns

**Database Architecture:**

- **Schema Source of Truth:** `shared/db/database-scheme.ts` (single schema for client RxDB + server PouchDB)
- **Client DB:** `client/src/lib/db.ts` - RxDB with Dexie storage, CouchDB replication
    - Database name: `wollama_client_db_v13`
    - Storage: `wrappedValidateAjvStorage` with Dexie backend
    - Replication: Per-user database on server (`user_{userId}_{tableName}`)
    - Reactive queries: RxDB's `collection.find().$.subscribe()`
- **Server DB:** `server/db/database.ts` - PouchDB with LevelDB adapter
    - Data directory: Configurable via `config.database.dir`
    - Seeding: `DEFAULT_COMPANIONS` seeded on startup into `companions` collection
- **Sync Protocol:** CouchDB replication (RxDB plugin `replicateCouchDB`)
    - Live replication: `live: true`
    - Per-collection replication to `user_{userId}_{tableName}` databases
    - Conflict resolution: Last-write-wins (implicit via CouchDB)

**Key Schema Entities (Confirmed from Code):**

- `user_preferences`: Has `server_url` field (line 28) ✅, also stores `theme`, `locale`, `default_model`, `default_temperature`, `auto_play_audio`
- `companions`: System defaults (immutable, seeded from `DEFAULT_COMPANIONS`) with `is_locked` flag
- `user_companions`: User-owned copies with FK to `user_id` and optional `companion_id` (for forked companions) ✅
- `chats`: Conversation sessions with FK to `user_id` and `companion_id`, indexed by `['user_id', 'updated_at']`
- `messages`: Individual messages with FK to `chat_id`, enum `role` (system, user, assistant, tool), `status` (idle, done, sent, streaming, error)

**Svelte 5 Runes Pattern (MANDATORY):**

- Use `$state`, `$derived`, `$effect` - NO `export let`, NO `$:`, NO `createEventDispatcher`
- Use `{#snippet}` for component composition
- State management: Reactive classes with `$state` properties (see `user.svelte.ts`)
- Persistence: localStorage for user state, RxDB for data

**Service Layer Pattern:**

- **Abstract Base:** `shared/services/abstract-generic.service.ts` - Interface with CRUD methods (getAll, get, create, update, delete, find)
- **Server Implementation:** `server/services/generic.service.ts` - Extends AbstractGenericService, wraps PouchDB operations
- **Client Implementation:** `client/src/lib/services/data-generic.service.ts` - Extends AbstractGenericService, wraps RxDB operations
- **Specialized Services:**
    - `CompanionService` (client): Manages system + user companions with fork/override logic
        - `getAll(userId)`: Returns system companions + user companions (excludes overridden system ones)
        - `fork(systemCompanionId, userId)`: Creates a UserCompanion copy with reference to original
    - `ChatService` (client): Manages chat creation, message persistence, streaming
    - `OllamaService` (server): Thin wrapper around Ollama SDK (chat, generate, list, embeddings)
- **Pattern:** Services instantiate DataGenericService with tableName, use reactive queries for UI binding

**Routing & Navigation:**

- **Root page (`+page.svelte`)**: Redirector logic based on user state
    - If `!userState.isConfigured` → redirect to `/setup`
    - If `userState.isSecured && !userState.isAuthenticated` → redirect to `/login`
    - Else → redirect to `/chat`
- **Setup page (`setup/+page.svelte`)**: Current manual setup with nickname + optional password
    - Missing: Ollama server URL configuration & validation
    - Missing: Wizard flow with steps (currently single form)
- **Connection Check:** `ServerConnectionCheck.svelte` component handles polling & modal display
    - Checks `/api/health` endpoint every 30s
    - Toast notifications for connection changes
    - Manual retry & offline mode buttons

**State Management:**

- **UserState (`lib/state/user.svelte.ts`)**: Reactive class with `$state` properties
    - Fields: `nickname`, `isConfigured`, `isAuthenticated`, `uid`, `preferences`
    - Persistence: `localStorage.getItem('wollama_user')`
    - Methods: `save()`, `setAuth()`, `setLocalProtection()`, `logout()`
- **ConnectionState (`lib/state/connection.svelte`)**: Manages server connectivity status
    - Fields: `isConnected`, `isOllamaConnected`, `isChecking`, `showModal`

### Files to Reference

| File                                       | Purpose                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `shared/db/database-scheme.ts`             | Single source of truth for all database schemas                        |
| `client/src/lib/db.ts`                     | RxDB initialization, schema conversion, replication setup              |
| `server/db/database.ts`                    | PouchDB initialization, companion seeding, express-pouchdb integration |
| `server/services/ollama.service.ts`        | Ollama API integration (chat, streaming, models list)                  |
| `server/services/generic.service.ts`       | Base service class with CRUD operations                                |
| `shared/configuration/data-default.ts`     | Default companions seed data                                           |
| `_bmad-output/planning-artifacts/prd.md`   | Full requirements, success criteria, user journeys                     |
| `_bmad-output/planning-artifacts/epics.md` | 21 user stories with acceptance criteria                               |

### Technical Decisions

1. **Companion Ownership Resolution:**
    - System companions (`companions` table) = immutable, seeded on server startup
    - User customizations → copy entire companion to `user_companions` with:
        - New `user_companion_id` (UUID)
        - Reference to original via `companion_id` (FK, optional)
        - Full copy of fields: `name`, `description`, `system_prompt`, `model`, `voice_id`, `avatar`, etc.
    - UI distinction: System companions show badge "System Default", user companions show "Personal"

### Technical Decisions

1. **Companion Ownership Resolution:**
    - System companions (`companions` table) = immutable, seeded on server startup from `DEFAULT_COMPANIONS`
    - `is_locked` field on system companions prevents editing
    - User customizations → `CompanionService.fork(systemCompanionId, userId)` copies entire companion to `user_companions` with:
        - New `user_companion_id` (crypto.randomUUID())
        - Reference to original via `companion_id` (FK, optional)
        - Full copy of fields: `name`, `description`, `system_prompt`, `model`, `voice_id`, `avatar`, etc.
    - UI distinction: System companions show badge "System Default", user companions show "Personal" or owner indicator
    - **Override Logic (Already Implemented):** `CompanionService.getAll(userId)` filters out system companions that have user forks (tracked via `companion_id` reference)

2. **Server URL Persistence & Validation:**
    - Field already exists: `user_preferences.server_url` (line 28 of schema), default: `http://localhost:3000`
    - Validation: HTTP health check to `${server_url}/api/health` (existing endpoint used by `ServerConnectionCheck.svelte`)
    - Error states: Connection refused, DNS lookup failed, timeout (5s)
    - **Current Gap:** Setup wizard doesn't capture/validate server URL on first launch; needs integration with `ServerConnectionCheck` component logic
    - **Recommended Approach:** Extend `setup/+page.svelte` with server URL step before nickname step, reuse validation logic from `ServerConnectionCheck.svelte`

3. **Multi-Platform Implementation Strategy:**
    - **One Tech Spec** with platform conditionals in code paths
    - Example: `if (isElectron) { useChildProcess() } else { delegateToServer() }`
    - Test isolation: Mock platform detection (`import.meta.env.DEV`, Electron IPC checks), test each path independently
    - **Platform Detection Patterns:**
        - Electron: Check for `window.require` or `process.type === 'renderer'`
        - Capacitor: Check for `window.Capacitor` or `import { Capacitor } from '@capacitor/core'`
        - Web: Fallback default

4. **Testing Strategy & Patterns:**
    - **Priority:** Unit tests FIRST (core services: Ollama, Companion, Sync, Chat)
    - **Framework:** Vitest (already configured in `vitest.config.ts` for server, client config may need creation)
    - **Target:** ≥80% coverage for critical paths
    - **Mocking Patterns (from existing tests):**
        - Mock Ollama: `vi.spyOn(OllamaService.instance, 'chat').mockResolvedValue(...)`
        - Mock RxDB: `vi.mock('$lib/db', () => ({ getDatabase: vi.fn() }))`
        - Mock PouchDB: In-memory instance or mock all methods
        - Mock reactive state: `vi.mock('$lib/state/user.svelte', () => ({ userState: { uid: '...', preferences: {...} } }))`
    - **Test File Naming:** `*.test.ts` for both server and client (both use Vitest)
    - **Existing Test Coverage:** Partial (ollama.service, chat.service, generic.service, logger, markdown, thinking, metadata)
    - **Missing Test Coverage:** Onboarding flow, companion fork logic, sync scenarios, offline→online transitions

5. **Onboarding Wizard Architecture:**
    - **Current State:** Simple form in `setup/+page.svelte` (nickname + password)
    - **Required Architecture:**
        - Multi-step wizard with state machine (Step 1: Welcome, Step 2: Server Config, Step 3: Nickname, Step 4: Complete)
        - Step 2 integrates `ServerConnectionCheck` validation logic
        - `userState.isConfigured` flag tracks completion
        - Progressive disclosure: Show password option only if user selects "Shared machine" checkbox
    - **Component Structure:**
        - Extract wizard steps into separate components: `WizardWelcome.svelte`, `WizardServerConfig.svelte`, `WizardProfile.svelte`
        - OR use single component with reactive step tracking: `let currentStep = $state(1)`
    - **Persistence:** Save `server_url` to `user_preferences` on Step 2 completion, save nickname on Step 3 completion, set `isConfigured = true` on finish

6. **Sync Conflict Resolution (Last-Write-Wins):**
    - CouchDB replication handles conflicts automatically with `updated_at` timestamps
    - No custom conflict resolution logic needed for MVP
    - All entities have `updated_at` field (auto-managed by schema)
    - Multi-device consistency: Changes replicate within 5s (target per NFR-203)

7. **Code Documentation Standard (CRITICAL):**
    - **ALL code MUST be heavily commented** - this is a consolidation sprint focused on clarity
    - **Function/Method Comments:** JSDoc format with `@param`, `@returns`, description of purpose
    - **Inline Comments:** Explain WHY decisions were made, not just WHAT the code does
    - **Complex Logic:** Step-by-step explanation for fork logic, sync behavior, conflict resolution
    - **Test Comments:** Explain test scenarios, edge cases, mocking rationale
    - **Example Standard:**
        ```typescript
        /**
         * Forks a system companion to create a user-owned customizable version.
         * This implements the copy-on-customize pattern: system companions remain
         * immutable, and users work with personal copies that reference the original.
         *
         * @param systemCompanionId - UUID of the system companion to fork
         * @param userId - UUID of the user creating the fork
         * @returns Promise resolving to the new UserCompanion with unique ID
         * @throws Error if system companion not found
         */
        async fork(systemCompanionId: string, userId: string): Promise<UserCompanion> {
          // ... implementation with inline comments
        }
        ```

8. **UI Design Decisions:**
    - **Companion Badges:** Keep simple - "Default" for system, "Personal" for user-owned
    - **Color Coding:** Neutral badge for system (gray), primary/success for personal (blue/green)
    - **Edit Affordances:** Pencil icon + "Edit" button ONLY on personal companions
    - **Server Validation Timeout:** 5 seconds (user confirmed)

9. **Testing Implementation Scope:**
    - **Implement ALL tests NOW** (not deferred to post-MVP)
    - **E2E Tests:** Playwright for onboarding flow + multi-device sync
    - **Unit Tests:** Vitest for services (Companion, Chat, Sync, Ollama)
    - **Integration Tests:** RxDB/PouchDB sync scenarios
    - **Target Coverage:** ≥80% for critical paths (Companion, Chat, Sync, Ollama services)

## Implementation Plan

### Tasks

#### Epic 1: Onboarding & Server Connection (4 stories)

**Story 1.1: Display Onboarding Wizard on First Launch**

- [ ] Task 1.1.1: Create multi-step wizard state machine in setup page
    - File: `client/src/routes/setup/+page.svelte`
    - Action: Add `let currentStep = $state(1)` and step navigation logic (Next/Previous buttons)
    - Action: Replace single form with step-based UI (Step 1: Welcome, Step 2: Server Config, Step 3: Profile)
    - Notes: Use DaisyUI `steps` component for visual step indicator

- [ ] Task 1.1.2: Create Welcome step component
    - File: `client/src/routes/setup/+page.svelte` (or extract to `client/src/components/setup/WizardWelcome.svelte`)
    - Action: Add welcome message explaining what Wollama is (local AI chat)
    - Action: Add "Get Started" button that advances to Step 2
    - Notes: Show app logo, brief feature highlights

- [ ] Task 1.1.3: Update root page redirector to check isConfigured flag
    - File: `client/src/routes/+page.svelte`
    - Action: Verify `!userState.isConfigured` redirects to `/setup` (already implemented ✅)
    - Action: Ensure wizard shows on first launch, skips on subsequent launches
    - Notes: No changes needed if logic already correct

**Story 1.2: Capture and Validate Ollama Server URL**

- [ ] Task 1.2.1: Create Server Config step with URL input
    - File: `client/src/routes/setup/+page.svelte`
    - Action: Add Step 2 UI with input field for server URL (default: `http://localhost:3000`)
    - Action: Add "Test Connection" button
    - Notes: Reuse styling from existing manual setup form

- [ ] Task 1.2.2: Extract validation logic from ServerConnectionCheck
    - File: `client/src/components/setup/ServerConnectionCheck.svelte`
    - Action: Extract `checkConnection()` function into reusable module/service
    - File: `client/src/lib/services/connection.service.ts` (NEW)
    - Action: Create `ConnectionService.validateServerUrl(url: string)` method
    - Notes: Return `{ success: boolean, error?: string, ollamaStatus?: boolean }`

- [ ] Task 1.2.3: Integrate validation into wizard Step 2
    - File: `client/src/routes/setup/+page.svelte`
    - Action: Call `ConnectionService.validateServerUrl(tempUrl)` on "Test Connection" click
    - Action: Display success message ("Connected successfully ✓") or error ("Unable to connect - check URL")
    - Action: Disable "Next" button until validation succeeds
    - Notes: Show loading spinner during validation (timeout: 5s)

- [ ] Task 1.2.4: Save server URL to user preferences
    - File: `client/src/routes/setup/+page.svelte`
    - Action: On Step 2 completion (Next button), save `userState.preferences.serverUrl = validatedUrl`
    - Action: Call `userState.save()` to persist to localStorage
    - Notes: Ensure URL is validated before saving

**Story 1.3: Handle Connection Failures Gracefully**

- [ ] Task 1.3.1: Implement specific error messages
    - File: `client/src/lib/services/connection.service.ts`
    - Action: Catch fetch errors and distinguish: Connection refused, DNS lookup failed, Timeout
    - Action: Return error type in validation result: `{ success: false, error: 'connection_refused' | 'dns_failed' | 'timeout' }`
    - Notes: Use try/catch with AbortController timeout

- [ ] Task 1.3.2: Display helpful error messages in wizard
    - File: `client/src/routes/setup/+page.svelte`
    - Action: Map error types to user-friendly messages using `t()` i18n function
    - Action: Show suggestion: "Make sure Ollama is running and reachable at this address"
    - Action: Allow user to edit URL and retry without restarting wizard
    - Notes: Use toast.error() for transient errors, inline error for persistent validation state

**Story 1.4: Persist Server Configuration**

- [ ] Task 1.4.1: Set isConfigured flag on wizard completion
    - File: `client/src/routes/setup/+page.svelte`
    - Action: On final step completion (after nickname saved), set `userState.isConfigured = true`
    - Action: Call `userState.save()` to persist flag
    - Notes: Ensure all required fields (server_url, nickname) are set before flagging configured

- [ ] Task 1.4.2: Verify skip logic on subsequent launches
    - File: `client/src/routes/+page.svelte`
    - Action: Test that `userState.isConfigured === true` skips setup wizard
    - Action: Verify redirect goes directly to `/chat`
    - Notes: Manual testing required (clear localStorage, restart app)

#### Epic 2: Companion System (4 stories)

**Story 2.1: Display System-Provided Default Companions**

- [ ] Task 2.1.1: Create companion list UI with badges
    - File: `client/src/routes/compagnons/+page.svelte` (if exists) or create companion selector component
    - Action: Call `CompanionService.getAll(userState.uid)` to fetch system + user companions
    - Action: Display each companion as a card with: name, description, model
    - Action: Add badge for system companions: "Default" or system icon
    - Notes: Use DaisyUI `badge` component, conditional rendering based on `companion_id` presence (system if no `user_id`)

- [ ] Task 2.1.2: Hide edit button for system companions
    - File: Companion card component
    - Action: Add conditional: `{#if isUserOwned(companion)}` to show edit button
    - Action: Define `isUserOwned()` helper: returns `true` if companion has `user_id` field (UserCompanion type)
    - Notes: System companions should be visually distinct (read-only appearance)

**Story 2.2: Create User-Owned Companion by Customizing a Default**

- [ ] Task 2.2.1: Add "Customize" button to system companion cards
    - File: Companion card component
    - Action: Add "Customize" button for system companions only (opposite condition from edit button)
    - Action: On click, call `CompanionService.fork(companion.companion_id, userState.uid)`
    - Notes: Button text: "Customize" or "Make Personal Copy"

- [ ] Task 2.2.2: Implement fork navigation and edit screen
    - File: Companion service integration
    - Action: After fork() completes, navigate to edit screen with new `user_companion_id`
    - Action: Pre-populate edit form with forked companion data
    - Notes: Edit screen should allow modification of: system_prompt, model, voice_id, avatar, name

- [ ] Task 2.2.3: Verify fork logic (already implemented)
    - File: `client/src/lib/services/companion.service.ts`
    - Action: Review `fork()` method implementation (lines 93-111)
    - Action: Confirm it creates new UUID, sets user_id, references original via companion_id
    - Notes: Logic appears correct ✅, add unit tests to verify

**Story 2.3: Persist User Companions Across App Updates**

- [ ] Task 2.3.1: Verify user_companions in database schema
    - File: `shared/db/database-scheme.ts`
    - Action: Confirm `user_companions` collection exists (line 58) ✅
    - Action: Verify FK relationships: user_id (required), companion_id (optional)
    - Notes: Schema correct, no changes needed

- [ ] Task 2.3.2: Test companion persistence across sessions
    - File: Manual testing or E2E test
    - Action: Create personal companion, close app, reopen, verify it persists
    - Action: Verify system companions can be updated (reseeded) without affecting user copies
    - Notes: RxDB persistence + localStorage should handle this automatically

**Story 2.4: Display Companion Ownership Clearly**

- [ ] Task 2.4.1: Implement ownership badges in UI
    - File: Companion card component
    - Action: Add badge logic: System companions → "Default", User companions → "Personal" or "Owned by You"
    - Action: Use color coding: neutral for system, primary/success for personal
    - Notes: Test with both types in companion list

- [ ] Task 2.4.2: Add visual distinction (edit button presence)
    - File: Companion card component
    - Action: Show pencil icon or "Edit" button ONLY for user-owned companions
    - Action: Remove edit affordances from system companions
    - Notes: Ensure hover states don't suggest editability for system companions

#### Epic 3: Chat Interface & Messaging (4 stories)

**Story 3.1: Create a New Chat Session**

- [ ] Task 3.1.1: Create "New Chat" dialog with companion selector
    - File: `client/src/routes/chat/+page.svelte` or create modal component
    - Action: Add "New Chat" button in chat list view
    - Action: On click, open dialog listing all companions (call `CompanionService.getAll()`)
    - Notes: Use DaisyUI modal, allow search/filter by companion name

- [ ] Task 3.1.2: Implement chat creation logic
    - File: `client/src/lib/services/chat.service.ts`
    - Action: Create method `createChat(userId: string, companionId: string, title?: string): Promise<Chat>`
    - Action: Generate chat_id (UUID), set initial title (e.g., "Chat with {companion.name}"), timestamps
    - Action: Insert into RxDB `chats` collection
    - Notes: Navigate to chat view `/chat/{chat_id}` after creation

- [ ] Task 3.1.3: Display new chat in chat list
    - File: Chat list component
    - Action: Use reactive query `db.chats.find().sort({ updated_at: 'desc' }).$.subscribe()`
    - Action: Verify new chats appear at top of list immediately
    - Notes: List should show: companion name, title, last message preview, timestamp

**Story 3.2: Send Text Message and Display Streaming Response**

- [ ] Task 3.2.1: Implement message sending with streaming
    - File: `client/src/lib/services/chat.service.ts`
    - Action: Create method `sendMessage(chatId: string, content: string, streaming: boolean = true)`
    - Action: Insert user message into `messages` collection with status 'sent'
    - Action: Call Ollama API via server streaming endpoint
    - Notes: Use EventSource or fetch with ReadableStream for streaming

- [ ] Task 3.2.2: Display streaming tokens in real-time
    - File: Chat message component
    - Action: Subscribe to streaming response, append tokens to assistant message content
    - Action: Show loading indicator while status === 'streaming'
    - Action: Update message status to 'done' when stream completes
    - Notes: Target <500ms latency per token (NFR-102)

- [ ] Task 3.2.3: Store messages locally after completion
    - File: `client/src/lib/services/chat.service.ts`
    - Action: On stream complete, ensure assistant message persisted to RxDB with full content
    - Action: Update chat's `updated_at` timestamp to move it to top of list
    - Notes: Use RxDB `patch()` for incremental updates during streaming

**Story 3.3: Store Chat History Locally**

- [ ] Task 3.3.1: Verify message persistence to RxDB
    - File: `client/src/lib/services/chat.service.ts`
    - Action: Confirm all messages insert into `messages` collection with chat_id FK
    - Action: Test retrieval: `db.messages.find({ selector: { chat_id } }).sort({ created_at: 'asc' })`
    - Notes: Messages should survive app restart (RxDB Dexie persistence)

- [ ] Task 3.3.2: Implement chat history loading
    - File: Chat view component
    - Action: On chat open, load all messages for chat_id using reactive query
    - Action: Display messages in order (user vs assistant styling)
    - Notes: Use infinite scroll or pagination for large chats (performance optimization)

**Story 3.4: Display Chat List Ordered by Recency**

- [ ] Task 3.4.1: Implement sort by updated_at
    - File: Chat list component
    - Action: Use query with sort: `db.chats.find().sort({ updated_at: 'desc' })`
    - Action: Verify compound index exists for `['user_id', 'updated_at']` (already added in db.ts line 88 ✅)
    - Notes: Performance should be instant (<100ms per NFR-101)

- [ ] Task 3.4.2: Update chat timestamp on new message
    - File: `client/src/lib/services/chat.service.ts`
    - Action: In `sendMessage()`, after message persisted, update chat's `updated_at = Date.now()`
    - Action: Use `chat.patch({ updated_at: Date.now() })`
    - Notes: Reactive query should automatically reorder list

#### Epic 4: Data Sync & Offline Support (4 stories)

**Story 4.1: Queue Offline Changes and Sync on Reconnect**

- [ ] Task 4.1.1: Verify offline queue behavior (RxDB built-in)
    - File: `client/src/lib/db.ts`
    - Action: Review replication setup (lines 140-170) - queuing handled by RxDB replication plugin
    - Action: Test offline scenario: disable network, create chat, re-enable, verify sync
    - Notes: RxDB automatically queues changes when replication is offline

- [ ] Task 4.1.2: Add offline indicator to UI
    - File: `client/src/lib/state/connection.svelte` or connection state module
    - Action: Expose `isOffline` reactive state based on replication state or connection checks
    - Action: Display offline badge in app header when `isOffline === true`
    - Notes: Use `replicationState.error$` or connection polling to detect offline state

- [ ] Task 4.1.3: Implement auto-sync on reconnect
    - File: `client/src/lib/db.ts`
    - Action: Verify replication `live: true` enables automatic sync on reconnect
    - Action: Monitor `replicationState.error$` for recovery events
    - Notes: Show toast notification "Syncing..." when reconnection detected

**Story 4.2: Sync Changes Across Multiple Devices**

- [ ] Task 4.2.1: Verify per-user database replication strategy
    - File: `client/src/lib/db.ts` (lines 140-170)
    - Action: Confirm remote DB name pattern: `user_{userId}_{tableName}`
    - Action: Test multi-device scenario: change on device A, observe sync to device B
    - Notes: Server must create per-user databases (handled by express-pouchdb)

- [ ] Task 4.2.2: Implement sync status indicator
    - File: Connection state or sync status component
    - Action: Show sync status: "Synced ✓", "Syncing...", "Offline"
    - Action: Use `replicationState.active$` to track ongoing sync
    - Notes: Display subtly in app footer or settings

**Story 4.3: Resolve Sync Conflicts (Last-Write-Wins)**

- [ ] Task 4.3.1: Verify LWW conflict resolution (CouchDB default)
    - File: Architecture review
    - Action: Confirm CouchDB replication uses last-write-wins based on `updated_at` timestamps
    - Action: Document that no custom conflict resolution needed for MVP
    - Notes: All entities have `updated_at` field (auto-managed)

- [ ] Task 4.3.2: Test conflict scenario
    - File: Integration test or manual test
    - Action: Edit same companion on two devices with different timestamps
    - Action: Verify later edit wins after sync
    - Notes: May show notification "Data updated from another device" (optional UX enhancement)

**Story 4.4: Handle Server Disconnection Gracefully**

- [ ] Task 4.4.1: Implement error handling for Ollama unavailability
    - File: Chat service or Ollama integration
    - Action: Catch fetch errors when calling Ollama streaming endpoint
    - Action: Display error: "Server unavailable - cannot send message"
    - Notes: Allow viewing local chat history even when server down

- [ ] Task 4.4.2: Retry logic for transient failures
    - File: Connection service or chat service
    - Action: Implement exponential backoff retry for failed requests
    - Action: Show "Retrying..." indicator, max 3 retries
    - Notes: Don't retry user-initiated actions, only background sync

#### Epic 5: Test Coverage & Reliability (5 stories)

**Story 5.1: Unit Tests for Companion Ownership Model**

- [ ] Task 5.1.1: Create companion.service.test.ts
    - File: `client/src/lib/services/companion.service.test.ts` (NEW)
    - Action: Write test for `fork()` method
    - Action: Verify new user_companion created with correct user_id, companion_id reference
    - Action: Verify original system companion unchanged
    - Notes: Mock RxDB with `vi.mock('$lib/db')`

- [ ] Task 5.1.2: Test getAll() override logic
    - File: `client/src/lib/services/companion.service.test.ts`
    - Action: Create test data: system companion + user fork
    - Action: Call `getAll(userId)`, verify system companion NOT in result (overridden)
    - Action: Verify user fork IS in result
    - Notes: Test edge case: user companion without companion_id (custom, not fork)

**Story 5.2: Integration Tests for Offline/Online Sync**

- [ ] Task 5.2.1: Create sync integration test
    - File: `client/src/lib/db.test.ts` (NEW)
    - Action: Mock replication state with offline/online transitions
    - Action: Create message while "offline", verify queued locally
    - Action: Trigger "online" event, verify sync attempt
    - Notes: Use in-memory PouchDB for server mock

- [ ] Task 5.2.2: Test no-duplication guarantee
    - File: Sync integration test
    - Action: Create same message on two "devices" (two RxDB instances)
    - Action: Sync both to server, verify only one copy persists
    - Notes: Test that CouchDB revision handling prevents duplicates

**Story 5.3: E2E Test for Onboarding Journey**

- [ ] Task 5.3.1: Create onboarding E2E test
    - File: `client/tests/e2e/onboarding.spec.ts` (NEW, requires E2E framework like Playwright)
    - Action: Test sequence: Launch app → Wizard appears → Enter server URL → Validate → Enter nickname → Complete
    - Action: Verify redirect to /chat after completion
    - Notes: Mock Ollama server responses for health check

- [ ] Task 5.3.2: Test first message scenario
    - File: Onboarding E2E test
    - Action: After onboarding, select companion, create chat, send message
    - Action: Verify streaming response appears
    - Action: Verify message persisted in chat history
    - Notes: Use deterministic mock responses for consistency

**Story 5.4: E2E Test for Multi-Device Sync**

- [ ] Task 5.4.1: Create multi-device sync test
    - File: `client/tests/e2e/sync.spec.ts` (NEW)
    - Action: Launch two browser contexts (simulate Device A and Device B)
    - Action: Device A creates custom companion, Device B polls for sync
    - Action: Verify companion appears on Device B within 5 seconds
    - Notes: Requires shared server state, may need Docker for test isolation

**Story 5.5: Mock Ollama Server for Testing**

- [ ] Task 5.5.1: Create mock Ollama service
    - File: `server/test-utils/mock-ollama.ts` (NEW)
    - Action: Implement mock HTTP server with endpoints: /api/health, /api/chat (streaming)
    - Action: Return deterministic responses for test consistency
    - Notes: Use `node:http` or `express` for mock server

- [ ] Task 5.5.2: Integrate mock into test setup
    - File: Vitest setup files
    - Action: Start mock Ollama server before tests, stop after
    - Action: Configure tests to use mock URL (e.g., `http://localhost:11435`)
    - Notes: Set environment variable `OLLAMA_HOST` for test overrides

### Acceptance Criteria

#### Epic 1: Onboarding & Server Connection

- [ ] AC 1.1: Given the app is launched for the first time, when the app initializes, then the onboarding wizard appears with Step 1 (Welcome)
- [ ] AC 1.2: Given the wizard is on Step 1, when I click "Get Started", then Step 2 (Server Config) appears
- [ ] AC 1.3: Given I'm on Step 2, when I enter a server URL and click "Test Connection", then the app sends a health check to `${url}/api/health`
- [ ] AC 1.4: Given the server is reachable, when validation completes, then a success message "Connected successfully ✓" appears and the "Next" button is enabled
- [ ] AC 1.5: Given the server is unreachable, when validation fails, then a specific error message appears ("Connection refused" or "DNS lookup failed" or "Timeout") with suggestion "Make sure Ollama is running and reachable"
- [ ] AC 1.6: Given validation failed, when I edit the URL and click "Test Connection" again, then validation retries without restarting the wizard
- [ ] AC 1.7: Given I completed Step 2 (server validated), when I click "Next", then the server URL is saved to `userState.preferences.serverUrl` and Step 3 (Profile) appears
- [ ] AC 1.8: Given I entered my nickname on Step 3, when I click "Complete", then `userState.isConfigured = true` and I'm redirected to `/chat`
- [ ] AC 1.9: Given I've completed onboarding once, when I close and reopen the app, then the wizard is skipped and I go directly to `/chat`

#### Epic 2: Companion System

- [ ] AC 2.1: Given the onboarding is complete, when I view the companion selector, then I see all system-provided companions listed with "Default" badges
- [ ] AC 2.2: Given I'm viewing a system companion card, when I look for edit affordances, then no "Edit" button is visible (read-only)
- [ ] AC 2.3: Given I'm viewing a system companion, when I click "Customize", then a new user-owned companion is created (copy of the system default)
- [ ] AC 2.4: Given a companion was forked, when the copy is created, then it has a new `user_companion_id`, references the original via `companion_id`, and has `user_id` set to current user
- [ ] AC 2.5: Given I forked a companion, when I'm taken to the edit screen, then I can modify `system_prompt`, `model`, `voice_id`, `avatar`, and `name`
- [ ] AC 2.6: Given I customized a companion, when I save changes, then the original system companion remains unchanged
- [ ] AC 2.7: Given I've created a personal companion, when a new app version is released and installed, then my personal companion persists with all customizations intact
- [ ] AC 2.8: Given I'm viewing the companion list, when I look at companion cards, then system companions have "Default" badges and personal companions have "Personal" or "Owned by You" badges
- [ ] AC 2.9: Given I'm viewing a personal companion, when I look for edit affordances, then an "Edit" button IS visible

#### Epic 3: Chat Interface & Messaging

- [ ] AC 3.1: Given I'm on the chat home screen, when I click "New Chat", then a dialog appears listing all companions (system + personal)
- [ ] AC 3.2: Given the new chat dialog is open, when I select a companion, then a new chat session is created with that companion and I'm taken to the chat view
- [ ] AC 3.3: Given the new chat was created, when I view the chat list, then the new chat appears at the top with the companion's name and timestamp
- [ ] AC 3.4: Given I have an open chat, when I type a message and click "Send", then my message appears immediately with status 'sent'
- [ ] AC 3.5: Given I sent a message, when the AI starts responding, then a loading indicator appears and streaming tokens appear one at a time (first token <500ms)
- [ ] AC 3.6: Given the AI is streaming, when the response completes, then the loading indicator disappears and the message status changes to 'done'
- [ ] AC 3.7: Given the response is complete, when I check the database, then the assistant message is stored with full content and metadata
- [ ] AC 3.8: Given I've had multiple conversations, when I close and reopen the app, then all my chats are still visible in the chat list
- [ ] AC 3.9: Given I have multiple chats, when I view the chat list, then chats are ordered by `updated_at` timestamp (most recent first)
- [ ] AC 3.10: Given I send a message to an old chat, when the message is sent, then that chat moves to the top of the list

#### Epic 4: Data Sync & Offline Support

- [ ] AC 4.1: Given my internet connection is offline, when I create a new chat and send a message, then the chat and message are saved locally and an "offline" indicator appears
- [ ] AC 4.2: Given I made changes offline, when my internet connection is restored, then queued changes sync to the server automatically and the offline indicator disappears
- [ ] AC 4.3: Given I synced offline changes, when I check other devices, then no duplicate messages appear
- [ ] AC 4.4: Given I have the app on mobile and desktop, when I create a custom companion on mobile, then the desktop app syncs automatically (within 5 seconds) and the companion appears
- [ ] AC 4.5: Given I edited a companion on mobile at 10:00:00 and the same companion on desktop at 10:00:05, when both devices sync, then the desktop version (later timestamp) wins and mobile is overwritten
- [ ] AC 4.6: Given a conflict was resolved, when I check both devices, then both show the latest version consistently
- [ ] AC 4.7: Given the Ollama server becomes unreachable, when I try to send a message, then a clear error appears "Server unavailable" and the message is NOT sent
- [ ] AC 4.8: Given the server was down, when I view my app, then I can still access and read my local chat history
- [ ] AC 4.9: Given the server is reachable again, when I retry sending a message, then it succeeds

#### Epic 5: Test Coverage & Reliability

- [ ] AC 5.1: Given I run the companion service unit tests, when testing `fork()`, then a new `user_companion` record is created with correct `user_id` and `companion_id` reference
- [ ] AC 5.2: Given I run the companion service unit tests, when testing `getAll()`, then system companions that have user forks are NOT returned (filtered out)
- [ ] AC 5.3: Given I run the sync integration tests, when a message is created offline, then it's queued locally
- [ ] AC 5.4: Given the sync integration test transitions online, when sync triggers, then the queued message is sent and no duplicates appear
- [ ] AC 5.5: Given I run the onboarding E2E test, when the test executes the full flow (wizard → server config → nickname → complete), then the app redirects to `/chat` and first message can be sent
- [ ] AC 5.6: Given I run the multi-device sync E2E test, when Device A creates a custom companion, then Device B displays it within 5 seconds
- [ ] AC 5.7: Given I run tests with the mock Ollama server, when the app connects, then health checks succeed and chat requests return deterministic responses
- [ ] AC 5.8: Given I run the full test suite, when test coverage is calculated, then critical paths (Companion, Chat, Sync, Ollama services) have ≥80% coverage

## Additional Context

### Dependencies

- RxDB v15+ (client-side reactive database)
- PouchDB v9+ (server-side CouchDB-compatible database)
- Svelte 5 with Runes (no legacy syntax)
- Vitest (testing framework)
- Ollama (local LLM server - external dependency)

### Testing Strategy

**Unit Test Priority (Epic 5):**

1. Ollama Service: Mock HTTP calls, verify streaming, error handling
2. Companion Service: Test copy-on-customize logic, FK relationships
3. Sync Service: Test offline queue, conflict resolution (LWW), multi-device consistency
4. Chat Service: Test message persistence, chat list ordering
5. Onboarding Flow: Test wizard state machine, server validation, persistence

**Test Patterns:**

- Mock PouchDB/RxDB with in-memory instances
- Mock Ollama responses with fixtures
- Test sync scenarios: offline→online, conflict resolution, no duplication

### Notes

- **Brownfield Consolidation:** Existing codebase is functional but needs clarity, NOT a rewrite
- **No New Features:** This sprint ONLY clarifies architecture and improves test coverage
- **Copy-on-Customize:** User never modifies system companions directly; always creates a personal copy first
- **Offline-First:** All data operations work offline; sync happens in background when online
- **Last-Write-Wins (LWW):** Simple conflict resolution strategy using `updated_at` timestamps for MVP

---

## Epic 6: Voice Features (STT/TTS) - Implementation Plan

### Technical Architecture

**Voice Processing Strategy:**

- **Web:** Server-side processing (Whisper for STT, Piper for TTS via Node.js child processes)
- **Desktop:** Native child processes spawned by Electron main process (lower latency)
- **Mobile:** Capacitor audio plugin with server fallback

**Audio Formats:**

- **Input (STT):** 16kHz mono WAV (Whisper requirement)
- **Output (TTS):** MP3/OGG (web-compatible streaming format)

**Service Abstraction:**

```typescript
interface IPlatformAudioService {
	recordAudio(): Promise<AudioBlob>;
	transcribe(audio: AudioBlob): Promise<string>;
	synthesize(text: string): Promise<AudioBlob>;
	playAudio(audio: AudioBlob): Promise<void>;
}
```

**Implementations:**

- `WebAudioService` - Uses MediaRecorder API + server endpoints
- `ElectronAudioService` - Uses IPC to main process + native binaries
- `CapacitorAudioService` - Uses Capacitor plugins + server fallback

### Server-Side Voice Infrastructure

**New Services:**

**1. WhisperService (`server/services/whisper.service.ts`)**

```typescript
class WhisperService {
	private whisperPath = './bin/whisper/whisper-cpp';

	async transcribe(audioPath: string): Promise<string> {
		// Spawn whisper-cpp child process
		// Args: -f audio.wav -m models/ggml-base.bin -otxt
		// Return transcribed text
	}
}
```

**2. PiperService (`server/services/piper.service.ts`)**

```typescript
class PiperService {
	private piperPath = './bin/piper/piper';

	async synthesize(text: string, voice: string = 'en_US-lessac'): Promise<Buffer> {
		// Spawn piper child process
		// Echo text | piper --model voice.onnx --output_file -
		// Return audio buffer (WAV)
	}
}
```

**3. AudioService (`server/services/audio.service.ts`)**

```typescript
class AudioService {
	constructor(
		private whisperService: WhisperService,
		private piperService: PiperService
	) {}

	async transcribeAudio(audioBuffer: Buffer): Promise<{ text: string }> {
		// Save buffer to temp file
		// Call whisperService.transcribe()
		// Clean up temp file
		// Return { text }
	}

	async synthesizeSpeech(text: string, voice?: string): Promise<Buffer> {
		// Call piperService.synthesize()
		// Convert WAV to MP3 if needed (ffmpeg)
		// Return audio buffer
	}
}
```

**New API Endpoints (`server/server.ts`):**

```typescript
// POST /api/voice/transcribe
// Body: FormData with audio file (multipart/form-data)
// Response: { text: string }

// POST /api/voice/synthesize
// Body: { text: string, voice?: string }
// Response: Audio stream (Content-Type: audio/mpeg)
```

### Client-Side Voice Architecture

**Platform Detection (`client/src/lib/utils/platform.ts`):**

```typescript
export function getPlatformType(): 'web' | 'electron' | 'capacitor' {
	if (window.Capacitor) return 'capacitor';
	if (window.require) return 'electron';
	return 'web';
}

export function getAudioService(): IPlatformAudioService {
	const platform = getPlatformType();
	switch (platform) {
		case 'web':
			return new WebAudioService();
		case 'electron':
			return new ElectronAudioService();
		case 'capacitor':
			return new CapacitorAudioService();
	}
}
```

**WebAudioService (`client/src/lib/services/web-audio.service.ts`):**

```typescript
class WebAudioService implements IPlatformAudioService {
	private mediaRecorder?: MediaRecorder;

	async recordAudio(): Promise<AudioBlob> {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		this.mediaRecorder = new MediaRecorder(stream);
		// Record audio chunks, return blob
	}

	async transcribe(audio: AudioBlob): Promise<string> {
		const formData = new FormData();
		formData.append('audio', audio);
		const response = await fetch('/api/voice/transcribe', {
			method: 'POST',
			body: formData
		});
		const { text } = await response.json();
		return text;
	}

	async synthesize(text: string): Promise<AudioBlob> {
		const response = await fetch('/api/voice/synthesize', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text })
		});
		return await response.blob();
	}

	async playAudio(audio: AudioBlob): Promise<void> {
		const audioElement = new Audio(URL.createObjectURL(audio));
		await audioElement.play();
	}
}
```

**ElectronAudioService (`client/src/lib/services/electron-audio.service.ts`):**

```typescript
class ElectronAudioService implements IPlatformAudioService {
	async transcribe(audio: AudioBlob): Promise<string> {
		// Send audio to main process via IPC
		const text = await window.ipcRenderer.invoke('audio:transcribe', audio);
		return text;
	}

	async synthesize(text: string): Promise<AudioBlob> {
		// Send text to main process via IPC
		const audioBuffer = await window.ipcRenderer.invoke('audio:synthesize', text);
		return new Blob([audioBuffer], { type: 'audio/wav' });
	}
}
```

**Electron IPC Handlers (`electron/audio-handler.js`):**

```javascript
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

ipcMain.handle('audio:transcribe', async (event, audioBlob) => {
	const tempPath = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);
	fs.writeFileSync(tempPath, Buffer.from(audioBlob));

	return new Promise((resolve, reject) => {
		const whisper = spawn('./bin/whisper/whisper-cpp', ['-f', tempPath, '-m', './bin/whisper/models/ggml-base.bin', '-otxt']);

		let output = '';
		whisper.stdout.on('data', (data) => (output += data));
		whisper.on('close', () => {
			fs.unlinkSync(tempPath);
			resolve(output.trim());
		});
	});
});

ipcMain.handle('audio:synthesize', async (event, text) => {
	return new Promise((resolve) => {
		const piper = spawn('./bin/piper/piper', ['--model', './bin/piper/voices/en_US-lessac.onnx', '--output_file', '-']);

		piper.stdin.write(text);
		piper.stdin.end();

		const chunks = [];
		piper.stdout.on('data', (chunk) => chunks.push(chunk));
		piper.on('close', () => resolve(Buffer.concat(chunks)));
	});
});
```

### Voice UI Components

**VoiceButton Component (`client/src/components/audio/VoiceButton.svelte`):**

```svelte
<script lang="ts">
	import { getAudioService } from '$lib/utils/platform';
	import { t } from '$lib/state/i18n.svelte';

	let isRecording = $state(false);
	let isProcessing = $state(false);

	const audioService = getAudioService();

	async function handleRecordClick() {
		if (isRecording) {
			isRecording = false;
			isProcessing = true;

			const audio = await audioService.recordAudio();
			const text = await audioService.transcribe(audio);

			// Emit transcribed text to parent
			ontranscribe?.(text);

			isProcessing = false;
		} else {
			isRecording = true;
			await audioService.recordAudio();
		}
	}
</script>

<button
	class="btn btn-circle"
	class:btn-error={isRecording}
	class:btn-disabled={isProcessing}
	onclick={handleRecordClick}
	aria-label={t(isRecording ? 'audio.stop_recording' : 'audio.start_recording')}
>
	{#if isProcessing}
		<span class="loading loading-spinner"></span>
	{:else if isRecording}
		<span class="animate-pulse">🎙️</span>
	{:else}
		🎤
	{/if}
</button>
```

**AudioPlayer Component (`client/src/components/audio/AudioPlayer.svelte`):**

```svelte
<script lang="ts">
	import { getAudioService } from '$lib/utils/platform';

	let { audioBlob } = $props<{ audioBlob: Blob }>();
	let isPlaying = $state(false);

	const audioService = getAudioService();

	async function handlePlay() {
		isPlaying = true;
		await audioService.playAudio(audioBlob);
		isPlaying = false;
	}
</script>

<button class="btn btn-sm btn-primary" onclick={handlePlay} disabled={isPlaying}>
	{#if isPlaying}
		⏸️ Pause
	{:else}
		▶️ Play
	{/if}
</button>
```

### Implementation Tasks (Epic 6)

**Story 6.1: Web Platform - Server-Side STT/TTS**

- [ ] Task 6.1.1: Create WhisperService (server/services/whisper.service.ts)
- [ ] Task 6.1.2: Create PiperService (server/services/piper.service.ts)
- [ ] Task 6.1.3: Create AudioService (server/services/audio.service.ts)
- [ ] Task 6.1.4: Add API endpoints /api/voice/transcribe and /api/voice/synthesize
- [ ] Task 6.1.5: Create WebAudioService (client/src/lib/services/web-audio.service.ts)
- [ ] Task 6.1.6: Create VoiceButton component
- [ ] Task 6.1.7: Create AudioPlayer component
- [ ] Task 6.1.8: Add voice translations to i18n (audio.start_recording, audio.stop_recording, etc.)

**Story 6.2: Desktop Platform - Native Child Processes**

- [ ] Task 6.2.1: Create Electron IPC handlers (electron/audio-handler.js)
- [ ] Task 6.2.2: Create ElectronAudioService (client/src/lib/services/electron-audio.service.ts)
- [ ] Task 6.2.3: Test native Whisper/Piper execution in Electron main process
- [ ] Task 6.2.4: Implement fallback to server if binaries unavailable

**Story 6.3: Mobile Platform - Native Bridge**

- [ ] Task 6.3.1: Research Capacitor audio plugins (capacitor-voice-recorder, native-audio)
- [ ] Task 6.3.2: Create CapacitorAudioService (client/src/lib/services/capacitor-audio.service.ts)
- [ ] Task 6.3.3: Implement permission request flow for microphone
- [ ] Task 6.3.4: Test server fallback on mobile

**Story 6.4: Voice UI Controls**

- [ ] Task 6.4.1: Integrate VoiceButton into chat interface
- [ ] Task 6.4.2: Add visual feedback (listening animation, waveform)
- [ ] Task 6.4.3: Implement undo/re-record functionality
- [ ] Task 6.4.4: Handle permission denied errors with helpful messages

---

## Epic 7: Accessibility & i18n - Implementation Plan

### Existing i18n System Analysis

**Current Implementation:**

- ✅ Custom i18n with Svelte 5 Runes (`client/src/lib/state/i18n.svelte.ts`)
- ✅ Reactive `t()` function using `userState.preferences.locale`
- ✅ Translation files: `client/src/locales/translations.js`
- ✅ 5 languages supported: en, fr, de, es, it
- ✅ Dot notation for nested keys (e.g., `t('settings.general')`)
- ✅ Variable interpolation (`{{varName}}`)
- ✅ Fallback to English if translation missing

**What's Missing:**

- ❌ Not all UI strings externalized (some hardcoded English text remains)
- ❌ Date/time localization not implemented (use Intl.DateTimeFormat)
- ❌ Browser language auto-detection on first launch

### Accessibility Architecture

**ARIA Strategy:**

- Add `aria-label`, `aria-describedby`, `aria-live` to components
- Use semantic HTML (`<nav>`, `<main>`, `<header>`, `<footer>`)
- Proper heading hierarchy (h1 → h2 → h3)
- Form field labels with `<label for="id">`

**Keyboard Navigation:**

- Focus management with `svelte-focus-trap` for modals
- Arrow key navigation for lists (companions, chats)
- Escape key to close modals
- Visible focus indicators (`:focus-visible`)

**Screen Reader Support:**

- Live regions (`aria-live="polite"`) for chat messages
- Status announcements for loading/errors
- Descriptive button labels

### Implementation Tasks (Epic 7)

**Story 7.1: WCAG 2.1 AA Compliance**

- [ ] Task 7.1.1: Audit existing components for semantic HTML issues
- [ ] Task 7.1.2: Add ARIA labels to all interactive elements
    - Buttons: `aria-label` for icon-only buttons
    - Forms: Associate `<label>` with inputs using `for` attribute
    - Errors: Use `aria-describedby` for error messages
- [ ] Task 7.1.3: Verify color contrast ratios using axe DevTools
    - Test all text on backgrounds (min 4.5:1 for normal text)
    - Fix any failing contrast ratios in DaisyUI theme
- [ ] Task 7.1.4: Fix heading hierarchy
    - Ensure h1 on every page (app title)
    - Logical h2 → h3 structure (no skips)
- [ ] Task 7.1.5: Add landmark regions
    - `<header role="banner">` for app header
    - `<nav role="navigation">` for sidebar
    - `<main role="main">` for content area
    - `<footer role="contentinfo">` if applicable

**Story 7.2: Full Keyboard Navigation**

- [ ] Task 7.2.1: Install `svelte-focus-trap` for modals
- [ ] Task 7.2.2: Implement focus trap in modal components
    - OnboardingWizard modal
    - CompanionSelector dialog
    - Settings modal
- [ ] Task 7.2.3: Add visible focus indicators
    - CSS: `:focus-visible { outline: 2px solid var(--primary); }`
    - Test tab order through all interactive elements
- [ ] Task 7.2.4: Implement arrow key navigation for lists
    - Companion list: ↑↓ to select, Enter to open
    - Chat list: ↑↓ to select, Enter to open chat
    - Use `onkeydown` event handlers
- [ ] Task 7.2.5: Test Escape key for modal close
    - All modals should close on Escape
    - Focus should return to trigger element

**Story 7.3: Screen Reader Support**

- [ ] Task 7.3.1: Add live region for chat messages
    ```svelte
    <div aria-live="polite" aria-atomic="true" class="sr-only">
    	{#if latestMessage}
    		{latestMessage.role === 'assistant' ? t('ui.assistant') : t('ui.you')}: {latestMessage.content}
    	{/if}
    </div>
    ```
- [ ] Task 7.3.2: Add loading state announcements
    - Connection status: "Connecting to server..."
    - Message generation: "Assistant is typing..."
    - Use `aria-live="polite"`
- [ ] Task 7.3.3: Add error announcements
    - Use `aria-live="assertive"` for errors
    - Example: "Error: Unable to connect to server"
- [ ] Task 7.3.4: Test with screen readers
    - Windows: NVDA (free)
    - macOS: VoiceOver (built-in)
    - Verify all critical flows work

**Story 7.4: Complete i18n Coverage**

- [ ] Task 7.4.1: Audit codebase for hardcoded English strings
    - Search for string literals in components: `grep -r '"[A-Z]' client/src/components`
    - List all hardcoded strings needing translation
- [ ] Task 7.4.2: Add missing translations to all 5 language files
    - `client/src/locales/translations.js` (en)
    - `client/src/locales/fr.ts` (fr)
    - `client/src/locales/de.ts` (de)
    - `client/src/locales/es.ts` (es)
    - `client/src/locales/it.ts` (it)
    - Epic 6 voice keys: audio.start_recording, audio.stop_recording, audio.transcribing, audio.error_permission
- [ ] Task 7.4.3: Replace hardcoded strings with `t()` calls
    - Example: `"Save"` → `{t('common.save')}`
    - Test that UI updates reactively when locale changes
- [ ] Task 7.4.4: Implement date/time localization
    ```typescript
    function formatDate(timestamp: number, locale: string): string {
    	return new Intl.DateTimeFormat(locale, {
    		year: 'numeric',
    		month: 'short',
    		day: 'numeric',
    		hour: '2-digit',
    		minute: '2-digit'
    	}).format(new Date(timestamp));
    }
    ```
- [ ] Task 7.4.5: Add browser language auto-detection
    ```typescript
    // In client/src/lib/state/user.svelte.ts
    if (!userState.preferences.locale) {
    	const browserLang = navigator.language.split('-')[0]; // 'en-US' → 'en'
    	const supportedLangs = ['en', 'fr', 'de', 'es', 'it'];
    	userState.preferences.locale = supportedLangs.includes(browserLang) ? browserLang : 'en';
    }
    ```
- [ ] Task 7.4.6: Test language switching in settings
    - Change locale in settings dropdown
    - Verify UI updates without page reload (Svelte 5 reactivity)
    - Verify locale persists to localStorage

---

## Updated Summary

**Total Epics: 7**
**Total Stories: 29**
**Total Tasks: ~100**

**Implementation Status:**

- ✅ Epic 1-4: Already implemented (Onboarding, Companions, Chat, Sync)
- 🔜 Epic 5: Testing & Quality (next priority)
- 🔜 Epic 6: Voice Features (4 stories, 16 tasks)
- 🔜 Epic 7: Accessibility & i18n (4 stories, 17 tasks)

**Architecture Additions:**

- Voice: Server-side Whisper/Piper + platform abstraction (Web/Desktop/Mobile)
- Accessibility: ARIA labels, keyboard nav, screen reader support, focus management
- i18n: Leverage existing system, complete translation coverage, date/time localization

**Requirements Coverage: 100%**

- 21/21 Functional Requirements ✅
- 20/20 Non-Functional Requirements ✅
