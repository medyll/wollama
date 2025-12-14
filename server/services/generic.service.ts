import { dbManager } from '../db/database.js';
import { AbstractGenericService } from '../../shared/services/abstract-generic.service.js';

export class GenericService<T> extends AbstractGenericService<T> {
	constructor(tableName: string) {
		const schema = dbManager.getSchema(tableName);
		if (!schema) {
			throw new Error(`Schema not found for table ${tableName}`);
		}
		super(tableName, schema.primaryKey);
	}

	private get db() {
		return dbManager.getDb(this.tableName);
	}

	async getAll(): Promise<T[]> {
		const result = await this.db.allDocs({ include_docs: true });
		return result.rows.map((row) => row.doc as unknown as T);
	}

	async get(id: string): Promise<T | null> {
		try {
			return (await this.db.get(id)) as unknown as T;
		} catch (err) {
			const error = err as { status?: number };
			if (error.status === 404) return null;
			throw err;
		}
	}

	async create(item: T): Promise<T> {
		const id = (item as Record<string, unknown>)[this.primaryKey] as string;
		if (!id) {
			throw new Error(`Primary key ${this.primaryKey} is missing`);
		}
		const doc = { ...item, _id: id };
		await this.db.put(doc);
		return item;
	}

	async update(item: T): Promise<T> {
		const id = (item as Record<string, unknown>)[this.primaryKey] as string;
		if (!id) {
			throw new Error(`Primary key ${this.primaryKey} is missing`);
		}
		try {
			const existing = await this.db.get(id);
			const doc = { ...item, _id: id, _rev: existing._rev };
			await this.db.put(doc);
			return item;
		} catch (err) {
			const error = err as { status?: number };
			if (error.status === 404) {
				// If not found, create it (upsert behavior)
				return this.create(item);
			}
			throw err;
		}
	}

	async delete(id: string): Promise<void> {
		try {
			const doc = await this.db.get(id);
			await this.db.remove(doc);
		} catch (err) {
			const error = err as { status?: number };
			if (error.status !== 404) throw err;
		}
	}

	async find(selector: Record<string, unknown>, sort?: Array<string | Record<string, 'asc' | 'desc'>>): Promise<T[]> {
		const query: PouchDB.Find.FindRequest<Record<string, unknown>> = { selector };
		if (sort) {
			query.sort = sort;
		}
		const result = await this.db.find(query);
		return result.docs as unknown as T[];
	}
}
