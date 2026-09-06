import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { appSchema } from '../../../shared/db/database-scheme';
import { userState } from '$lib/state/user.svelte';

// Add plugins
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
if (import.meta.env.DEV) {
	addRxPlugin(RxDBDevModePlugin);
	disableWarnings();
}

/**
 * Collections the browser database actually holds.
 *
 * RxDB's open-source build refuses to create more than 16 collections in one
 * database (error COL23), and the shared schema now defines 18. Exceeding it
 * rejects the whole `addCollections()` call, so every read — chats, companions,
 * messages — fails, not just the extra tables.
 *
 * The tables left out (`documents`, `document_chunks`, `tool_calls`, `runs`,
 * `run_events`, `mcp_grants`) are server-owned: the client reaches them over REST
 * (`/api/rag`, `/api/runs`, `/api/permissions`) and never queries them locally.
 * Keep this list in sync when a client feature starts needing a new table — and
 * keep it under 16.
 */
export const CLIENT_COLLECTIONS = [
	'users',
	'user_preferences',
	'companions',
	'user_companions',
	'chats',
	'messages',
	'user_prompts',
	'languages',
	'tags',
	'skills',
	'agents',
	'hooks'
] as const;

// Convert our shared schema to RxDB schema format
const convertSchema = (tableName: string, tableDef: any) => {
	const properties: any = {};
	const required: string[] = [];

	for (const [fieldName, fieldDef] of Object.entries(tableDef.fields)) {
		const def = fieldDef as any;

		if (def.type === 'array') {
			properties[fieldName] = {
				type: 'array',
				items: def.items
					? {
							type:
								def.items.type === 'uuid' || def.items.type === 'text-long'
									? 'string'
									: def.items.type === 'timestamp'
										? 'number'
										: def.items.type,
							properties: def.items.properties
						}
					: { type: 'string' }
			};
		} else if (def.type === 'object') {
			properties[fieldName] = {
				type: 'object',
				properties: def.properties
			};
		} else {
			const isTimestamp = def.type === 'timestamp';
			properties[fieldName] = {
				type: def.type === 'uuid' || def.type === 'text-long' ? 'string' : isTimestamp ? 'number' : def.type
			};

			if (isTimestamp) {
				properties[fieldName].minimum = 0;
				properties[fieldName].maximum = 1000000000000000; // Reasonable max for timestamp
				properties[fieldName].multipleOf = 1;
			}

			// Add constraints for primary keys and indexed fields (required by RxDB)
			if (fieldName === tableDef.primaryKey || (tableDef.indexes && tableDef.indexes.includes(fieldName))) {
				if (properties[fieldName].type === 'string') {
					properties[fieldName].maxLength = 100;
				} else if (properties[fieldName].type === 'number' || properties[fieldName].type === 'integer') {
					if (properties[fieldName].multipleOf === undefined) properties[fieldName].multipleOf = 1;
					if (properties[fieldName].minimum === undefined) properties[fieldName].minimum = 0;
					if (properties[fieldName].maximum === undefined) properties[fieldName].maximum = 1000000;
				}
			}
		}

		if (def.required) {
			required.push(fieldName);
		} else {
			// Fix for Dexie: Indexed fields MUST be required (not null/undefined)
			// If a field is indexed but optional in our schema, we must make it required in RxDB
			// and handle the default value (e.g. empty string) in the application logic.
			if (tableDef.indexes && tableDef.indexes.includes(fieldName)) {
				required.push(fieldName);
			}
		}
	}

	const schema = {
		title: tableName,
		version: 0,
		primaryKey: tableDef.primaryKey,
		type: 'object',
		properties,
		required,
		indexes: tableDef.indexes ? [...tableDef.indexes] : []
	};

	// Optimization: Add compound index for chats to allow sorting by updated_at while filtering by user_id
	if (tableName === 'chats') {
		schema.indexes.push(['user_id', 'updated_at']);
	}

	return schema;
};

// HMR helper: Store the promise on the global object to prevent multiple DB instances during hot reload
// don't forget to update the version number in createRxDatabase() when changing the schema
const globalAny: any = typeof window !== 'undefined' ? window : global;
let dbPromise: Promise<any> | null = globalAny.__wollama_db_promise || null;

