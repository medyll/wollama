import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../orchestration/tool-executor.js', () => ({
	toolExecutor: { executeById: vi.fn() }
}));

import { acpTeamBackend } from './acp-team.backend.js';
import { toolExecutor } from '../orchestration/tool-executor.js';

const mockExecuteById = vi.mocked(toolExecutor.executeById);

beforeEach(() => vi.clearAllMocks());

describe('acpTeamBackend.start', () => {
	it('calls agent_start with mode forced to plan, an absolute cwd, and no authorization key', async () => {
		mockExecuteById.mockResolvedValue({ ok: true, content: '', data: { run_id: 'remote-42' } });

		const result = await acpTeamBackend.start(
			{ agent: 'kimi', prompt: 'do the thing', mode: 'plan', cwd: 'D:\\workspace', model: 'kimi-k2' },
			{ origin: 'system', workspace: 'D:\\workspace' }
		);

		expect(result).toEqual({ remote_run_id: 'remote-42' });
		expect(mockExecuteById).toHaveBeenCalledTimes(1);
		const [toolId, input] = mockExecuteById.mock.calls[0];
		expect(toolId).toBe('mcp:acp-team:agent_start');
		expect(input).toMatchObject({ agent: 'kimi', prompt: 'do the thing', mode: 'plan', cwd: 'D:\\workspace' });
		expect(input).not.toHaveProperty('authorization');
	});

	it('throws when agent_start does not return a run id', async () => {
		mockExecuteById.mockResolvedValue({ ok: true, content: '', data: {} });
		await expect(
			acpTeamBackend.start(
				{ agent: 'kimi', prompt: 'x', mode: 'plan', cwd: 'D:\\ws' },
				{ origin: 'system', workspace: 'D:\\ws' }
			)
		).rejects.toThrow(/did not return a run id/);
	});

	it('throws with the underlying error when the tool call is denied', async () => {
		mockExecuteById.mockResolvedValue({ ok: false, content: 'denied', error: 'workspace_denied' });
		await expect(
			acpTeamBackend.start(
				{ agent: 'kimi', prompt: 'x', mode: 'plan', cwd: 'D:\\ws' },
				{ origin: 'system', workspace: 'D:\\ws' }
			)
		).rejects.toThrow('workspace_denied');
	});
});

describe('acpTeamBackend.watch', () => {
	it('maps a successful poll to {status, events, lastEvent} and uses origin:system', async () => {
		mockExecuteById.mockResolvedValue({
			ok: true,
			content: '',
			data: { status: 'running', lastEvent: 3, events: [{ seq: 3, type: 'run.admitted', payload: {} }] }
		});

		const result = await acpTeamBackend.watch('remote-1', 0, 25000);
		expect(result).toEqual({ status: 'running', events: [{ seq: 3, type: 'run.admitted', payload: {} }], lastEvent: 3 });

		const [toolId, input, ctx] = mockExecuteById.mock.calls[0];
		expect(toolId).toBe('mcp:acp-team:agent_watch');
		expect(input).toMatchObject({ run_id: 'remote-1', after_event: 0, wait_ms: 25000 });
		expect(ctx).toMatchObject({ origin: 'system' });
	});

	it('treats a not-found error as interrupted rather than failed', async () => {
		mockExecuteById.mockResolvedValue({ ok: false, content: 'not found', error: 'run not found (404)' });
		const result = await acpTeamBackend.watch('remote-evicted', 5, 25000);
		expect(result).toEqual({ status: 'interrupted', events: [], lastEvent: 5 });
	});

	it('throws for a genuine watch failure', async () => {
		mockExecuteById.mockResolvedValue({ ok: false, content: 'boom', error: 'transport error' });
		await expect(acpTeamBackend.watch('remote-1', 0, 25000)).rejects.toThrow('transport error');
	});
});

describe('acpTeamBackend.cancel', () => {
	it('calls agent_stop with the remote run id', async () => {
		mockExecuteById.mockResolvedValue({ ok: true, content: '' });
		await acpTeamBackend.cancel('remote-1');
		const [toolId, input] = mockExecuteById.mock.calls[0];
		expect(toolId).toBe('mcp:acp-team:agent_stop');
		expect(input).toEqual({ run_id: 'remote-1' });
	});

	it('does not throw when the run was already evicted (not-found)', async () => {
		mockExecuteById.mockResolvedValue({ ok: false, content: 'not found', error: 'not found' });
		await expect(acpTeamBackend.cancel('remote-evicted')).resolves.toBeUndefined();
	});
});
