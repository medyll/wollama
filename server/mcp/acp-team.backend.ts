import { toolExecutor } from '../orchestration/tool-executor.js';
import { ACP_TEAM_SERVER_ID } from './acp-team.constants.js';
import type { ExecutionContext, RunBackend, RunEvent, RunStatus } from '../orchestration/types.js';

const AGENT_START_ID = `mcp:${ACP_TEAM_SERVER_ID}:agent_start`;
const AGENT_WATCH_ID = `mcp:${ACP_TEAM_SERVER_ID}:agent_watch`;
const AGENT_STOP_ID = `mcp:${ACP_TEAM_SERVER_ID}:agent_stop`;

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNotFoundError(message: string | undefined): boolean {
	return typeof message === 'string' && /not found|404/i.test(message);
}

/**
 * RunBackend over acp-team's agent_start / agent_watch / agent_stop tools. All three
 * go through toolExecutor.executeById so runs share the audit trail with every other
 * tool call — the "no third execution path" invariant. Internal follow-up calls
 * (watch/cancel) use `origin: 'system'`, exempting them from the model-facing
 * autoApprove allowlist: by the time run-manager is polling, the run was already
 * authorized at agent_start.
 */
export const acpTeamBackend: RunBackend = {
	backendId: ACP_TEAM_SERVER_ID,

	async start(req, ctx: ExecutionContext) {
		// mode/authorization are stripped/forced by acp-team.guard.ts regardless of
		// what's passed here; cwd must still satisfy the guard's workspace check, so
		// forward ctx.workspace through unchanged.
		const result = await toolExecutor.executeById(
			AGENT_START_ID,
			{ agent: req.agent, prompt: req.prompt, mode: req.mode, cwd: req.cwd, model: req.model },
			ctx
		);
		if (!result.ok) {
			throw new Error(result.error ?? result.content ?? 'agent_start failed');
		}
		const data = result.data;
		const remoteRunId = isRecord(data) ? (data.run_id ?? data.id) : undefined;
		if (typeof remoteRunId !== 'string' || !remoteRunId) {
			throw new Error('agent_start did not return a run id');
		}
		return { remote_run_id: remoteRunId };
	},

	async watch(remote_run_id: string, afterEvent: number, waitMs: number) {
		const systemCtx: ExecutionContext = { origin: 'system' };
		const result = await toolExecutor.executeById(
			AGENT_WATCH_ID,
			{ run_id: remote_run_id, after_event: afterEvent, wait_ms: waitMs, until: 'event' },
			systemCtx
		);
		if (!result.ok) {
			// maxRuns eviction (200) makes run_show/agent_watch 404 on an old run —
			// that's an interruption, not a failure of the watch call itself.
			if (isNotFoundError(result.error)) {
				return { status: 'interrupted' as RunStatus, events: [], lastEvent: afterEvent };
			}
			throw new Error(result.error ?? result.content ?? 'agent_watch failed');
		}
		const data = result.data;
		const events: RunEvent[] =
			isRecord(data) && Array.isArray(data.events)
				? data.events
						.filter(isRecord)
						.filter((e) => typeof e.seq === 'number' && typeof e.type === 'string')
						.map((e) => ({ seq: e.seq as number, type: e.type as string, payload: e.payload }))
				: [];
		const lastEvent = isRecord(data) && typeof data.lastEvent === 'number' ? data.lastEvent : afterEvent;
		const status: RunStatus = isRecord(data) && typeof data.status === 'string' ? (data.status as RunStatus) : 'running';
		return { status, events, lastEvent };
	},

	async cancel(remote_run_id: string) {
		const systemCtx: ExecutionContext = { origin: 'system' };
		const result = await toolExecutor.executeById(AGENT_STOP_ID, { run_id: remote_run_id }, systemCtx);
		if (!result.ok && !isNotFoundError(result.error)) {
			throw new Error(result.error ?? result.content ?? 'agent_stop failed');
		}
	}
};
