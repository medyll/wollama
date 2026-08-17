import { describe, expect, it, afterEach } from 'vitest';
// @ts-expect-error — plain .mjs fixture, no type declarations
import { startHttpMcpServer, startUnauthorizedServer } from './__fixtures__/http-mcp-server.mjs';
import { connectMcp, type McpClientHandle } from './mcp-client.js';

interface FixtureServer {
	server: import('http').Server;
	port: number;
	close: () => Promise<void>;
	authorizationHeaders: Array<string | undefined>;
	revokeToken: () => void;
}

let handle: McpClientHandle | undefined;
let fixture: FixtureServer | undefined;

afterEach(async () => {
	await handle?.close();
	handle = undefined;
	await fixture?.close();
	fixture = undefined;
});

describe('mcp-client (Streamable HTTP)', () => {
	it('authenticates with the configured bearer token', async () => {
		fixture = (await startHttpMcpServer({ bearerToken: 'valid-token' })) as FixtureServer;
		handle = await connectMcp({
			id: 'http-fixture-auth',
			transport: 'http',
			url: `http://127.0.0.1:${fixture.port}/`,
			allowPrivateHost: true,
			bearerToken: 'valid-token'
		});

		await handle.listTools();
		expect(fixture.authorizationHeaders).toContain('Bearer valid-token');
	}, 20_000);

	it('fails the next request after the server revokes an established bearer token', async () => {
		fixture = (await startHttpMcpServer({ bearerToken: 'valid-token' })) as FixtureServer;
		handle = await connectMcp({
			id: 'http-fixture-live-revocation',
			transport: 'http',
			url: `http://127.0.0.1:${fixture.port}/`,
			allowPrivateHost: true,
			bearerToken: 'valid-token'
		});
		await handle.listTools();

		fixture.revokeToken();

		await expect(handle.listTools()).rejects.toThrow();
	}, 20_000);

	it('lists tools and calls one over a real HTTP MCP server', async () => {
		fixture = (await startHttpMcpServer()) as FixtureServer;
		handle = await connectMcp({
			id: 'http-fixture',
			transport: 'http',
			url: `http://127.0.0.1:${fixture.port}/`,
			allowPrivateHost: true
		});

		const tools = await handle.listTools();
		expect(tools.find((t) => t.name === 'echo')).toBeTruthy();

		const result = await handle.callTool('echo', { text: 'hi' });
		expect(result.isError).toBe(false);
		expect(result.text).toBe('hi');
		expect(result.structured).toEqual({ text: 'hi' });
	}, 20_000);

	it('blocks a Streamable HTTP connection to a private host that is not explicitly allowlisted', async () => {
		fixture = (await startHttpMcpServer()) as FixtureServer;
		await expect(
			connectMcp({
				id: 'http-fixture-denied',
				transport: 'http',
				url: `http://127.0.0.1:${fixture.port}/`
				// allowPrivateHost intentionally omitted
			})
		).rejects.toThrow(/private|local/i);
	}, 20_000);

	it('treats a revoked bearer token as a bounded 401 without retrying forever', async () => {
		fixture = (await startUnauthorizedServer()) as FixtureServer;
		const start = Date.now();
		await expect(
			connectMcp({
				id: 'http-fixture-401',
				transport: 'http',
				url: `http://127.0.0.1:${fixture.port}/`,
				allowPrivateHost: true,
				bearerToken: 'revoked-token'
			})
		).rejects.toThrow();
		expect(fixture.authorizationHeaders).toContain('Bearer revoked-token');
		// A bounded failure, not a silent hang — well under the SDK's own
		// connection-attempt ceiling.
		expect(Date.now() - start).toBeLessThan(15_000);
	}, 20_000);
});
