import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { appSchema } from '../../../shared/db/database-scheme';
import type { DatabaseSchema } from '../../../shared/db/schema-definition';

// Add plugins
addRxPlugin(RxDBLeaderElectionPlugin);
if (import.meta.env.DEV) {
    addRxPlugin(RxDBDevModePlugin);
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
                items: def.items ? {
                    type: def.items.type === 'uuid' || def.items.type === 'timestamp' || def.items.type === 'text-long' ? 'string' : def.items.type,
                    properties: def.items.properties
                } : { type: 'string' }
            };
        } else if (def.type === 'object') {
             properties[fieldName] = {
                type: 'object',
                properties: def.properties
            };
        } else {
            properties[fieldName] = {
                type: def.type === 'uuid' || def.type === 'timestamp' || def.type === 'text-long' ? 'string' : def.type
            };
            // Add maxLength for primary keys and indexed fields (required by RxDB)
            if (fieldName === tableDef.primaryKey || (tableDef.indexes && tableDef.indexes.includes(fieldName))) {
                properties[fieldName].maxLength = 100; // Reasonable default for UUIDs and short strings
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


let dbPromise: Promise<any> | null = null;

const _createDatabase = async () => {
    const db = await createRxDatabase({
        name: 'wollama_client_db_v7', // Bumped version to force fresh DB
        storage: wrappedValidateAjvStorage({
            storage: getRxStorageDexie()
        }),
        multiInstance: true,
        eventReduce: true,
        ignoreDuplicate: true
    });

    // Create collections based on shared schema
    const collections: any = {};
    for (const [tableName, tableDef] of Object.entries(appSchema)) {
        collections[tableName] = {
            schema: convertSchema(tableName, tableDef)
        };
    }

    await db.addCollections(collections);

    return db;
};

// Store replication states to be able to cancel them
const replicationStates: any[] = [];

export const enableReplication = async (userId: string, token: string) => {
    const db = await getDatabase();
    const serverUrl = 'http://localhost:3000/_db/'; // Should come from userState.preferences.serverUrl

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

        replicationState.error$.subscribe(err => {
            console.error(`Replication error on ${tableName}:`, err);
        });

        replicationStates.push(replicationState);
    }
};

export const disableReplication = async () => {
    console.log('Stopping replication...');
    await Promise.all(replicationStates.map(state => state.cancel()));
    replicationStates.length = 0;
};

export const getDatabase = () => {
    if (!dbPromise) {
        dbPromise = _createDatabase();
    }
    return dbPromise;
};

export const destroyDatabase = async () => {
    await disableReplication();
    if (dbPromise) {
        const db = await dbPromise;
        await db.remove();
        dbPromise = null;
        console.log('Database destroyed');
    }
};
