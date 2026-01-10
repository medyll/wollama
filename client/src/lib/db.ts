import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { appSchema } from '../../../shared/db/database-scheme';
import type { DatabaseSchema } from '../../../shared/db/schema-definition';
import { userState } from '$lib/state/user.svelte';

// Add plugins
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);
if (import.meta.env.DEV) {
	addRxPlugin(RxDBDevModePlugin);
	disableWarnings();
}

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

			// Add maxLength for primary keys and indexed fields (required by RxDB)
			if (fieldName === tableDef.primaryKey || (tableDef.indexes && tableDef.indexes.includes(fieldName))) {
				if (properties[fieldName].type === 'string') {
					properties[fieldName].maxLength = 100; // Reasonable default for UUIDs and short strings
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
		name: 'wollama_client_db_v14',
		storage: wrappedValidateAjvStorage({
			storage: getRxStorageDexie()
		}),
		multiInstance: true,
		eventReduce: true,
		ignoreDuplicate: true
	});

	// Create collections based on shared schema
	const collectionsToAdd: any = {};
	for (const [tableName, tableDef] of Object.entries(appSchema)) {
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

export const enableReplication = async (userId: string, token: string) => {
	const db = await getDatabase();
	const baseUrl = userState.preferences.serverUrl || 'http://localhost:3000';
	const serverUrl = baseUrl.endsWith('/') ? `${baseUrl}_db/` : `${baseUrl}/_db/`;

	// Cancel existing replications if any
	await disableReplication();

	console.log(`Starting replication for user ${userId}...`);

	for (const tableName of Object.keys(appSchema)) {
		// Strategy: Per-User Database on Server
		// The server DB name will be: user_{userId}_{tableName}
		// e.g. user_abc123_chats
		const remoteName = `user_${userId}_${tableName}`;

		const replicationState = replicateCouchDB({
			replicationIdentifier: `sync-${userId}-${tableName}`,
			collection: db.collections[tableName],
			url: serverUrl + remoteName,
			live: true,
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
