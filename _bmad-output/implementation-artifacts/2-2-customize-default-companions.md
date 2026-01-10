# Story 2.2: Create User-Owned Companion by Customizing a Default

## Story Summary

**As a** user
**I want to** customize a default companion (e.g., change system prompt or model)
**So that** I can have a personalized version that reflects my preferences

---

## Acceptance Criteria

| AC# | Criterion                                                                     | Notes                                             |
| --- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | When viewing a system default companion, a "Customize" button is available    | Click initiates customization flow                |
| 2   | Clicking "Customize" creates a new user-owned companion (copy of the default) | Fork operation; original unchanged                |
| 3   | New companion is marked as "Personal" or with ownership indicator             | Visual distinction from system companions         |
| 4   | User is taken to an edit screen for the new companion                         | Can modify system_prompt, model, voice_id, avatar |
| 5   | Original default companion remains unchanged                                  | Fork does not mutate system companion             |
| 6   | New personal companion is saved to local database (user_companions table)     | Persists across sessions                          |
| 7   | Edit form has proper validation and error handling                            | Required fields, format validation                |

---

## Technical Implementation Plan

### 1. **UI Components**

#### CompanionSelector Enhancement

**File:** `client/src/components/CompanionSelector.svelte`

**Changes:**

- Add "Customize" button to each system companion card
- Style button distinctly (secondary color)
- Callback: `onCustomize: (companion: Companion) => void`
- Can have both `onSelect` and `onCustomize` callbacks

**Example:**

```svelte
<button class="btn btn-secondary btn-sm" onclick={() => onCustomize(companion)}> Customize </button>
```

#### CompanionEditor Component (NEW)

**Create:** `client/src/components/CompanionEditor.svelte`

**Props:**

- `companion: UserCompanion | null` — Null for new, existing object for edit
- `onSave: (companion: UserCompanion) => void` — Called after successful save
- `onCancel: () => void` — Cancel editing

**Fields:**

- Name (text input, required)
- Description (textarea)
- System Prompt (textarea, long, required)
- Model (dropdown/select, required)
    - Fetch available models from Ollama server
    - Or hardcoded list of common models
- Voice ID (text/select, optional)
- Voice Tone (select: neutral, fast, slow, deep, high)
- Mood (select: neutral, happy, sad, angry, sarcastic, professional, friendly, sexy)
- Avatar (file upload, optional)
- Specialization (text)

**Features:**

- **Validation:**
    - Name: required, min 3 chars, max 50 chars
    - System Prompt: required, min 10 chars
    - Model: required, validate against available models
- **Error Handling:**
    - Display validation errors near fields
    - Show save errors (network, database)
    - Retry option on failure
- **Draft Saving:** Optional auto-save to local storage
- **Cancel Confirmation:** Warn if unsaved changes

#### CompanionEditorModal (Optional)

**Alternative:** Modal/overlay version of CompanionEditor

- Use for in-flow editing (e.g., during onboarding)
- Prevents navigation away

### 2. **Routing & Flow**

**Option A: Separate Route (Recommended)**

```
/companions/customize/:companionId
  - Shows CompanionEditor for new user companion
  - Pre-populated with system companion data
  - Save → Redirect to /companions
```

**Option B: Modal In-Place**

```
/companions
  - Show list of companions
  - Click "Customize" → Open modal with CompanionEditor
  - Save → Update list in place, close modal
```

**Recommendation:** Option A for clarity and deep-linkability

### 3. **Service Layer Updates**

**File:** `client/src/lib/services/companion.service.ts`

**New/Enhanced Methods:**

```typescript
// Already exists:
async fork(systemCompanionId: string, userId: string): Promise<UserCompanion>

// Already exists:
async update(companion: UserCompanion): Promise<UserCompanion>

// New: Create user companion from scratch
async createUserCompanion(
  userId: string,
  data: Omit<UserCompanion, 'user_companion_id' | 'created_at' | 'updated_at'>
): Promise<UserCompanion>
```

**Implementation Detail:**

- `fork()` copies all fields from system companion
- New companion has unique `user_companion_id`
- Set `companion_id` to reference original (for tracking origin)
- Mark `is_locked: false` (user-editable)

### 4. **Onboarding Integration**

**Current State:**

- Step 2: Companion Selector with click-to-select

**Enhancement Options:**

**Option A: Add "Edit" flow after selection**

```
Step 2: Select Companion
  ↓ (Click companion → shows details with "Customize" button)
Step 2a: Quick Customize (optional modal)
  ↓
Complete
```

