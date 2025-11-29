import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { appSchema } from '../../../shared/db/database-scheme';
import type { DatabaseSchema } from '../../../shared/db/schema-definition';

// Add plugins
addRxPlugin(RxDBLeaderElectionPlugin);

// Convert our shared schema to RxDB schema format
// Note: This is a simplified conversion. You might need a more robust converter.
const convertSchema = (tableName: string, tableDef: any) => {
    const properties: any = {};
    const required: string[] = [];

    for (const [fieldName, fieldDef] of Object.entries(tableDef.fields)) {
        const def = fieldDef as any;
        properties[fieldName] = {
            type: def.type === 'uuid' || def.type === 'timestamp' || def.type === 'text-long' ? 'string' : def.type
        };
        if (def.required) {
            required.push(fieldName);
        }
    }

    return {
        title: tableName,
        version: 0,
        primaryKey: tableDef.primaryKey,
        type: 'object',
        properties,
        required
    };
};

let dbPromise: Promise<any> | null = null;

const _createDatabase = async () => {
    const db = await createRxDatabase({
        name: 'wollama_client_db',
        storage: getRxStorageDexie(),
        multiInstance: true,
        eventReduce: true
    });

    // Create collections based on shared schema
    const collections: any = {};
    for (const [tableName, tableDef] of Object.entries(appSchema)) {
        collections[tableName] = {
            schema: convertSchema(tableName, tableDef)
        };
    }

    await db.addCollections(collections);

    // Setup replication for each collection
    // We assume the server is running on localhost:3000 (or configured URL)
    const serverUrl = 'http://localhost:3000/_db/';

    for (const tableName of Object.keys(appSchema)) {
        replicateCouchDB({
            replicationIdentifier: 'sync-' + tableName,
            collection: db.collections[tableName],
            url: serverUrl + tableName,
            live: true,
            pull: {},
            push: {}
        });
    }

    return db;
};

export const getDatabase = () => {
    if (!dbPromise) {
        dbPromise = _createDatabase();
    }
    return dbPromise;
};
