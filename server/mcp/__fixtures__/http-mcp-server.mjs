// Minimal MCP-over-Streamable-HTTP fixture server for mcp-client.http.test.ts.
import { createMcpHandler, McpServer, fromJsonSchema } from '@modelcontextprotocol/server';
import { toNodeHandler } from '@modelcontextprotocol/node';
import http from 'http';

function buildServer() {
	const server = new McpServer({ name: 'http-echo-fixture', version: '1.0.0' });
	server.registerTool(
		'echo',
		{
			description: 'Echoes the given text back.',
			inputSchema: fromJsonSchema({
				type: 'object',
				properties: { text: { type: 'string' } },
				required: ['text']
			})
		},
		async ({ text }) => ({ content: [{ type: 'text', text }], structuredContent: { text } })
	);
	return server;
}

/** Starts a plain http.Server serving the fixture MCP handler. Returns
 *  { server, port, close }. If `behavior` is provided, it can override request
 *  handling for specific test scenarios (401, redirect are tested separately at the
 *  http-security layer, not here). */
export function startHttpMcpServer({ bearerToken } = {}) {
	const handler = createMcpHandler(() => buildServer(), { legacy: 'stateless' });
	const nodeHandler = toNodeHandler(handler);
	const authorizationHeaders = [];
	let tokenRevoked = false;
	const server = http.createServer((req, res) => {
		authorizationHeaders.push(req.headers.authorization);
		if (bearerToken && (tokenRevoked || req.headers.authorization !== `Bearer ${bearerToken}`)) {
			res.writeHead(401, { 'WWW-Authenticate': 'Bearer' });
			res.end();
			return;
		}
		nodeHandler(req, res);
	});
	return new Promise((resolve) => {
		server.listen(0, '127.0.0.1', () => {
			const address = server.address();
			resolve({
				server,
				port: address.port,
				authorizationHeaders,
				revokeToken: () => {
					tokenRevoked = true;
				},
				close: () => new Promise((r) => server.close(() => r()))
			});
		});
	});
}

/** A server that always answers 401 — for the "no infinite retry" test. */
export function startUnauthorizedServer() {
	const authorizationHeaders = [];
	const server = http.createServer((req, res) => {
		authorizationHeaders.push(req.headers.authorization);
		res.writeHead(401, { 'WWW-Authenticate': 'Bearer' });
		res.end();
	});
	return new Promise((resolve) => {
		server.listen(0, '127.0.0.1', () => {
			const address = server.address();
			resolve({
				server,
				port: address.port,
				authorizationHeaders,
				revokeToken: () => undefined,
				close: () => new Promise((r) => server.close(() => r()))
			});
		});
	});
}
