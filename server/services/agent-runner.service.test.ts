import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the agents registry
vi.mock('../agents/index.js', () => ({
    getAgent: vi.fn()
}));

// Mock dbManager
vi.mock('../db/database.js', () => ({
    dbManager: {
        getDb: vi.fn()
    }
}));

import { AgentRunnerService } from './agent-runner.service.js';
import { getAgent } from '../agents/index.js';
import { dbManager } from '../db/database.js';

const mockGetAgent = vi.mocked(getAgent);
const mockGetDb = vi.mocked(dbManager.getDb);

function makeDb(docStore: Record<string, any> = {}) {
    return {
        put: vi.fn(async (doc: any) => { docStore[doc._id] = { ...doc }; return { ok: true }; }),
        get: vi.fn(async (id: string) => {
            const doc = docStore[id];
            if (!doc) { const e: any = new Error('not found'); e.status = 404; throw e; }
            return { ...doc };
        })
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('AgentRunnerService.run', () => {
    it('returns error when no agent found for slug', async () => {
        mockGetAgent.mockReturnValue(null);
        const result = await AgentRunnerService.run({ slug: 'missing', input: {} });
        expect(result.status).toBe('error');
        expect(result.error).toContain('missing');
    });

    it('runs agent and records done status', async () => {
        const store: Record<string, any> = {};
        const db = makeDb(store);
        mockGetDb.mockReturnValue(db as any);
        mockGetAgent.mockReturnValue(async () => ({ answer: 42 }));

        const result = await AgentRunnerService.run({ slug: 'test-agent', input: { q: 'hello' } });
        expect(result.status).toBe('done');
        expect(result.output).toEqual({ answer: 42 });
        expect(result.tool_call_id).toBeTruthy();

        const saved = store[result.tool_call_id];
        expect(saved.status).toBe('done');
        expect(saved.finished_at).toBeTruthy();
    });

    it('records error status when agent throws', async () => {
        const store: Record<string, any> = {};
        const db = makeDb(store);
        mockGetDb.mockReturnValue(db as any);
        mockGetAgent.mockReturnValue(async () => { throw new Error('boom'); });

        const result = await AgentRunnerService.run({ slug: 'bad-agent', input: {} });
        expect(result.status).toBe('error');
        expect(result.error).toBe('boom');

        const saved = store[result.tool_call_id];
        expect(saved.status).toBe('error');
        expect(saved.finished_at).toBeTruthy();
    });
});

describe('AgentRunnerService.getStatus', () => {
    it('returns the tool_call record', async () => {
        const store: Record<string, any> = { 'abc-123': { tool_call_id: 'abc-123', status: 'done', output: { x: 1 } } };
        mockGetDb.mockReturnValue(makeDb(store) as any);

        const result = await AgentRunnerService.getStatus('abc-123');
        expect(result).not.toBeNull();
        expect(result?.status).toBe('done');
    });

    it('returns null for unknown tool_call_id', async () => {
        mockGetDb.mockReturnValue(makeDb({}) as any);
        const result = await AgentRunnerService.getStatus('unknown');
        expect(result).toBeNull();
    });
});
