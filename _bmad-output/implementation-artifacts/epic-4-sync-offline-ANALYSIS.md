# Epic 4 Analysis: Data Sync & Offline Support

**Date:** 2026-01-10  
**Status:** ⚠️ PARTIAL IMPLEMENTATION - Architecture exists, integration incomplete

---

## Executive Summary

Epic 4 has **50-60% implementation**:

- ✅ **Architecture Complete:** RxDB client, PouchDB server, CouchDB replication protocol
- ✅ **Database Layer:** Offline-first storage (Dexie backend)
- ⚠️ **Sync Logic:** Implemented but NOT INTEGRATED into app lifecycle
- ❌ **Offline UI:** No indicators or offline-first UX
- ❌ **Error Handling:** Connection state tracking exists but not wired to sync

---

## Detailed Story Status

### Story 4.1: Queue Offline Changes and Sync on Reconnect

**Acceptance Criteria:** Changes saved locally when offline, synced on reconnect

#### ✅ What Works

**RxDB Dexie Storage:**

```typescript
// client/src/lib/db.ts - Lines 5-10
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

const db = await createRxDatabase({
	name: 'wollama_client_db_v14',
	storage: wrappedValidateAjvStorage({
		storage: getRxStorageDexie() // IndexedDB backend
	})
});
```

- Persists all data to IndexedDB (survives page refresh)
- RxDB handles offline queueing automatically
- All collections: chats, messages, companions, user_companions, etc.

**Replication Implementation:**

```typescript
// client/src/lib/db.ts - Lines 83-113
export const enableReplication = async (userId: string, token: string) => {
	const db = await getDatabase();
	const serverUrl = userState.preferences.serverUrl || 'http://localhost:3000';

	for (const tableName of Object.keys(appSchema)) {
		const remoteName = `user_${userId}_${tableName}`;

		const replicationState = replicateCouchDB({
			replicationIdentifier: `sync-${userId}-${tableName}`,
			collection: db.collections[tableName],
			url: serverUrl + remoteName,
			live: true, // ✅ Continuous replication
			pull: {},
			push: {}
		});
	}
};
```

**Server PouchDB Setup:**

```typescript
// server/server.ts - Lines 45-54
app.use(
	'/_db',
	expressPouchDB(dbManager.getPouchDBConstructor(), {
		inMemoryConfig: config.pouchdb.inMemoryConfig,
		mode: config.pouchdb.mode
	})
);
```

- Exposes databases at `/_db/{dbname}` (CouchDB replication endpoint)
- Per-user databases: `user_{userId}_{tableName}`
- LevelDB adapter for persistence

#### ❌ What's Missing

**1. enableReplication() NOT called on app initialization**

```typescript
// client/src/routes/+layout.svelte - NO sync setup
onMount(async () => {
	await DataInitializer.initializeDefaults();
	if (!userState.preferences.onboarding_completed) {
		goto('/onboarding');
	}
	// ❌ enableReplication() never called!
});
```

**Issue:** Replication functions exist but are **orphaned** (exported but never used)

**2. No offline indicator UI**

```svelte
// +layout.svelte
{#if downloadState.isPulling}
	<!-- Shows model download progress -->
{/if}

<!-- ❌ No equivalent for sync status:
<ConnectionStatus syncing={replicationState.alive} />
-->
```

**3. No error handling for sync failures**

```typescript
// db.ts - Line 109-111
replicationState.error$.subscribe((err) => {
	console.error(`Replication error on ${tableName}:`, err);
	// ❌ No retry logic, no UI notification
});
```

---

### Story 4.2: Sync Changes Across Multiple Devices

**Acceptance Criteria:** Changes on one device appear on another (within 5s)

#### ✅ What Works

**Per-User Database Strategy:**

