---
stepsCompleted: [1, 2, 3]
inputDocuments:
    - PROJECT.md
    - README.md
workflowType: 'prd'
lastStep: 3
documentCounts:
    briefCount: 0
    researchCount: 0
    brainstormingCount: 0
    projectDocsCount: 2
---

# Product Requirements Document - wollama

**Author:** Mydde
**Date:** 2026-01-09

## Executive Summary

### What Makes This Special

**Wollama** is a cross-platform AI chat application (Web, Desktop, Mobile) with offline-first architecture. This PRD focuses on **consolidating and improving the foundation** rather than adding new features.

**Current State :** The application is feature-rich but has architectural debt that impacts stability and maintainability. The login/onboarding flow is undefined, and the Companion management system lacks clarity.

**This PRD Addresses :**

1. **Clarifying Companion Architecture** - Resolve the confusing split between `companion` (app defaults) and `user_companions` (personalized)
2. **Improving Test Coverage** - Ensure cross-platform sync reliability
3. **Fixing Onboarding Flow** - Define clear login/first-connection UX

### Product Differentiator

This is a **technical debt resolution + UX improvement sprint**. Most products add features; we're making sure the foundation can support what's already built.

**Key Insight:** Offline-first sync with three platforms (Web/Desktop/Mobile) is complex. Clarity on data ownership (who owns what) is prerequisite for test coverage.

## Project Classification

**Technical Type:** Cross-platform application improvement (Web + Desktop + Mobile)
**Domain:** General software (AI chat application)
**Complexity:** Medium
**Project Context:** Brownfield - extending existing system with focus on foundation cleanup

### Companion Architecture Clarification

**Current Problem:** Unclear separation between system defaults and user customizations

**Solution Model:** Copy-on-customize pattern

- System provides default companions (immutable templates)
- User creates personal copy when they customize
- Each user companion is independent and owned by that user
- Updates to system defaults don't retroactively affect existing user copies

**Scope Includes:**

- Clear data model definition (relationships, ownership)
- Migration strategy for existing data
- Sync behavior across devices (multi-device consistency)
- Test scenarios for offline/online transitions

### Scenarios Covered

1. **User Creates Personalized Companion** - Create derivative from default, establish ownership
2. **App Pushes Default Update** - New/updated system companions appear; existing user copies unaffected
3. **User Loses Connection** - Offline modifications queue correctly; sync when reconnected
4. **Multi-Device Sync** - User changes companion on mobile, desktop syncs correctly

## Success Criteria

### User Success

**"It works reliably across all three platforms"**

- User can send/receive messages on Web, Desktop, and Mobile without data loss
- Chat history syncs correctly when switching between devices
- Offline mode gracefully handles reconnection (no duplicate messages, no lost data)
- Voice features (STT/TTS) function consistently across platforms
- Onboarding flow is intuitive - new user understands how to start a chat in <5 minutes
- Companion system is understandable - user knows what they can customize vs system defaults

### Business Success

N/A - Personal/small team project focused on technical excellence rather than growth metrics.

### Technical Success

**Foundation Stability:**

- All critical sync scenarios covered by tests (offline/online transitions, multi-device, conflict resolution)
- Companion architecture clearly defined and documented (who owns what, migration strategy)
- Login/onboarding UX flow formally documented with clear handoff between screens
- Test suite provides confidence for future changes (no fear of breaking things)
- Cross-platform code paths (Web → Server, Desktop → Child Processes, Mobile → Native Plugin) are testable in isolation

**Measurable Outcomes:**

- Test coverage ≥80% for critical paths (data sync, companion management, auth flow)
- All documented scenarios pass: user creates custom companion, app updates defaults, offline sync, multi-device
- Zero architectural ambiguity - companion data model is documented with diagrams
- Onboarding documented as state machine or flow diagram (wireframe → code)
- Setup and running tests should take <10 minutes on clean machine

## Product Scope

