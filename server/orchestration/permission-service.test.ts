import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config.js', () => ({
	config: {
		tools: { enabled: true, maxIterations: 4, autoApprove: [] },
		mcp: { acpTeam: { enabled: false, entry: '', dataDir: '' }, workspaceAllowlist: [], servers: [] }
	}
}));

function makeDb() {
	const store: Record<string, any> = {};
	return {
		store,
		put: vi.fn(async (doc: any) => {
			store[doc._id] = { ...doc };
			return { ok: true };
		}),
		get: vi.fn(async (id: string) => {
			const doc = store[id];
			if (!doc) {
				const e: any = new Error('not found');
				e.status = 404;
				throw e;
			}
			return { ...doc };
		}),
		find: vi.fn(async (query: any) => {
			const selector = query.selector ?? {};
			const docs = Object.values(store).filter((d: any) => Object.entries(selector).every(([k, v]) => d[k] === v));
			return { docs };
		})
	};
}

const grantsDb = makeDb();

vi.mock('../db/database.js', () => ({
	dbManager: { getDb: () => grantsDb }
}));

import { permissionService } from './permission-service.js';
import type { ToolDescriptor } from './types.js';

function writeTool(id = 'mcp:acp-team:agent_start'): ToolDescriptor {
	return { id, serverId: 'acp-team', name: 'agent_start', wireName: 'agent_start', inputSchema: {}, risk: 'execute' };
}

function readTool(): ToolDescriptor {
	return {
		id: 'mcp:acp-team:agent_list',
		serverId: 'acp-team',
		name: 'agent_list',
		wireName: 'agent_list',
		inputSchema: {},
		risk: 'read'
	};
}

beforeEach(() => {
	for (const k of Object.keys(grantsDb.store)) delete grantsDb.store[k];
	permissionService._resetForTests();
	vi.clearAllMocks();
});

describe('permissionService.check', () => {
	it('always allows read-risk tools', async () => {
		expect(await permissionService.check(readTool(), { origin: 'chat', user_id: 'u1' })).toBe('allow');
	});

	it('always allows system-origin calls regardless of risk', async () => {
		expect(await permissionService.check(writeTool(), { origin: 'system' })).toBe('allow');
	});

	it('asks for a write-risk tool with no grant', async () => {
		expect(await permissionService.check(writeTool(), { origin: 'chat', user_id: 'u1', workspace: 'D:\\ws' })).toBe('ask');
	});

	it('asks when there is no user_id at all', async () => {
		expect(await permissionService.check(writeTool(), { origin: 'chat' })).toBe('ask');
	});
});

describe('permission flow: ask -> resolve -> grant reuse', () => {
	it('a write tool asks, then allows after a persistent grant, and asks again for a different workspace', async () => {
		const tool = writeTool();
		const ctx = { origin: 'chat' as const, user_id: 'u1', workspace: 'D:\\ws-a' };

		expect(await permissionService.check(tool, ctx)).toBe('ask');

		let requestId = '';
		const decision = permissionService.requestAndAwait(tool, ctx.workspace, (id) => {
			requestId = id;
		});
		await permissionService.resolve(requestId, 'allow', 'persistent', { ctx, descriptor: tool });
		expect(await decision).toBe('allow');

		// Same tool_id + same workspace -> now allowed without asking again.
		expect(await permissionService.check(tool, ctx)).toBe('allow');

		// Same tool_id, different workspace -> the grant doesn't cover it.
		expect(await permissionService.check(tool, { ...ctx, workspace: 'D:\\ws-b' })).toBe('ask');
	});

	it('an expired grant does not apply', async () => {
		const tool = writeTool('mcp:acp-team:agent_start:expiring');
		const ctx = { origin: 'chat' as const, user_id: 'u1', workspace: 'D:\\ws' };

		let requestId = '';
		const decision = permissionService.requestAndAwait(tool, ctx.workspace, (id) => {
			requestId = id;
		});
		await permissionService.resolve(requestId, 'allow', 'persistent', { ctx, descriptor: tool, ttlMs: -1 });
		await decision;

		expect(await permissionService.check(tool, ctx)).toBe('ask');
	});

	it('a revoked grant no longer applies', async () => {
		const tool = writeTool('mcp:acp-team:agent_start:revoking');
		const ctx = { origin: 'chat' as const, user_id: 'u1', workspace: 'D:\\ws' };

		let requestId = '';
		const decision = permissionService.requestAndAwait(tool, ctx.workspace, (id) => {
			requestId = id;
		});
		await permissionService.resolve(requestId, 'allow', 'persistent', { ctx, descriptor: tool });
		await decision;
		expect(await permissionService.check(tool, ctx)).toBe('allow');

		const grantDoc = Object.values(grantsDb.store).find((g: any) => g.tool_id === tool.id) as any;
		const revoked = await permissionService.revoke(grantDoc.grant_id);
		expect(revoked).toBe(true);

		expect(await permissionService.check(tool, ctx)).toBe('ask');
	});

	it('a "once" scope decision does not persist a grant — the next call asks again', async () => {
		const tool = writeTool('mcp:acp-team:agent_start:once');
		const ctx = { origin: 'chat' as const, user_id: 'u1', workspace: 'D:\\ws' };

		let requestId = '';
		const decision = permissionService.requestAndAwait(tool, ctx.workspace, (id) => {
			requestId = id;
		});
		await permissionService.resolve(requestId, 'allow', 'once', { ctx, descriptor: tool });
		expect(await decision).toBe('allow');

		expect(await permissionService.check(tool, ctx)).toBe('ask');
	});

	it('times out to deny when never resolved', async () => {
		const tool = writeTool('mcp:acp-team:agent_start:timeout');
		const decision = permissionService.requestAndAwait(tool, 'D:\\ws', () => {}, 10);
		expect(await decision).toBe('deny');
	});

	it('resolve() returns false for an unknown/already-settled request_id', async () => {
		const ok = await permissionService.resolve('not-a-real-id', 'allow', 'once', { ctx: { origin: 'api' } });
		expect(ok).toBe(false);
	});
});

describe('takeAuthorization', () => {
	it('returns the token once, then nothing on a second call', async () => {
		const tool = writeTool('mcp:acp-team:agent_start:auth');
		const ctx = { origin: 'chat' as const, user_id: 'u1', workspace: 'D:\\ws' };

		let requestId = '';
		const decision = permissionService.requestAndAwait(tool, ctx.workspace, (id) => {
			requestId = id;
		});
		await permissionService.resolve(requestId, 'allow', 'once', { ctx, authorization: 'secret-token' });
		await decision;

		expect(permissionService.takeAuthorization(requestId)).toBe('secret-token');
		expect(permissionService.takeAuthorization(requestId)).toBeUndefined();
	});
});