```
Client Device 1          Server              Client Device 2
    ↓                      ↓                      ↓
RxDB (chats)  ←→  user_{userId}_chats  ←→  RxDB (chats)
RxDB (messages)←→  user_{userId}_messages←→  RxDB (messages)
...                      ...                    ...

↑ Both clients replicate to same server DBs
↑ Changes bidirectional via CouchDB protocol
```

**Live Replication:**

```typescript
// db.ts - Line 101
live: true,  // ✅ Continuous sync, not one-shot
```

**Reactive UI Updates:**

```typescript
// ChatService - subscribes to RxDB reactive queries
getMessages(chatId) {
  return this.db.messages.find({
    selector: { chat_id: chatId }
  }).sort({ created_at: 'asc' });
  // ✅ Returns Observable that updates on sync
}
```

#### ⚠️ Partial / Untested

**Multi-device sync NOT validated:**

- ❌ No test with 2+ simultaneous clients
- ❌ Network partition simulation not tested
- ❌ Replication latency not measured
- ⚠️ Auth headers commented out (line 108):
    ```typescript
    pull: {
    	// headers: { Authorization: `Bearer ${token}` }  ❌ Auth not enforced
    }
    ```

---

### Story 4.3: Resolve Sync Conflicts (Last-Write-Wins)

**Acceptance Criteria:** Later timestamp wins, older version overwritten

#### ✅ What Works

**Conflict Resolution Built into CouchDB:**

```
CouchDB replication protocol includes automatic conflict resolution.
Default: Last-Write-Wins (latest _rev wins)
```

**Timestamp Tracking:**

```typescript
// All documents have updated_at
{
  chat_id: "uuid",
  updated_at: 1704864600000,  // ✅ Unix timestamp
  message: "..."
}

// Companions have timestamps:
{
  companion_id: "1",
  updated_at: Date.now(),  // ✅ Updated on edit
  system_prompt: "..."
}
```

#### ❌ What's Missing

**1. No conflict UI/notification**

```svelte
<!-- ❌ No conflict indicator:
{#if hasConflict}
  <div class="alert alert-warning">
    Conflict detected: Latest version applied
  </div>
{/if}
-->
```

**2. No conflict resolution tests**

- No unit tests for LWW behavior
- No integration tests for simultaneous edits

**3. \_rev tracking not exposed**

```typescript
// RxDB handles _rev internally, but:
// - No visibility into conflict history
// - No "show conflict" feature
// - No merge strategy options
```

---

### Story 4.4: Handle Server Disconnection Gracefully

**Acceptance Criteria:** Clear error when server unavailable, retry when reconnected

#### ✅ What Works

**Connection State Tracking:**

```typescript
// client/src/lib/state/connection.svelte.ts
export class ConnectionState {
	isConnected = $state(true);
	isOllamaConnected = $state(false);
	setConnected(status: boolean) {
		this.isConnected = status;
	}
	setOllamaConnected(status: boolean) {
		this.isOllamaConnected = status;
	}
}
```

**Error Monitoring:**

```typescript
// db.ts - Line 109-111
replicationState.error$.subscribe((err) => {
	console.error(`Replication error on ${tableName}:`, err);
});
```

**UI Connection Status:**

```svelte
<!-- +layout.svelte - Connection indicator -->
<button class="btn btn-ghost btn-circle" onclick={() => connectionState.toggleModal()}>
	<Icon icon="lucide:dot" class={connectionState.isConnected ? 'text-success' : 'text-error'} />
</button>
```

#### ❌ What's Missing

**1. No connection integration with sync**

```typescript
// ❌ Current flow:
connectionState.setConnected(false); // Red dot
// But replication keeps trying silently

// ✅ Should:
if (!connectionState.isConnected) {
	await disableReplication(); // Stop retrying
}
if (connectionState.isConnected) {
	await enableReplication(); // Resume sync
}
```

**2. No offline-first message queueing**

