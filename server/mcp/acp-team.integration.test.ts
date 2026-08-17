import { describe, expect, it } from 'vitest';
import { connectMcp } from './mcp-client.js';

// Proves M3 against the real acp-team server: run with
//   ACP_TEAM_ENTRY=D:/development/acp-team/src/mcp-server.js pnpm vitest run mcp/acp-team.integration
// Skipped by default so CI (and any machine without a local acp-team checkout) stays
// green without it.
const entry = process.env.ACP_TEAM_ENTRY;

describe.skipIf(!entry)('acp-team (real MCP server, requires ACP_TEAM_ENTRY)', () => {
	it('agent_list returns a non-empty array of {id, description, modes}', async () => {
		const handle = await connectMcp({
			id: 'acp-team',
			transport: 'stdio',
			command: process.execPath,
			args: [entry as string]
		});
		try {
			const tools = await handle.listTools();
			expect(tools.find((t) => t.name === 'agent_list')).toBeTruthy();

			const result = await handle.callTool('agent_list', {});
			expect(result.isError).toBe(false);
			const parsed = JSON.parse(result.text);
			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed.length).toBeGreaterThan(0);
			for (const agent of parsed) {
				expect(agent).toHaveProperty('id');
				expect(agent).toHaveProperty('description');
				expect(agent).toHaveProperty('modes');
			}
		} finally {
			await handle.close();
		}
	}, 30_000);
});
