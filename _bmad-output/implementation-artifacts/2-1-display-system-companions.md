# Story 2.1: Display System-Provided Default Companions

## Story Summary

**As a** new user (after completing onboarding)
**I want to** see a list of default companions (e.g., "Assistant", "Coder", "Creative")
**So that** I can choose one without having to configure anything

---

## Acceptance Criteria

| AC# | Criterion                                                                       | Notes                                              |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | After onboarding is complete, a "Companion Selector" is displayed               | May be on same page as chat or separate route      |
| 2   | All system-provided companions from the `companions` table are listed           | Read from database; likely seeded on first run     |
| 3   | Each companion card shows: name, description, model, specialization             | Clear, readable layout                             |
| 4   | Each companion has a "Default" badge or icon to indicate system-provided status | Visual distinction                                 |
| 5   | System companions are read-only (no "Edit" button visible)                      | Clicking companion should select it, not edit      |
| 6   | Companion cards are selectable/clickable                                        | Selecting one initiates new chat (Story 3.1 scope) |
| 7   | All companions are accessible via keyboard and screen readers                   | WCAG 2.1 AA                                        |

---

## Technical Implementation Plan

### 1. **Database & Seeding**

**Current State:**

- `companions` table exists with fields: `name`, `description`, `model`, `voice_id`, `avatar`, `specialization`, `is_locked`
- No seeding logic exists yet

**Work:**

- [ ] Create default companions seed data (3-5 examples: "Assistant", "Coder", "Creative", etc.)
- [ ] Add seed function to `server/db/database.ts` that:
    - Checks if `companions` table is empty
    - Inserts default companions on first server boot
    - Marks as `is_locked: true` (prevents system companions from being edited)

**Seed Data Example:**

```json
{
	"name": "Assistant",
	"description": "A helpful, general-purpose AI assistant",
	"system_prompt": "You are a helpful AI assistant...",
	"model": "mistral:latest",
	"voice_id": "en-US-standard-A",
	"specialization": "general",
	"is_locked": true
}
```

### 2. **Frontend: Companion Service**

**Create:** `client/src/lib/services/companion.service.ts`

**Functions:**

- `getSystemCompanions()`: Fetch all companions with `is_locked: true`
- `getUserCompanions()`: Fetch user_companions for current user (Story 2.2 scope)
- `getAllCompanions()`: Return combined list (user + system) with ownership info

**Example:**

```typescript
export async function getSystemCompanions(): Promise<Companion[]> {
	const db = getDB();
	return db.chats.query().where('is_locked').eq(true).exec();
}
```

### 3. **Frontend: Companion Selector Component**

**Create:** `client/src/components/CompanionSelector.svelte`

**Props:**

- `onSelect: (companion: Companion) => void` — Callback when companion is chosen

**Features:**

- Grid or card layout displaying all system companions
- Each card shows:
    - Avatar (if available, else placeholder)
    - Name
    - Description
    - Model
    - "Default" badge
    - Specialization tag
- Hovering/selecting companion highlights it
- Click to select companion (calls `onSelect`)
- No "Edit" button on system companions

**Accessibility:**

- `role="region" aria-label="Companion Selector"`
- Keyboard arrow navigation between cards
- Enter/Space to select
- Screen reader announces companion details

### 4. **Frontend: Routing**

**Option A (Current Design):** After onboarding completes, show companion selector before showing chat

- Modify `+layout.svelte` or create `routes/chat/+layout.svelte`
- Check if user has an active chat; if not, show companion selector
- On companion selection, create new chat (Story 3.1)

**Option B:** Companion selector as modal/sidebar in chat interface

- More integrated; users see chat UI but must pick companion first

**Recommendation:** Option A for clarity (separate flow before entering chat)

### 5. **Frontend: Chat Initialization Flow**

**Current:**

- Onboarding completes → User is logged in → Chat interface loads

**New:**

- Onboarding completes → Companion selector appears → User selects companion → New chat created → Chat UI loads with selected companion

**Files to Update:**

- `routes/chat/+layout.svelte` (or new `routes/companion-selector/+page.svelte`)
- `routes/chat/+page.svelte`

### 6. **Testing Strategy**

**Unit Tests:**

- [ ] `companion.service.test.ts`:
    - `getSystemCompanions()` returns locked companions
    - Returns empty array if no system companions exist
    - Handles database errors

- [ ] `CompanionSelector.svelte.test.ts`:
    - Renders all companions passed via props
    - Displays "Default" badge on each companion
    - No "Edit" button visible
    - Clicking companion calls `onSelect` callback
    - Keyboard navigation works (arrow keys, Enter)
    - Screen reader announces companion details

**Integration Tests:**

- [ ] After onboarding completion, companion selector is displayed
- [ ] Selecting a companion initiates new chat creation flow
- [ ] System companions remain read-only

**Manual Testing:**

- Verify all default companions display correctly
- Test on mobile (touch selection)
- Keyboard-only navigation
- Screen reader output

---

## Acceptance Checklist

- [ ] Seed data created with 3-5 default companions
- [ ] `companion.service.ts` fetches system companions
- [ ] `CompanionSelector.svelte` displays companions with badges
- [ ] Routing flow: Onboarding → Companion Selector → Chat
- [ ] Companion selection callback works
- [ ] Unit tests for service and component passing
- [ ] Integration test for full flow passing
- [ ] Accessibility verified (keyboard, ARIA, screen reader)
- [ ] Mobile layout responsive and touch-friendly

---

## Dependencies & Blockers

**Depends On:**

- Story 1.4 (Persist Server Configuration) ✅ COMPLETE
- Database initialization flow

**Blocks:**

- Story 2.2 (Customize companions)
- Story 3.1 (Create new chat)

**No External Blockers**

---

## Estimated Effort

- **Database/Seeding:** 1-2 hours
- **Service Layer:** 1 hour
- **Component Development:** 2-3 hours
- **Integration & Testing:** 2 hours
- **Total:** ~6-8 hours (Medium story)

---

## Status

- [ ] Not Started
- [ ] In Progress
- [ ] Complete

---

## Notes

- System companions marked as `is_locked: true` to prevent accidental deletion/editing
- Seeding should be idempotent (safe to re-run without duplicating companions)
- Consider lazy-loading companion avatars if image assets are large
- Future enhancement: Allow admin to update default companions without losing user customizations
