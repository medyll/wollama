# Story 2.3: Persist User Companions Across App Updates

Status: ready-for-dev

## Story

As a user,
I want my custom companions to survive app updates,
So that my personalization isn't lost.

## Acceptance Criteria

### AC1: User companions persist across app updates

**Given** I've created a personal companion called "MyAssistant"  
**When** a new app version is released and installed  
**Then** "MyAssistant" is still available in my companion list

### AC2: All customizations are retained

**Given** I've customized a companion with specific settings  
**When** the app is updated  
**Then** all customizations are retained (system_prompt, model, voice_id, voice_tone, mood, avatar, specialization)

### AC3: System default companions may be updated without affecting personal copies

**Given** I have forked a system companion into a personal companion  
**When** the app updates and the original system companion is modified  
**Then** my personal copy remains unchanged with my custom settings

## Context & Analysis

### Current Implementation State

From Story 2.2 (completed), the application already has:

1. **Dual Database Tables:**
    - `companions` - System-provided companions (immutable, is_locked: true)
    - `user_companions` - User-owned companions (editable, is_locked: false)

2. **Fork Mechanism:**
    - `companionService.fork(systemCompanionId, userId)` creates new UserCompanion
    - Copies all fields from system companion
    - Sets new `user_companion_id` and references original via `companion_id`

3. **Data Architecture (Offline-First):**
    - **Client:** RxDB (IndexedDB/Dexie) - `client/src/lib/db.ts`
    - **Server:** PouchDB (LevelDB) - `server/db/database.ts`
    - **Sync:** CouchDB Replication Protocol (bidirectional)

### Problem Analysis

The story requirement "persist across app updates" is **already satisfied by the current architecture**, but needs validation and documentation. Here's why:

1. **RxDB/PouchDB Persistence:**
    - RxDB stores data in IndexedDB (browser) or native storage (Electron/Capacitor)
    - Data survives app updates because browser storage is persistent
    - Desktop (Electron): Data stored in user's AppData directory
    - Mobile (Capacitor): Data stored in app's private storage

2. **System vs User Companions Separation:**
    - System companions in `companions` table are **replaced/updated** on app updates
    - User companions in `user_companions` table are **never touched** by updates
    - The `companion_id` reference preserves the relationship to original

3. **Schema Evolution Handling:**
    - RxDB migrations handle schema changes across versions
    - Existing data is migrated, not deleted

### What This Story Actually Requires

This story is **validation and testing-focused** rather than implementation-focused:

1. **Verify persistence mechanism works correctly**
2. **Test schema migration scenarios**
3. **Document the persistence guarantees**
4. **Create regression tests to prevent future breaks**

## Tasks / Subtasks

### Task 1: Verify Current Persistence Implementation (AC: #1, #2)

- [ ] 1.1: Audit RxDB schema definition in `client/src/lib/db.ts`
    - Verify `user_companions` collection configuration
    - Check migration strategy and version management
- [ ] 1.2: Review data initialization in `client/src/lib/services/data-initializer.ts`
    - Verify system companions initialization doesn't affect user_companions
    - Check `DEFAULT_COMPANIONS` loading logic
- [ ] 1.3: Test data persistence manually
    - Create a personal companion
    - Clear browser cache (Web) or reinstall app (Desktop/Mobile)
    - Verify companion still exists
- [ ] 1.4: Document persistence guarantees in code comments

### Task 2: Schema Migration Testing (AC: #2)

- [ ] 2.1: Create schema migration test scenarios
    - Add new field to user_companions schema
    - Modify existing field (e.g., change enum values)
    - Test data integrity after migration
- [ ] 2.2: Review `client/src/lib/db.ts` migration handling
    - Ensure version number is incremented on schema changes
    - Verify migration functions preserve existing data
- [ ] 2.3: Document schema evolution best practices

### Task 3: System Companion Update Isolation (AC: #3)

- [ ] 3.1: Verify fork mechanism preserves independence
    - Review `companionService.fork()` implementation
    - Confirm new `user_companion_id` is generated
    - Verify `companion_id` reference is maintained
- [ ] 3.2: Test system companion update scenario
    - Simulate updating `DEFAULT_COMPANIONS` in `shared/configuration/data-default.ts`
    - Verify user companions remain unchanged
    - Check that new system companion versions are available
- [ ] 3.3: Document the separation of concerns in architecture

### Task 4: Automated Testing (AC: All)

- [ ] 4.1: Create integration test for persistence
    - `client/src/routes/compagnons/+page-story-2-3.test.ts`
    - Test: Create user companion, simulate app restart, verify existence
- [ ] 4.2: Create unit tests for data-initializer
    - Verify system companions don't overwrite user companions
    - Test DEFAULT_COMPANIONS merge logic
- [ ] 4.3: Add E2E test for app update simulation
    - Use Vitest with browser mode
    - Simulate localStorage/IndexedDB persistence
    - Verify data survives "update" (page reload)

### Task 5: Documentation & Communication (AC: All)

- [ ] 5.1: Document persistence architecture in PROJECT.md
    - RxDB/PouchDB persistence guarantees
    - Schema migration strategy
    - Data separation: system vs user tables
- [ ] 5.2: Add JSDoc comments to persistence-critical code
    - `client/src/lib/db.ts`
    - `client/src/lib/services/data-initializer.ts`
    - `companionService.fork()` and `getAll()`
