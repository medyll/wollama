import { describe, expect, it, beforeEach } from 'vitest';
import { toolCatalog, toWireName } from './tool-catalog.js';
import type { ExecutionContext, ToolDescriptor, ToolRuntime } from './types.js';

const ctx: ExecutionContext = { origin: 'api' };

function descriptor(id: string, serverId: string, name: string): ToolDescriptor {
	return {
		id,
		serverId,
		name,
		wireName: toWireName(serverId, name),
		inputSchema: {},
		risk: 'read'
	};
}

function fakeRuntime(serverId: string, descriptors: ToolDescriptor[]): ToolRuntime {
	return {
		serverId,
		async list() {
			return descriptors;
		},
		async call() {
			return { ok: true, content: '' };
		}
	};
}

describe('toWireName', () => {
	it('sanitizes disallowed characters and round-trips', () => {
		const w = toWireName('acp-team', 'agent_start');
		expect(w).toMatch(/^[a-zA-Z0-9_-]{1,64}$/);
		expect(w).toBe('mcp__acp-team__agent_start');
	});
});

describe('toolCatalog', () => {
	beforeEach(() => {
		toolCatalog.unregister('builtin');
		toolCatalog.unregister('acp-team');
	});

	it('dedupes across runtimes by id, keeping the latest registration', () => {
		const d1 = descriptor('builtin:web-search', 'builtin', 'web-search');
		toolCatalog.register(fakeRuntime('builtin', [d1]));

		return toolCatalog.list(ctx).then((all) => {
			expect(all).toEqual([d1]);
		});
	});

	it('resolves runtimeFor by prefix for both builtin and mcp namespaces', () => {
		const runtime = fakeRuntime('acp-team', []);
		toolCatalog.register(runtime);

		expect(toolCatalog.runtimeFor('mcp:acp-team:agent_start')).toBe(runtime);

		const builtinRuntime = fakeRuntime('builtin', []);
		toolCatalog.register(builtinRuntime);
		expect(toolCatalog.runtimeFor('builtin:web-search')).toBe(builtinRuntime);
	});

	it('resolveWireName finds a descriptor by its wire name', async () => {
		const d = descriptor('mcp:acp-team:agent_start', 'acp-team', 'agent_start');
		toolCatalog.register(fakeRuntime('acp-team', [d]));

		const found = await toolCatalog.resolveWireName(d.wireName, ctx);
		expect(found).toEqual(d);
	});
});