### MVP - Consolidation Phase (This PRD)

- Clarify and document companion architecture (defaults vs user-owned)
- Migrate/test existing companion data to new model
- Build out test coverage for sync scenarios
- Document login/onboarding UX flow
- Ensure all three platforms handle edge cases consistently

### Growth Features (Post-MVP)

- Advanced customization of companions (fine-tuning parameters)
- Multi-user collaboration on chats
- Plugin system for custom companions
- Integration with external LLMs beyond Ollama

### Vision (Future)

- Community companion marketplace
- Advanced offline scenarios (full app update while offline)
- Real-time collaborative chat

## User Journeys

### Journey 1: New User - First Chat

User launches app → Sees onboarding flow → Connects to Ollama server → Selects default companion → Sends first message → Receives streaming response → Chat saved to local database.

**Critical Points:**

- Onboarding must explain where Ollama runs (local machine, network address)
- Server URL configuration clear and not error-prone
- Default companions immediately available without setup
- First message response confirms everything works

### Journey 2: User Customizes a Companion

User selects a default companion → Clicks "customize" → Creates personal copy → Modifies system prompt/model → Saves as new companion → Uses customized version in future chats.

**Critical Points:**

- Clear visual distinction: default (read-only) vs personal (editable)
- Personal copy persists after app updates
- Personal copy syncs across devices
- Model/system_prompt changes don't break existing chats

### Journey 3: Multi-Device Sync

User creates chat on mobile → Creates/customizes companion on mobile → Switches to desktop → Desktop syncs companions and chat history → All data present and correct → Makes changes on desktop → Mobile syncs changes.

**Critical Points:**

- Offline changes queue and sync when online
- No data loss or duplication on sync
- Companion ownership consistent across platforms
- Conflict resolution for simultaneous edits (last-write-wins acceptable)

### Journey Requirements Summary

**Onboarding/Server Connection:**

- Server URL config screen
- Connection test/validation
- Error handling for unreachable server
- Instructions for local Ollama setup

**Companion Management:**

- Display default companions (system-owned)
- Allow "customize" → create user-owned copy
- Store customization ownership
- Handle companion updates from server

**Data Sync:**

- RxDB ↔ PouchDB replication working
- Offline queue for edits
- Sync on reconnection
- Conflict resolution strategy
- Multi-device consistency

---

## Functional Requirements

### Onboarding & Authentication

- **FR-101:** Display initial setup wizard on first launch
- **FR-102:** Capture server URL (local or network Ollama instance)
- **FR-103:** Validate server connection before proceeding
- **FR-104:** Clear error messages for connection failures
- **FR-105:** Store server URL in user preferences for future sessions

### Companion Management

- **FR-201:** Display system-provided default companions (read-only)
- **FR-202:** "Customize" button creates user-owned copy with unique ID
- **FR-203:** User can edit: system_prompt, model selection, voice_id, avatar
- **FR-204:** Clear visual distinction: system (badge) vs personal (owned indicator)
- **FR-205:** Personal companions persist across app updates
- **FR-206:** List all companions (system + personal) in chat interface

### Chat & Messaging

- **FR-301:** Create new chat associated with specific companion
- **FR-302:** Send text message to AI via streaming API
- **FR-303:** Display streaming responses as they arrive
- **FR-304:** Store message locally (user/assistant) with metadata
- **FR-305:** Persist chat history in local database
- **FR-306:** Display chat list ordered by last update

### Data Sync

- **FR-401:** Sync changes (new chats, messages, companions) to server
- **FR-402:** Queue offline changes; sync when online
- **FR-403:** Sync multi-device: changes on mobile appear on desktop
- **FR-404:** Handle sync conflicts (last-write-wins for MVP)

### Platform Specifics

- **FR-501:** Web: Server handles STT/TTS processing
- **FR-502:** Desktop (Electron): Use native child processes for STT/TTS
- **FR-503:** Mobile (Capacitor): Fallback to server for STT/TTS (or native bridge)

