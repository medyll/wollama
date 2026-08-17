import { listBuiltins } from '../agents/index.js';
import { toWireName } from './tool-catalog.js';
import type { ExecutionContext, ToolDescriptor, ToolResult, ToolRuntime } from './types.js';

export const SERVER_ID = 'builtin';

export const builtinRuntime: ToolRuntime = {
	serverId: SERVER_ID,

	async list(_ctx: ExecutionContext): Promise<ToolDescriptor[]> {
		const builtins = listBuiltins();
		return Object.entries(builtins).map(([slug, tool]) => ({
			id: `${SERVER_ID}:${slug}`,
			serverId: SERVER_ID,
			name: tool.descriptor.name,
			wireName: toWireName(SERVER_ID, tool.descriptor.name),
			description: tool.descriptor.description,
			inputSchema: tool.descriptor.inputSchema,
			risk: tool.descriptor.risk
		}));
	},

	async call(toolId: string, input: unknown, _ctx: ExecutionContext): Promise<ToolResult> {
		const slug = toolId.slice(`${SERVER_ID}:`.length);
		const builtins = listBuiltins();
		const tool = builtins[slug];
		if (!tool) {
			return { ok: false, content: `Unknown builtin tool: ${slug}`, error: 'not_found' };
		}
		try {
			const output = await tool.run((input ?? {}) as Record<string, unknown>);
			return { ok: true, content: JSON.stringify(output), data: output };
		} catch (err: any) {
			const message = err?.message ?? 'Unknown error';
			return { ok: false, content: `Tool error: ${message}`, error: message };
		}
	}
};
