import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config.js', () => ({
	config: {
		tools: { enabled: true, maxIterations: 4, autoApprove: ['builtin:allowed-tool', 'builtin:allowed-tool-2'] },
		mcp: { acpTeam: { enabled: false, entry: '', dataDir: '' }, workspaceAllowlist: [], servers: [] }
	}
}));

vi.mock('../db/database.js', () => ({
	dbManager: { getDb: vi.fn() }
}));

import { toolExecutor } from './tool-executor.js';
import { toolCatalog } from './tool-catalog.js';
import { permissionService } from './permission-service.js';
import { dbManager } from '../db/database.js';
import type { ExecutionContext, ToolDescriptor, ToolRisk, ToolRuntime } from './types.js';

const ctx: ExecutionContext = { origin: 'api', user_id: 'user-1' };

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
		})
	};
}

function descriptor(id: string, inputSchema: Record<string, unknown>, risk: ToolRisk = 'read'): ToolDescriptor {
	return { id, serverId: 'builtin', name: id, wireName: id, inputSchema, risk };
}

describe('toolExecutor', () => {
	let runtimeCalled: number;
	let db: ReturnType<typeof makeDb>;

	beforeEach(() => {
		toolCatalog.unregister('builtin');
		runtimeCalled = 0;
		db = makeDb();
		vi.mocked(dbManager.getDb).mockReturnValue(db as any);
	});

	it('rejects input that fails ajv validation without invoking the runtime', async () => {
		const d = descriptor('builtin:allowed-tool', {
			type: 'object',
			properties: { n: { type: 'number' } },
			required: ['n']
		});
		const runtime: ToolRuntime = {
			serverId: 'builtin',
			async list() {
				return [d];
			},
			async call() {
				runtimeCalled++;
				return { ok: true, content: 'should not run' };
			}
		};
		toolCatalog.register(runtime);

		const result = await toolExecutor.executeById(d.id, { n: 'not-a-number' }, ctx);

		expect(result.ok).toBe(false);
		expect(runtimeCalled).toBe(0);
		expect(Object.keys(db.store)).toHaveLength(0); // no dangling 'running' row
	});

	it('denies an external-risk tool outside autoApprove once the live consent prompt is denied, without leaving a running row', async () => {
		const d = descriptor('builtin:not-allowed', { type: 'object' }, 'external');
		const runtime: ToolRuntime = {
			serverId: 'builtin',
			async list() {
				return [d];
			},
			async call() {
				runtimeCalled++;
				return { ok: true, content: 'should not run' };
			}
		};
		toolCatalog.register(runtime);

		const result = await toolExecutor.executeById(d.id, {}, ctx, {
			onPermissionRequest: ({ request_id }) => {
				void permissionService.resolve(request_id, 'deny', 'once', { ctx });
			}
		});

		expect(result.ok).toBe(false);
		expect(result.error).toBe('permission_denied');
		expect(runtimeCalled).toBe(0);
		expect(Object.keys(db.store)).toHaveLength(0);
	});

	it('allows an external-risk tool in autoApprove without asking, and persists a done row with the output', async () => {
		const d = descriptor('builtin:allowed-tool-2', { type: 'object' }, 'external');
		const runtime: ToolRuntime = {
			serverId: 'builtin',
			async list() {
				return [d];
			},
			async call() {
				runtimeCalled++;
				return { ok: true, content: 'ok', data: { x: 1 } };
			}
		};
		toolCatalog.register(runtime);

		const result = await toolExecutor.executeById(d.id, {}, ctx);

		expect(result.ok).toBe(true);
		expect(runtimeCalled).toBe(1);
		expect(result.tool_call_id).toBeTruthy();
		const saved = db.store[result.tool_call_id!];
		expect(saved.status).toBe('done');
		expect(saved.tool_id).toBe(d.id);
	});
});
