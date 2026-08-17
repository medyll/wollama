import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PermissionState } from './permissions.svelte.js';

describe('PermissionState', () => {
	let state: PermissionState;
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		state = new PermissionState();
		fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
	});

	it('push() adds a request and ignores a duplicate request_id', () => {
		state.push({ request_id: 'r1', tool_id: 'mcp:acp-team:agent_start', risk: 'execute', input: { prompt: 'hi' } });
		state.push({ request_id: 'r1', tool_id: 'mcp:acp-team:agent_start', risk: 'execute', input: { prompt: 'hi' } });
		expect(state.pending).toHaveLength(1);
	});

	it('respond() posts the decision and removes the request from the pending queue', async () => {
		fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
		state.push({ request_id: 'r1', tool_id: 'mcp:acp-team:agent_start', risk: 'execute', input: {} });

		const ok = await state.respond('r1', 'allow', 'session', { toolId: 'mcp:acp-team:agent_start' });

		expect(ok).toBe(true);
		expect(state.pending).toHaveLength(0);
		expect(fetchMock).toHaveBeenCalledWith(
			expect.stringContaining('/api/permissions/r1'),
			expect.objectContaining({ method: 'POST' })
		);
		const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
		expect(body).toMatchObject({ decision: 'allow', scope: 'session', tool_id: 'mcp:acp-team:agent_start' });
	});

	it('respond() still removes the request from the queue on a network failure', async () => {
		fetchMock.mockRejectedValue(new Error('network down'));
		state.push({ request_id: 'r1', tool_id: 'x', risk: 'write', input: {} });

		const ok = await state.respond('r1', 'deny', 'once');

		expect(ok).toBe(false);
		expect(state.pending).toHaveLength(0);
	});
});
