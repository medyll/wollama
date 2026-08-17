import { toolExecutor } from '../orchestration/tool-executor.js';
import { dbManager } from '../db/database.js';
import type { ToolCall } from '../../shared/types/agents.js';

export interface AgentRunRequest {
	slug: string;
	input: Record<string, unknown>;
	message_id?: string;
	agent_id?: string;
}

export interface AgentRunResponse {
	tool_call_id: string;
	status: 'running' | 'done' | 'error';
	output?: Record<string, unknown>;
	error?: string;
}

/**
 * Thin wrapper over toolExecutor — all persistence (tool_calls writes) and dispatch
 * now live there, so builtin agents share one execution path with MCP tools instead
 * of a parallel one. See docs/architecture/mcp-client-acp-team-investigation.md.
 */
export class AgentRunnerService {
	static async run(req: AgentRunRequest): Promise<AgentRunResponse> {
		const { slug } = req;

		const result = await toolExecutor.executeById(`builtin:${slug}`, req.input, {
			origin: 'api',
			message_id: req.message_id
		});

		if (!result.ok) {
			return { tool_call_id: result.tool_call_id ?? '', status: 'error', error: result.error ?? result.content };
		}
		return { tool_call_id: result.tool_call_id ?? '', status: 'done', output: result.data };
	}

	static async getStatus(tool_call_id: string): Promise<ToolCall | null> {
		const db = dbManager.getDb('tool_calls');
		try {
			const doc: any = await db.get(tool_call_id);
			return doc as ToolCall;
		} catch (e: any) {
			if (e.status === 404) return null;
			throw e;
		}
	}
}

export default AgentRunnerService;
