import { connectionManager } from './connection-manager.js';
import { toWireName } from '../orchestration/tool-catalog.js';
import type { ExecutionContext, ToolDescriptor, ToolResult, ToolRisk, ToolRuntime } from '../orchestration/types.js';

export type RiskMap = Record<string, ToolRisk>;

/** A generic ToolRuntime backed by one MCP connection. Risk is resolved via an
 *  optional per-server static map; unmapped tools default to 'execute' (fail closed). */
export function createMcpRuntime(serverId: string, riskMap: RiskMap = {}): ToolRuntime {
	return {
		serverId,

		async list(_ctx: ExecutionContext): Promise<ToolDescriptor[]> {
			const conn = await connectionManager.getConnection(serverId);
			if (!conn) return [];
			const tools = await conn.listTools();
			return tools.map((t) => ({
				id: `mcp:${serverId}:${t.name}`,
				serverId,
				name: t.name,
				wireName: toWireName(serverId, t.name),
				description: t.description,
				inputSchema: t.inputSchema,
				risk: riskMap[t.name] ?? 'execute'
			}));
		},

		async call(toolId: string, input: unknown, _ctx: ExecutionContext): Promise<ToolResult> {
			const conn = await connectionManager.getConnection(serverId);
			if (!conn) {
				return { ok: false, content: `MCP server ${serverId} is not connected`, error: 'not_connected' };
			}
			const name = toolId.slice(`mcp:${serverId}:`.length);
			try {
				const result = await conn.callTool(name, (input ?? {}) as Record<string, unknown>);
				if (result.isError) {
					return { ok: false, content: result.text || `Tool ${name} returned an error`, error: result.text };
				}
				return { ok: true, content: result.text, data: isRecord(result.structured) ? result.structured : undefined };
			} catch (err: any) {
				const message = err?.message ?? 'Unknown error';
				return { ok: false, content: `Tool error: ${message}`, error: message };
			}
		}
	};
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}