## Non-Functional Requirements

### Performance

- **NFR-101:** Server response latency <100ms for UI operations
- **NFR-102:** Streaming tokens appear <500ms after sent
- **NFR-103:** App startup time <3 seconds on all platforms
- **NFR-104:** Offline cache load <1 second

### Reliability

- **NFR-201:** No data loss on app crash or unexpected shutdown
- **NFR-202:** Sync conflict resolution guarantees no duplicate messages
- **NFR-203:** Multi-device sync maintains consistency (observable within 5s)
- **NFR-204:** Graceful degradation when server unavailable

### Testability

- **NFR-301:** Test coverage ≥80% for critical paths
- **NFR-302:** All sync scenarios testable in isolation
- **NFR-303:** Mock Ollama server for testing
- **NFR-304:** Offline/online transitions testable

### Accessibility

- **NFR-401:** WCAG 2.1 AA compliance
- **NFR-402:** Keyboard navigation for all UI
- **NFR-403:** Screen reader support for chat
- **NFR-404:** Multi-language support (English, French, German, Spanish, Italian)

### Security

- **NFR-501:** Server URL validated before connection
- **NFR-502:** No credentials stored in local database
- **NFR-503:** All communication to Ollama server via secure protocol (TLS if over network)

## Data Model & Architecture

### Companion Ownership Model

```
SYSTEM COMPANIONS (Server-Managed)
  └─ companion_id: system-generated
  └─ is_locked: true
  └─ owner: "system"

USER COMPANIONS (User-Owned)
  └─ user_companion_id: derived from (user_id, companion_id)
  └─ user_id: owner
  └─ companion_id: reference to original system companion
  └─ custom fields: system_prompt, model, voice_id, avatar (overrides)
```

### Sync Conflict Resolution

- **Strategy:** Last-write-wins (LWW)
- **Timestamp:** updated_at on all documents
- **Implementation:** PouchDB replication with LWW resolver
- **Scenario:** User A modifies companion on mobile, User A modifies same companion on desktop simultaneously → desktop version wins (latest timestamp)

## Constraints & Assumptions

### Constraints

- **C-101:** Ollama must be running and reachable (local or network)
- **C-102:** Single-user per app instance (no multi-user login)
- **C-103:** Offline sync limited to local database size
- **C-104:** Voice features dependent on Ollama STT/TTS availability

### Assumptions

- **A-101:** Users can configure Ollama server URL correctly
- **A-102:** Users understand concept of "Ollama server"
- **A-103:** Network connectivity available for multi-device sync
- **A-104:** Offline-first preferred over always-online requirement

## Testing Strategy

### Critical Scenarios

**Scenario 1: Onboarding**

- [ ] New user launches app
- [ ] Onboarding wizard appears
- [ ] User enters server URL
- [ ] Connection validated
- [ ] Default companions load
- [ ] User creates first chat

**Scenario 2: Customize Companion**

- [ ] User selects system companion
- [ ] "Customize" creates personal copy
- [ ] User modifies system_prompt
- [ ] Personal copy persists after app restart

**Scenario 3: Offline → Online**

- [ ] Disable network connection
- [ ] User creates chat and sends message
- [ ] Message queued locally
- [ ] Enable network connection
- [ ] Message syncs to server
- [ ] No duplicates appear

**Scenario 4: Multi-Device Sync**

- [ ] User on Device A creates companion variant
- [ ] Device B offline
- [ ] Enable Device B online
- [ ] Companion variant appears on Device B
- [ ] Both devices consistent

### Test Coverage Targets

- Unit tests: All business logic (≥85%)
- Integration tests: Data sync, offline queue, conflict resolution
- E2E tests: Critical journeys (onboarding, customize, multi-device)

---

stepsCompleted: [1, 2, 3, 4]
lastStep: 11
