import { describe, expect, it, vi } from 'vitest';

vi.mock('../config.js', () => ({
	config: {
		mcp: {
			acpTeam: { enabled: false, entry: '', dataDir: '' },
			workspaceAllowlist: ['D:\\allowed\\workspace']
		}
	}
}));

// Real filesystem/junction behavior is covered by orchestration/workspace.test.ts —
// this file only needs to prove guardAcpTeamInput's own decision logic, so the
// workspace check is mocked to a plain string-prefix rule.
vi.mock('../orchestration/workspace.js', () => ({
	isWorkspaceAllowed: (ws: string, allowlist: string[]) => allowlist.some((r) => ws === r || ws.startsWith(r + '\\')),
	resolveRealPath: (p: string) => p
}));

import { guardAcpTeamInput } from './acp-team.guard.js';
import type { ExecutionContext, ToolDescriptor } from '../orchestration/types.js';

function descriptor(name: string, properties: Record<string, unknown>): ToolDescriptor {
	return {
		id: `mcp:acp-team:${name}`,
		serverId: 'acp-team',
		name,
		wireName: `mcp__acp_team__${name}`,
		inputSchema: { type: 'object', properties },
		risk: 'execute'
	};
}

describe('guardAcpTeamInput', () => {
	const ctx: ExecutionContext = { origin: 'chat', workspace: 'D:\\allowed\\workspace' };

	it('strips authorization when ctx carries no grantedAuthorization', () => {
		const d = descriptor('agent_start', { prompt: { type: 'string' }, authorization: { type: 'string' } });
		const result = guardAcpTeamInput(d, { prompt: 'hi', authorization: 'model-supplied-secret' }, ctx);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.input.authorization).toBeUndefined();
	});

	it('uses ctx.grantedAuthorization, never the model-supplied value, when set', () => {
		const d = descriptor('agent_start', { prompt: { type: 'string' }, authorization: { type: 'string' } });
		const result = guardAcpTeamInput(
			d,
			{ prompt: 'hi', authorization: 'model-supplied-secret' },
			{ ...ctx, grantedAuthorization: 'real_token_from_consent_prompt' }
		);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.input.authorization).toBe('real_token_from_consent_prompt');
	});

	it('forces mode to plan when the schema declares it and ctx.grantedMode is unset, ignoring model input', () => {
		const d = descriptor('agent_start', { prompt: { type: 'string' }, mode: { type: 'string' } });
		const result = guardAcpTeamInput(d, { prompt: 'hi', mode: 'auto' }, ctx);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.input.mode).toBe('plan');
	});

	it('uses ctx.grantedMode (never the model-supplied mode) once a grant approved it', () => {
		const d = descriptor('agent_start', { prompt: { type: 'string' }, mode: { type: 'string' } });
		const result = guardAcpTeamInput(d, { prompt: 'hi', mode: 'auto' }, { ...ctx, grantedMode: 'default' });
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.input.mode).toBe('default');
	});

	it('injects ctx.workspace as cwd when the schema declares cwd, ignoring the model-supplied cwd', () => {
		const d = descriptor('agent_start', { prompt: { type: 'string' }, cwd: { type: 'string' } });
		const result = guardAcpTeamInput(d, { prompt: 'hi', cwd: 'C:\\somewhere\\else' }, ctx);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.input.cwd).toBe('D:\\allowed\\workspace');
	});

	it('refuses when the schema declares cwd but ctx.workspace is unset', () => {
		const d = descriptor('agent_start', { cwd: { type: 'string' } });
		const result = guardAcpTeamInput(d, {}, { origin: 'chat' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.result.error).toBe('workspace_required');
	});

	it('refuses when ctx.workspace is outside the allowlist', () => {
		const d = descriptor('agent_start', { cwd: { type: 'string' } });
		const result = guardAcpTeamInput(d, {}, { origin: 'chat', workspace: 'C:\\not\\allowed' });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.result.error).toBe('workspace_denied');
	});

	it('leaves input untouched for tools with no mode/cwd/authorization in schema', () => {
		const d = descriptor('agent_list', {});
		const result = guardAcpTeamInput(d, {}, ctx);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.input).toEqual({});
	});
});
