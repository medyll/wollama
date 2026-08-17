import { describe, expect, it, afterEach } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectMcp, type McpClientHandle } from './mcp-client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(__dirname, '__fixtures__', 'echo-mcp-server.mjs');

describe('mcp-client (stdio, real child process)', () => {
	let handle: McpClientHandle | undefined;

	afterEach(async () => {
		await handle?.close();
		handle = undefined;
	});

	it('lists tools and calls one over real stdio, then closes the child cleanly', async () => {
		handle = await connectMcp({
			id: 'echo-fixture',
			transport: 'stdio',
			command: process.execPath,
			args: [FIXTURE]
		});

		const tools = await handle.listTools();
		const echo = tools.find((t) => t.name === 'echo');
		expect(echo).toBeTruthy();
		expect(echo?.inputSchema).toMatchObject({
			type: 'object',
			properties: { text: { type: 'string' } }
		});

		const result = await handle.callTool('echo', { text: 'hi' });
		expect(result.isError).toBe(false);
		expect(result.text).toBe('hi');
		expect(result.structured).toEqual({ text: 'hi' });

		let exited = false;
		handle.onExit(() => {
			exited = true;
		});
		await handle.close();
		// onclose fires synchronously with the transport teardown.
		expect(exited).toBe(true);
	}, 20_000);

	it('propagates a tool error via isError instead of throwing', async () => {
		handle = await connectMcp({
			id: 'echo-fixture-2',
			transport: 'stdio',
			command: process.execPath,
			args: [FIXTURE]
		});

		// Missing required 'text' arg — the server's own input validation should
		// reject this and report it as a tool error, not a transport failure.
		const result = await handle.callTool('echo', {});
		expect(result.isError).toBe(true);
	}, 20_000);
});