**Option B: Keep onboarding simple, customize after**

```
Step 2: Select Companion (no customize)
  ↓
Complete → Navigate to /chat
  → (User can customize later via /companions page)
```

**Recommendation:** Option B for simpler onboarding flow

- Customize is optional, not required
- Separate companions management page for advanced users

### 5. **Database & Persistence**

**Schema:** `user_companions` table

- `user_companion_id`: UUID (PK)
- `user_id`: UUID (FK to users)
- `companion_id`: UUID (FK to system companion, if fork)
- `name`, `description`, `system_prompt`, `model`, etc.
- `is_locked`: false (user-editable)
- `created_at`, `updated_at`: timestamps

**Operations:**

- **Create:** Insert new row with `is_locked: false`
- **Update:** Modify existing user companion
- **Read:** Query by `user_companion_id` or `user_id`
- **Delete:** Remove user companion (system remains)

### 6. **Model Availability**

**Source Options:**

1. **Hardcoded list** (simple, fixed)

    ```typescript
    const AVAILABLE_MODELS = ['mistral:latest', 'codellama:latest', ...];
    ```

2. **Fetch from Ollama** (dynamic, requires server)

    ```typescript
    async function getAvailableModels(serverUrl: string): Promise<string[]> {
    	const res = await fetch(`${serverUrl}/api/tags`);
    	return res.json().models.map((m) => m.name);
    }
    ```

3. **Combined** (hardcoded + fetch as fallback)
    ```typescript
    try {
    	return await getAvailableModels(serverUrl);
    } catch {
    	return AVAILABLE_MODELS; // fallback
    }
    ```

**Recommendation:** Option 2 (fetch from server)

- Reflects actual available models
- Prevents validation errors on save

### 7. **Testing Strategy**

**Unit Tests:**

- `CompanionEditor.svelte.test.ts`
    - Form renders with all fields
    - Validation rules work (required, min/max length)
    - Save callback triggered with correct data
    - Cancel without saving
    - Error messages display

- `companionService.test.ts` (fork/update)
    - `fork()` creates user companion from system
    - Original system companion unchanged
    - User companion marked as `is_locked: false`
    - `update()` modifies existing user companion

**Integration Tests:**

- `+page-story-2-2.test.ts`
    - Navigate to customize from companion selector
    - Edit form and save
    - New companion appears in list
    - Original system companion unchanged
    - Redirect after save

**Manual Testing:**

- Customize a system companion
- Modify all editable fields
- Cancel and verify no save
- Save and verify appears in companion list
- Edit the created companion again
- Verify system companion badge unchanged

---

## Acceptance Checklist

- [ ] CompanionSelector shows "Customize" button on system companions
- [ ] Clicking "Customize" navigates to edit screen
- [ ] CompanionEditor component renders all editable fields
- [ ] Fork operation creates new user companion in database
- [ ] Original system companion remains unchanged
- [ ] New companion marked as "Personal" or owned
- [ ] Form validation works (required fields, formats)
- [ ] Save successful → Redirect to companion list
- [ ] Cancel without saving
- [ ] Error handling for save failures
- [ ] Unit tests for component and service passing
- [ ] Integration tests for full flow passing
- [ ] Models fetch from Ollama server or fallback to hardcoded
- [ ] New companion persists across sessions
- [ ] User companion shows in list alongside system companions

---

## Dependencies & Blockers

**Depends On:**

- Story 2.1 (Companion Selector display) ✅ COMPLETE

**Blocks:**

- Story 2.3 (Persist across updates)
- Story 2.4 (Display ownership)

**External Dependencies:**

- Ollama server for model list (optional, has fallback)
- RxDB/PouchDB for persistence (already configured)

---

## Estimated Effort

- **CompanionEditor Component:** 2-3 hours
- **Routing & Integration:** 1-2 hours
- **Service Layer (fork/update):** 1 hour (mostly exists)
- **Model Availability:** 1 hour
- **Testing:** 2-3 hours
- **Polish & Validation:** 1 hour
- **Total:** ~8-10 hours (Medium-Large story)

---

## Status

- [ ] Not Started
- [ ] In Progress
- [ ] Complete

---

## Notes

- Fork operation is non-destructive (system companion unchanged)
- User companions inherit all properties from system companion
- Can override `name` to make it personal (e.g., "My Coder")
- Edit form supports inline validation feedback
- Avatar upload may require file handling (consider base64 or URL)
- Models dropdown should show current + available options
- Consider dark mode for form fields (DaisyUI form classes)
