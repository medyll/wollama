/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDatabase } from '../db';
import { appSchema } from '../../../../shared/db/database-scheme';
import type { RxCollection } from 'rxdb';
import { AbstractGenericService } from '../../../../shared/services/abstract-generic.service';

export class DataGenericService<T> extends AbstractGenericService<T> {
    private tableDef: any;
    private cardLines: string[];

    constructor(collectionName: string) {
        const schema = appSchema[collectionName as keyof typeof appSchema];
        if (!schema) {
            throw new Error(`Schema not found for table ${collectionName}`);
        }
        super(collectionName, schema.primaryKey);
        this.tableDef = schema;
        this.cardLines = this.tableDef?.template?.card_lines || [];
    }

    get PrimaryKey(): string {
        return this.primaryKey;
    }

    private async getCollection(): Promise<RxCollection> {
        const db = await getDatabase();
        return db[this.tableName];
    }

    async resolveRelations(data: any, db: any) {
        const resolvedLines: Record<string, any> = {};
        
        for (const line of this.cardLines) {
            if (line.includes('.')) {
                const [foreignKey, field] = line.split('.');
                // Check if it's a relation
                if (this.tableDef.fk && this.tableDef.fk[foreignKey]) {
                    const relatedTable = this.tableDef.fk[foreignKey].table;
                    const relatedId = data[foreignKey];
                    if (relatedId) {
                        try {
                            const relatedDoc = await db[relatedTable].findOne(relatedId).exec();
                            if (relatedDoc) {
                                resolvedLines[line] = relatedDoc[field];
                            }
                        } catch (e) {
                            console.warn(`Failed to resolve relation ${line}`, e);
                        }
                    }
                }
            } else {
                resolvedLines[line] = data[line];
            }
        }
        return resolvedLines;
    }

    async processDocs(docs: any[]) {
        const db = await getDatabase();
        return Promise.all(docs.map(async (doc) => {
            const data = doc.toJSON();
            const resolvedLines = await this.resolveRelations(data, db);
            return {
                ...data,
                _resolved: resolvedLines
            };
        }));
    }

    async getAll(orderBy?: string, orderDirection: 'asc' | 'desc' = 'desc'): Promise<T[]> {
        const collection = await this.getCollection();
        let query = collection.find();
        
        if (orderBy && this.tableDef.fields[orderBy]) {
            query = query.sort({ [orderBy]: orderDirection });
        }
        
        const docs = await query.exec();
        return this.processDocs(docs) as unknown as T[];
    }

    async get(id: string): Promise<T | null> {
        const collection = await this.getCollection();
        const doc = await collection.findOne(id).exec();
        
        if (doc) {
            const db = await getDatabase();
            const docData = doc.toJSON();
            const resolvedLines = await this.resolveRelations(docData, db);
            return {
                ...docData,
                _resolved: resolvedLines
            } as unknown as T;
        }
        return null;
    }

    private cleanData(data: any): any {
        const cleaned = { ...data };
        delete cleaned._resolved;
        delete cleaned._rev;
        delete cleaned._attachments;
        delete cleaned._meta;
        delete cleaned._deleted;
        return cleaned;
    }

    async create(item: T): Promise<T> {
        const collection = await this.getCollection();
        const data = this.cleanData(item);
        const doc = await collection.insert(data);
        return doc.toJSON() as T;
    }

    async update(item: T): Promise<T> {
        const collection = await this.getCollection();
        const id = (item as any)[this.primaryKey];
        
        if (!id) {
             throw new Error(`Primary key ${this.primaryKey} missing in update item`);
        }

        const doc = await collection.findOne(id).exec();
        if (doc) {
            const data = this.cleanData(item);
            await doc.patch(data);
            return doc.toJSON() as T;
        }
        throw new Error(`Document ${id} not found in ${this.tableName}`);
    }

    async delete(id: string): Promise<void> {
        const collection = await this.getCollection();
        const doc = await collection.findOne(id).exec();
        if (doc) {
            await doc.remove();
        }
    }

    async find(selector: any, sort?: any): Promise<T[]> {
        const collection = await this.getCollection();
        let query = collection.find({ selector });
        if (sort) {
            query = query.sort(sort);
        }
        const docs = await query.exec();
        return this.processDocs(docs) as unknown as T[];
    }

    // Client-specific: Get the RxQuery object for reactive subscriptions
    // Usage: (await service.getQuery({ ... })).$.subscribe(...)
    async getQuery(selector: any = {}, sort?: any) {
        const collection = await this.getCollection();
        let query = collection.find({ selector });
        if (sort) {
            query = query.sort(sort);
        }
        return query;
    }

    async getListQuery(orderBy?: string, orderDirection: 'asc' | 'desc' = 'desc') {
        const collection = await this.getCollection();
        let query = collection.find();
        
        if (orderBy && this.tableDef.fields[orderBy]) {
            query = query.sort({ [orderBy]: orderDirection });
        }
        return query;
    }
}
