import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { GenericService } from './generic.service';
import { dbManager } from '../db/database.js';

// Mock the database module
vi.mock('../db/database.js', () => ({
    dbManager: {
        getSchema: vi.fn(),
        getDb: vi.fn(),
    }
}));

interface TestItem {
    id: string;
    val: string;
}

describe('GenericService', () => {
    const tableName = 'test_table';
    const primaryKey = 'id';
    let service: GenericService<TestItem>;
    let mockDb: {
        allDocs: Mock;
        get: Mock;
        put: Mock;
        remove: Mock;
        find: Mock;
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock DB
        mockDb = {
            allDocs: vi.fn(),
            get: vi.fn(),
            put: vi.fn(),
            remove: vi.fn(),
            find: vi.fn(),
        };

        // Setup dbManager mocks
        (dbManager.getSchema as unknown as Mock).mockReturnValue({ primaryKey });
        (dbManager.getDb as unknown as Mock).mockReturnValue(mockDb);

        service = new GenericService<TestItem>(tableName);
    });

    it('should initialize correctly', () => {
        expect(service).toBeDefined();
        expect(dbManager.getSchema).toHaveBeenCalledWith(tableName);
    });

    describe('getAll', () => {
        it('should return all documents', async () => {
            const docs = [{ id: '1', val: 'a' }, { id: '2', val: 'b' }];
            mockDb.allDocs.mockResolvedValue({
                rows: docs.map(doc => ({ doc }))
            });

            const result = await service.getAll();
            expect(result).toEqual(docs);
            expect(mockDb.allDocs).toHaveBeenCalledWith({ include_docs: true });
        });
    });

    describe('get', () => {
        it('should return a document by id', async () => {
            const doc = { id: '1', val: 'a' };
            mockDb.get.mockResolvedValue(doc);

            const result = await service.get('1');
            expect(result).toEqual(doc);
            expect(mockDb.get).toHaveBeenCalledWith('1');
        });

        it('should return null if document not found (404)', async () => {
            mockDb.get.mockRejectedValue({ status: 404 });

            const result = await service.get('1');
            expect(result).toBeNull();
        });

        it('should throw error for other errors', async () => {
            const error = new Error('DB Error');
            mockDb.get.mockRejectedValue(error);

            await expect(service.get('1')).rejects.toThrow('DB Error');
        });
    });

    describe('create', () => {
        it('should create a document', async () => {
            const item = { id: '1', val: 'a' };
            mockDb.put.mockResolvedValue({ ok: true });

            const result = await service.create(item);
            expect(result).toEqual(item);
            expect(mockDb.put).toHaveBeenCalledWith({ ...item, _id: '1' });
        });

        it('should throw error if primary key is missing', async () => {
            const item = { val: 'a' }; // Missing 'id'
            await expect(service.create(item)).rejects.toThrow(`Primary key ${primaryKey} is missing`);
        });
    });

    describe('update', () => {
        it('should update a document', async () => {
            const item = { id: '1', val: 'updated' };
            const existing = { _id: '1', _rev: '1-rev', val: 'old' };
            
            mockDb.get.mockResolvedValue(existing);
            mockDb.put.mockResolvedValue({ ok: true });

            const result = await service.update(item);
            expect(result).toEqual(item);
            expect(mockDb.get).toHaveBeenCalledWith('1');
            expect(mockDb.put).toHaveBeenCalledWith({ ...item, _id: '1', _rev: '1-rev' });
        });

        it('should create document if it does not exist (upsert)', async () => {
            const item = { id: '1', val: 'updated' };
            mockDb.get.mockRejectedValue({ status: 404 });
            mockDb.put.mockResolvedValue({ ok: true });

            // Spy on create method to verify it's called
            const createSpy = vi.spyOn(service, 'create');

            const result = await service.update(item);
            expect(result).toEqual(item);
            expect(createSpy).toHaveBeenCalledWith(item);
        });
    });

    describe('delete', () => {
        it('should delete a document', async () => {
            const existing = { _id: '1', _rev: '1-rev' };
            mockDb.get.mockResolvedValue(existing);
            mockDb.remove.mockResolvedValue({ ok: true });

            await service.delete('1');
            expect(mockDb.get).toHaveBeenCalledWith('1');
            expect(mockDb.remove).toHaveBeenCalledWith(existing);
        });
    });
});
