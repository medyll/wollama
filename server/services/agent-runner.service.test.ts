import { describe, it, expect, vi, beforeEach } from 'vitest';

// AgentRunnerService now delegates to toolExecutor -> builtinRuntime -> agents/index.js's
// listBuiltins(). Mock that instead of the old getAgent() so the executor's descriptor
// lookup + validation path is exercised for real.
vi.mock('../agents/index.js', () => ({
	listBuiltins: vi.fn()
}));

// Auto-approve is normally scoped to web-search/page-fetch; broaden it for these tests
// so arbitrary test slugs don't get denied by policy.
vi.mock('../config.js', () => ({
	config: {
		tools: {
			enabled: true,
			maxIterations: 4,
			autoApprove: { includes: () => true }
		},
		mcp: { acpTeam: { enabled: false, entry: '', dataDir: '' }, workspaceAllowlist: [], servers: [] }
	}
}));

// Mock dbManager
vi.mock('../db/database.js', () => ({
	dbManager: {
		getDb: vi.fn()
	}
}));

import { AgentRunnerService } from './agent-runner.service.js';
import { listBuiltins } from '../agents/index.js';
import { dbManager } from '../db/database.js';
import { toolCatalog } from '../orchestration/tool-catalog.js';
import { builtinRuntime } from '../orchestration/builtin.runtime.js';

const mockListBuiltins = vi.mocked(listBuiltins);
const mockGetDb = vi.mocked(dbManager.getDb);

function makeDb(docStore: Record<string, any> = {}) {
	return {
		put: vi.fn(async (doc: any) => {
			docStore[doc._id] = { ...doc };
			return { ok: true };
		}),
		get: vi.fn(async (id: string) => {
			const doc = docStore[id];
			if (!doc) {
				const e: any = new Error('not found');
				e.status = 404;
				throw e;
			}
			return { ...doc };
		})
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	toolCatalog.register(builtinRuntime);
});

describe('AgentRunnerService.run', () => {
	it('returns error when no agent found for slug', async () => {
		mockListBuiltins.mockReturnValue({});
		mockGetDb.mockReturnValue(makeDb() as any);

		const result = await AgentRunnerService.run({ slug: 'missing', input: {} });
		expect(result.status).toBe('error');
		expect(result.error).toContain('missing');
	});

	it('runs agent and records done status', async () => {
		const store: Record<string, any> = {};
		const db = makeDb(store);
		mockGetDb.mockReturnValue(db as any);
		mockListBuiltins.mockReturnValue({
			'test-agent': {
				descriptor: { name: 'test-agent', description: 'test', inputSchema: {}, risk: 'read' },
				run: async () => ({ answer: 42 })
			}
		});

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
		mockListBuiltins.mockReturnValue({
			'bad-agent': {
				descriptor: { name: 'bad-agent', description: 'test', inputSchema: {}, risk: 'read' },
				run: async () => {
					throw new Error('boom');
				}
			}
		});

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