const _createDatabase = async () => {
	const db = await createRxDatabase({
		name: 'wollama_client_db_v19',
		storage: wrappedValidateAjvStorage({
			storage: getRxStorageDexie()
		}),
		multiInstance: true,
		eventReduce: true
	});

	// Create collections based on shared schema, restricted to the client-side set
	const collectionsToAdd: any = {};
	for (const tableName of CLIENT_COLLECTIONS) {
		const tableDef = (appSchema as any)[tableName];
		if (!tableDef) continue;

		// Only add collection if it doesn't exist
		if (!db.collections[tableName]) {
			collectionsToAdd[tableName] = {
				schema: convertSchema(tableName, tableDef)
			};
		}
	}

	if (Object.keys(collectionsToAdd).length > 0) {
		await db.addCollections(collectionsToAdd);
	}

	return db;
};

// Store replication states to be able to cancel them
const replicationStates: any[] = [];

export const enableReplication = async (userId: string, _token?: string) => {
	const db = await getDatabase();
	const baseUrl = userState.preferences.serverUrl || 'http://localhost:3000';
	const serverUrl = baseUrl.endsWith('/') ? `${baseUrl}_db/` : `${baseUrl}/_db/`;

	// Cancel existing replications if any
	await disableReplication();

	console.log(`Starting replication for user ${userId}...`);

	/**
	 * CouchDB (and express-pouchdb) only create a database on PUT. Without this the
	 * very first sync for a user 404s on every request, because nothing else ever
	 * creates `user_<uid>_<table>` on the server.
	 */
	const ensureRemoteDatabase = async (url: string) => {
		try {
			// Creation is addressed without a trailing slash (CouchDB's `PUT /dbname`);
			// replication then uses the slash-terminated form. Bounded so a server that
			// stops answering cannot hold up app start.
			const res = await fetch(url, { method: 'PUT', signal: AbortSignal.timeout(5000) });
			// 201 created, 412 already exists — both fine.
			if (!res.ok && res.status !== 412) {
				console.warn(`Could not provision ${url}: ${res.status}`);
			}
		} catch (err) {
			console.warn(`Could not provision ${url}:`, err);
		}
	};

	// Provision every remote database up front, in parallel: doing it one collection
	// at a time serialises a dozen round trips in front of the first sync.
	await Promise.all(CLIENT_COLLECTIONS.map((tableName) => ensureRemoteDatabase(`${serverUrl}user_${userId}_${tableName}`)));

	for (const tableName of CLIENT_COLLECTIONS) {
		// Strategy: Per-User Database on Server
		// The server DB name will be: user_{userId}_{tableName}
		// e.g. user_abc123_chats
		const remoteName = `user_${userId}_${tableName}`;

		const replicationState = replicateCouchDB({
			replicationIdentifier: `sync-${userId}-${tableName}`,
			collection: db.collections[tableName],
			// replicateCouchDB() rejects a database URL without a trailing slash
			// (RC_COUCHDB_1), which silently disabled sync for every collection.
			url: `${serverUrl}${remoteName}/`,
			live: true,
			// Story 4.3: Add conflict resolution strategy
			pull: {
				// Add Auth headers here if needed
				// headers: { Authorization: `Bearer ${token}` }
			},
			push: {
				// headers: { Authorization: `Bearer ${token}` }
			}
		});

		replicationState.error$.subscribe((err) => {
			console.error(`Replication error on ${tableName}:`, err);
		});

		replicationStates.push(replicationState);
	}
};

export const disableReplication = async () => {
	console.log('Stopping replication...');
	await Promise.all(replicationStates.map((state) => state.cancel()));
	replicationStates.length = 0;
};

export const getDatabase = () => {
	if (!dbPromise) {
		dbPromise = _createDatabase();
		globalAny.__wollama_db_promise = dbPromise;
	}
	return dbPromise;
};

export const destroyDatabase = async () => {
	await disableReplication();
	if (dbPromise) {
		const db = await dbPromise;
		await db.remove();
		dbPromise = null;
		globalAny.__wollama_db_promise = null;
		console.log('Database destroyed');
	}
};
