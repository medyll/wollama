#!/usr/bin/env node
// Minimal MCP stdio fixture for mcp-client.test.ts. Writes nothing to stdout except
// JSON-RPC — any accidental console.log here would corrupt the framing and the test
// would see it as a parse error, so use stderr for anything diagnostic.
import { McpServer, fromJsonSchema } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';

const server = new McpServer({ name: 'echo-fixture', version: '1.0.0' });

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
	async ({ text }) => ({
		content: [{ type: 'text', text }],
		structuredContent: { text }
	})
);

server.registerTool(
	'slow',
	{
		description: 'Waits `ms` milliseconds then responds.',
		inputSchema: fromJsonSchema({
			type: 'object',
			properties: { ms: { type: 'number' } },
			required: ['ms']
		})
	},
	async ({ ms }) => {
		await new Promise((resolve) => setTimeout(resolve, ms));
		return { content: [{ type: 'text', text: `waited ${ms}ms` }] };
	}
);

await server.connect(new StdioServerTransport());