```typescript
// ChatService.generateResponse() - Line 212
const response = await fetch(`${serverUrl}/api/chat/generate`, {
	// ❌ If offline, this throws error
	// ❌ Message not queued
	// Should queue and retry
});
```

**3. No retry strategy**

- No exponential backoff
- No max retry count
- No user notification

---

## Architecture Overview

### Current Implementation

```
┌─────────────────────────────────────────────────┐
│ CLIENT (Svelte)                                 │
│                                                 │
│ OnMount                                         │
│   ├─ DataInitializer.initializeDefaults()      │
│   ├─ Check onboarding_completed                │
│   └─ ❌ enableReplication() NOT CALLED         │
│                                                 │
│ Services                                        │
│   ├─ ChatService (uses RxDB reactivity)        │
│   ├─ CompanionService (offline-capable)        │
│   └─ ❌ No sync status tracking                │
│                                                 │
│ Storage                                         │
│   └─ RxDB Dexie (IndexedDB)                    │
│       ├─ chats (persisted ✅)                 │
│       ├─ messages (persisted ✅)              │
│       └─ All collections (persisted ✅)       │
│                                                 │
│ Connection State (unused)                       │
│   ├─ isConnected: boolean                      │
│   ├─ isOllamaConnected: boolean                │
│   └─ ❌ Not wired to replication               │
│                                                 │
└─────────────────────────────────────────────────┘
         ↓ enableReplication() ❌ MISSING ↓
┌─────────────────────────────────────────────────┐
│ NETWORK (HTTP)                                  │
│                                                 │
│ CouchDB Replication Protocol                    │
│   (live: true, continuous sync)                 │
│                                                 │
└─────────────────────────────────────────────────┘
         ↓ /_db/{tableName} ↓
┌─────────────────────────────────────────────────┐
│ SERVER (Express + PouchDB)                      │
│                                                 │
│ PouchDB Server                                  │
│   ├─ user_{userId}_chats (LevelDB)            │
│   ├─ user_{userId}_messages                    │
│   ├─ user_{userId}_companions                  │
│   └─ ...all collections per user               │
│                                                 │
│ Seed Data                                       │
│   └─ DEFAULT_COMPANIONS → all users            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### What's Missing

1. **Sync Initialization:** `enableReplication()` not called in `+layout.svelte`
2. **Connection Monitoring:** No tie-in between `connectionState` and replication
3. **Offline UI:** No indicators, no feedback to user
4. **Error Recovery:** No retry logic, no conflict resolution UI
5. **Auth Headers:** Commented out (line 108-109)

---

## Quick Implementation Roadmap

### Phase 1: Enable Sync (30 min)

```typescript
// +layout.svelte onMount() - ADD THIS:
if (userState.uid) {
	await enableReplication(userState.uid, userState.token || '');
}
```

### Phase 2: Connection Integration (45 min)

```typescript
// state/connection.svelte.ts
export class ConnectionState {
	async setConnected(status: boolean) {
		this.isConnected = status;
		if (status) {
			await enableReplication(userState.uid, userState.token || '');
		} else {
			await disableReplication();
		}
	}
}
```

### Phase 3: Offline Indicators (30 min)

```svelte
<!-- UI Component: SyncStatus.svelte -->
{#if !connectionState.isConnected}
	<div class="alert alert-warning">Offline - Changes will sync when reconnected</div>
{:else if replicationState.syncing}
	<div class="alert alert-info">
		Syncing... <span class="loading loading-spinner"></span>
	</div>
{/if}
```

### Phase 4: Error Handling & Retry (1 hour)

```typescript
// chatService - wrap chat generation
async generateResponse() {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(`${serverUrl}/api/chat/generate`, ...);
    } catch (err) {
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }
}
```

---

## Gap Analysis: Stories vs Implementation

| Story | Feature               | Status | Gap                                    |
| ----- | --------------------- | ------ | -------------------------------------- |
| 4.1   | Queue offline changes | 90%    | Missing sync initialization            |
| 4.1   | Sync on reconnect     | 95%    | No connection tie-in                   |
| 4.1   | Offline indicator     | 0%     | No UI component                        |
| 4.2   | Multi-device sync     | 85%    | Not tested, auth headers commented     |
| 4.3   | Last-write-wins       | 100%   | Built into CouchDB, but no UI feedback |
| 4.4   | Server disconnection  | 50%    | Detection works, recovery missing      |
| 4.4   | Graceful UX           | 0%     | No error messages or retry logic       |

---

## Risks & Observations

### 🟡 Medium Risk: Sync Never Starts

**Issue:** `enableReplication()` not called on app init  
**Impact:** No data syncing even though infrastructure exists  
**Fix:** 1 line in `+layout.svelte` onMount

### 🟡 Medium Risk: Auth Not Enforced

**Issue:** CouchDB auth headers commented out (line 108-109)  
**Impact:** Any user could access other users' databases  
**Fix:** Uncomment and implement auth middleware on server

### 🟡 Medium Risk: No Offline-First UX

**Issue:** Users don't know when offline  
**Impact:** Confusion about sync status  
**Fix:** Add sync indicators and offline message queue

### 🟢 Low Risk: Multi-device Sync

**Issue:** Architecture sound but untested  
**Impact:** Works by design (CouchDB proven tech)  
**Fix:** Integration tests with 2+ simultaneous clients

---

## Recommendations

### To Complete Epic 4 (Timeline: 3-4 hours)

1. **CRITICAL (15 min):** Call `enableReplication()` in `+layout.svelte`
    - Add after DataInitializer
    - Wire to `userState.uid`

2. **HIGH (30 min):** Integrate connection state with sync
    - Monitor `isConnected` changes
    - Start/stop replication accordingly
    - Update connectionState to async

3. **HIGH (45 min):** Add sync status indicators
    - Create `SyncStatus.svelte` component
    - Show offline/syncing/synced states
    - Add to navbar

4. **MEDIUM (1 hour):** Implement error handling
    - Retry logic with exponential backoff
    - User-facing error messages
    - Offline message queue

5. **MEDIUM (45 min):** Add integration tests
    - Test offline → online transition
    - Test multi-device sync
    - Test conflict resolution

6. **LOW (30 min):** Enable auth headers
    - Uncomment auth in db.ts
    - Implement server middleware
    - Test per-user data isolation

### Priority: **Complete CRITICAL + HIGH items (45 min total)**

This enables all 4 stories and unblocks Epic 5 testing.

---

## Files to Modify

| File                                        | Changes                            | Priority    |
| ------------------------------------------- | ---------------------------------- | ----------- |
| `client/src/routes/+layout.svelte`          | Add enableReplication() call       | 🔴 CRITICAL |
| `client/src/lib/state/connection.svelte.ts` | Make setConnected async, wire sync | 🔴 HIGH     |
| `client/src/components/SyncStatus.svelte`   | NEW - Sync indicators              | 🟡 MEDIUM   |
| `client/src/lib/db.ts`                      | Uncomment auth headers             | 🟡 MEDIUM   |
| `server/middleware/auth.ts`                 | NEW - Per-user DB auth             | 🟡 MEDIUM   |
| `client/src/lib/services/chat.service.ts`   | Add retry logic                    | 🟡 MEDIUM   |
| `**/*.test.ts`                              | Add sync integration tests         | 🟢 LOW      |

---

## Conclusion

**Epic 4 Status: 50-60% Complete**

The **infrastructure is solid** (RxDB, PouchDB, CouchDB replication), but the **integration is incomplete**. Four simple changes unlock all functionality:

1. Enable sync on app init
2. Wire connection state to sync lifecycle
3. Add UI feedback
4. Implement error recovery

**Estimated effort to complete: 3-4 hours**

Once enabled, all 4 stories (4.1-4.4) will be functional and ready for Epic 5 testing.
