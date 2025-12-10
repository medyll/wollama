import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
import path from 'path';
import fs from 'fs';
import { appSchema } from '../../shared/db/database-scheme.js';
import { DEFAULT_COMPANIONS } from '../../shared/configuration/data-default.js';
import type { DatabaseSchema } from '../../shared/db/schema-definition.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

// Register the find plugin for MongoDB-style queries
PouchDB.plugin(PouchFind);

// Ensure data directory exists
const DATA_DIR = config.database.dir;
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Configure PouchDB defaults
const MyPouchDB = PouchDB.defaults({
    prefix: DATA_DIR + path.sep
});

// Generic Database Manager
class DatabaseManager {
    private dbs: Record<string, PouchDB.Database> = {};
    private schema: DatabaseSchema;

    constructor(schema: DatabaseSchema) {
        this.schema = schema;
        this.initDatabases();
    }

    private initDatabases() {
        for (const tableName of Object.keys(this.schema)) {
            // Use the configured MyPouchDB
            this.dbs[tableName] = new MyPouchDB(tableName);
            this.initIndexes(tableName);
        }
    }

    private async initIndexes(tableName: string) {
        const tableDef = this.schema[tableName];
        if (tableDef.indexes) {
            try {
                await this.dbs[tableName].createIndex({
                    index: { fields: tableDef.indexes }
                });
                logger.success('DB', `Indexes initialized for ${tableName}`);
            } catch (err) {
                logger.error('DB', `Failed to create indexes for ${tableName}: ${err}`);
            }
        }
    }

    public getDb(tableName: string): PouchDB.Database {
        if (!this.dbs[tableName]) {
            throw new Error(`Database ${tableName} not found in schema`);
        }
        return this.dbs[tableName];
    }

    public getSchema(tableName: string) {
        return this.schema[tableName];
    }

    // Expose the constructor for express-pouchdb
    public getPouchDBConstructor() {
        return MyPouchDB;
    }

    public async seedCompanions() {
        const db = this.getDb('companions');
        logger.info('DB', 'Seeding companions...');
        
        for (const companion of DEFAULT_COMPANIONS) {
            try {
                const id = companion.companion_id!;
                try {
                    // Try to get existing doc to get _rev
                    const existing: any = await db.get(id);
                    // Update with new data, preserving _rev and _id
                    await db.put({
                        ...existing,
                        ...companion,
                        _id: id,
                        _rev: existing._rev,
                        updated_at: Date.now()
                    });
                    // logger.info('DB', `Updated companion: ${companion.name}`);
                } catch (err: any) {
                    if (err.status === 404) {
                        // Create new
                        await db.put({
                            ...companion,
                            _id: id,
                            created_at: Date.now(),
                            updated_at: Date.now()
                        });
                        logger.info('DB', `Created companion: ${companion.name}`);
                    } else {
                        throw err;
                    }
                }
            } catch (error) {
                logger.error('DB', `Failed to seed companion ${companion.name}: ${error}`);
            }
        }
        logger.success('DB', 'Companions seeding completed');
    }
}

export const dbManager = new DatabaseManager(appSchema);
