/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDatabase } from '../db';
import { appSchema } from '../../../../shared/db/database-scheme';
import type { RxCollection } from 'rxdb';
import { AbstractGenericService } from '../../../../shared/services/abstract-generic.service';

export class GenericService<T> extends AbstractGenericService<T> {

    constructor(collectionName: string) {
        const schema = appSchema[collectionName as keyof typeof appSchema];
        if (!schema) {
            throw new Error(`Schema not found for table ${collectionName}`);
        }
        super(collectionName, schema.primaryKey);
    }

    private async getCollection(): Promise<RxCollection> {
        const db = await getDatabase();
        return db[this.tableName];
    }

    async getAll(): Promise<T[]> {
        const collection = await this.getCollection();
        const docs = await collection.find().exec();
        return docs.map(doc => doc.toJSON() as T);
    }

    async get(id: string): Promise<T | null> {
        const collection = await this.getCollection();
        const doc = await collection.findOne(id).exec();
        return doc ? (doc.toJSON() as T) : null;
    }

    async create(item: T): Promise<T> {
        const collection = await this.getCollection();
        const doc = await collection.insert(item as any);
        return doc.toJSON() as T;
    }

    async update(item: T): Promise<T> {
        const collection = await this.getCollection();
        // RxDB upsert handles both insert and update based on primary key
        const doc = await collection.upsert(item as any);
        return doc.toJSON() as T;
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
        return docs.map(doc => doc.toJSON() as T);
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
}
