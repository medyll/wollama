export interface IGenericService<T> {
    getAll(): Promise<T[]>;
    get(id: string): Promise<T | null>;
    create(item: T): Promise<T>;
    update(item: T): Promise<T>;
    delete(id: string): Promise<void>;
    find(selector: Record<string, unknown>, sort?: Array<string | Record<string, 'asc' | 'desc'>>): Promise<T[]>;
}

export abstract class AbstractGenericService<T> implements IGenericService<T> {
    protected tableName: string;
    protected primaryKey: string;

    constructor(tableName: string, primaryKey: string) {
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }

    abstract getAll(): Promise<T[]>;
    abstract get(id: string): Promise<T | null>;
    abstract create(item: T): Promise<T>;
    abstract update(item: T): Promise<T>;
    abstract delete(id: string): Promise<void>;
    abstract find(selector: Record<string, unknown>, sort?: any): Promise<T[]>;
}