- [ ] 5.3: Create user-facing documentation
    - FAQ: "What happens to my companions when I update?"
    - Troubleshooting: Data recovery procedures

## Dev Notes

### Critical Implementation Details

#### RxDB Schema Version Management

**Location:** `client/src/lib/db.ts`

```typescript
const schema = {
	title: tableName,
	version: 0, // ← INCREMENT THIS ON SCHEMA CHANGES
	type: 'object',
	properties: properties,
	required: required
	// ...
};
```

**CRITICAL:** When modifying `shared/db/database-scheme.ts`, you MUST:

1. Increment schema version in `client/src/lib/db.ts`
2. Add migration function if needed
3. Test migration with existing data

#### Data Initialization Logic

**Location:** `client/src/lib/services/data-initializer.ts`

```typescript
await this.initializeData<Companion>('companions', DEFAULT_COMPANIONS, true);
// Third parameter `true` = MERGE mode (don't delete existing user data)
```

**How it works:**

- Loads system companions from `shared/configuration/data-default.ts`
- Inserts/updates `companions` table (system companions only)
- Does NOT touch `user_companions` table
- User companions persist independently

#### Fork Mechanism Guarantees

**Location:** `client/src/lib/services/companion.service.ts`

```typescript
async fork(systemCompanionId: string, userId: string): Promise<UserCompanion> {
  const systemCompanion = await this.systemService.get(systemCompanionId);
  const newCompanion: UserCompanion = {
    user_companion_id: crypto.randomUUID(), // NEW ID
    user_id: userId,
    companion_id: systemCompanionId, // Reference to original
    // ... copy all fields ...
    is_locked: false // User-editable
  };
  return await this.userService.create(newCompanion);
}
```

**Why this guarantees persistence:**

- New `user_companion_id` makes it a separate entity
- Stored in `user_companions` table (not modified by app updates)
- `companion_id` reference is informational only (not a foreign key constraint)

### Architecture Compliance

#### Data Model (from PROJECT.md)

**Relevant Schema:**

```typescript
// shared/db/database-scheme.ts
companions: {
  primaryKey: 'companion_id',
  fields: {
    companion_id: { type: 'uuid', required: true },
    name: { type: 'string', required: true },
    // ... other fields ...
    is_locked: { type: 'boolean' } // true = system, false = user
  }
}

user_companions: {
  primaryKey: 'user_companion_id',
  fk: {
    user_id: { table: 'users', required: true },
    companion_id: { table: 'companions', required: false } // Optional reference
  },
  fields: {
    user_companion_id: { type: 'uuid', required: true },
    user_id: { type: 'uuid', required: true },
    companion_id: { type: 'uuid' }, // References original if forked
    // ... same fields as companions ...
    is_locked: { type: 'boolean' } // Always false for user companions
  }
}
```

**Key Architectural Decisions:**

1. **Dual Tables:** System data in `companions`, user data in `user_companions`
2. **Optional FK:** `companion_id` in `user_companions` is optional (allows standalone companions)
3. **Immutability:** System companions (`is_locked: true`) never modified by users
4. **Persistence:** User data survives updates because it's in a separate table

### Testing Requirements

#### Test Coverage Goals

- **Unit Tests:** Data initialization, fork mechanism
- **Integration Tests:** RxDB persistence, schema migration
- **E2E Tests:** Full user flow (create, update app, verify existence)

#### Test Files to Create/Modify

1. **`client/src/routes/compagnons/+page-story-2-3.test.ts`**
    - Test companion persistence across app restarts
    - Mock localStorage/IndexedDB

2. **`client/src/lib/services/data-initializer.test.ts`**
    - Test system companion initialization
    - Verify user companions not affected

3. **`client/src/lib/services/companion.service.test.ts`**
    - Test fork creates independent copy
    - Test getAll() merges system and user companions

### File Structure Notes

**Files to Review/Modify:**

```
client/src/
├── lib/
│   ├── db.ts                          (Review: Schema versioning, migrations)
│   └── services/
│       ├── data-initializer.ts         (Review: Merge logic, user data protection)
│       └── companion.service.ts        (Review: Fork independence)
├── routes/
│   └── compagnons/
│       ├── +page.svelte                (Test: User companions display)
│       └── +page-story-2-3.test.ts     (Create: Persistence tests)
shared/
├── db/
│   └── database-scheme.ts              (Review: Schema definitions)
└── configuration/
    └── data-default.ts                 (Review: System companion updates)
```

### Svelte 5 Runes Reminders

- Use `$state()` for reactive variables
- Use `$derived()` for computed values
- Use `$effect()` for side effects (e.g., loading data on mount)
- NO `export let` or `createEventDispatcher`

### DaisyUI Components

- Use existing badge system: `<div class="badge badge-secondary">Personal</div>`
- Maintain consistent theming (light/dark/custom via `data-theme`)

### References

- [RxDB Schema Documentation](https://rxdb.info/rx-schema.html)
- [RxDB Migration Guide](https://rxdb.info/migration-schema.html)
- [Source: PROJECT.md - Data Model Section](PROJECT.md#4-data-model-simplified-schema)
- [Source: shared/db/database-scheme.ts](shared/db/database-scheme.ts)
- [Source: client/src/lib/db.ts](client/src/lib/db.ts)
- [Source: Story 2.2 Completion Report](2-2-customize-default-companions-COMPLETE.md)

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
