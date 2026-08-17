// The ONLY file in this repo that imports the MCP SDK. Every other module talks to
// MCP servers through McpClientHandle. Keeping the SDK import surface here means a
// future transport (see M7) or SDK version change touches one file.
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { logger } from '../utils/logger.js';
import { createSecureFetch } from './http-security.js';

export type McpConnectionConfig =
	| { id: string; transport: 'stdio'; command: string; args: string[]; cwd?: string; env?: Record<string, string> }
	| {
			id: string;
			transport: 'http';
			url: string;
			/** Resolved token value (e.g. from `process.env[tokenEnvVar]`) — never the env
			 *  var name itself; that indirection lives in server/config.ts. */
			bearerToken?: string;
			/** Only true for a local dev server the operator deliberately configured. */
			allowPrivateHost?: boolean;
	  };

export interface McpToolInfo {
	name: string;
	description?: string;
	inputSchema: Record<string, unknown>;
}

export interface McpCallResult {
	isError: boolean;
	text: string;
	structured?: unknown;
}

export interface McpClientHandle {
	readonly id: string;
	listTools(): Promise<McpToolInfo[]>;
	callTool(name: string, args: Record<string, unknown>, opts?: { timeoutMs?: number }): Promise<McpCallResult>;
	close(): Promise<void>;
	onExit(cb: (code: number | null) => void): void;
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Flattens an MCP CallToolResult (content blocks + optional structuredContent) into
 *  the plain shape the rest of Wollama consumes. */
function flattenCallResult(result: unknown): McpCallResult {
	if (!isRecord(result)) return { isError: false, text: String(result ?? '') };
	const content = Array.isArray(result.content) ? result.content : [];
	const text = content
		.filter((c: unknown): c is Record<string, unknown> => isRecord(c) && c.type === 'text' && typeof c.text === 'string')
		.map((c) => c.text as string)
		.join('\n');
	return {
		isError: result.isError === true,
		text,
		structured: 'structuredContent' in result ? result.structuredContent : undefined
	};
}

/** Shared plumbing: wraps a connected `Client` + `Transport` pair into the handle
 *  shape every connection kind (stdio, http) exposes to the rest of Wollama. */
function buildHandle(id: string, client: Client, exitCallbacks: ((code: number | null) => void)[]): McpClientHandle {
	return {
		id,

		async listTools() {
			const { tools } = await client.listTools();
			return tools.map((t: any) => ({
				name: t.name,
				description: t.description,
				inputSchema: t.inputSchema ?? { type: 'object' }
			}));
		},

		async callTool(name, args, opts) {
			const result = await client.callTool({ name, arguments: args }, { timeout: opts?.timeoutMs ?? 30_000 });
			return flattenCallResult(result);
		},

		async close() {
			await client.close();
		},

		onExit(cb) {
			exitCallbacks.push(cb);
		}
	};
}

async function connectStdio(cfg: Extract<McpConnectionConfig, { transport: 'stdio' }>): Promise<McpClientHandle> {
	const client = new Client({ name: `wollama-${cfg.id}`, version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });

	const transport = new StdioClientTransport({
		command: cfg.command,
		args: cfg.args,
		cwd: cfg.cwd,
		env: cfg.env,
		// Never 'inherit' (risks corrupting the JSON-RPC framing on stdout if a
		// library writes to fd 1) and never 'ignore' (hides boot failures). Piped
		// and always drained below.
		stderr: 'pipe'
	});

	const exitCallbacks: ((code: number | null) => void)[] = [];
	transport.onclose = () => {
		for (const cb of exitCallbacks) cb(null);
	};
	transport.onerror = (err) => {
		logger.warn('MCP', `[${cfg.id}] transport error: ${err.message}`);
	};

	await client.connect(transport);

	// Attach the stderr drain only after connect() — StdioClientTransport exposes
	// the PassThrough synchronously once stderr:'pipe' is requested, but draining
	// it here (post-handshake) is enough to prevent the pipe from filling and
	// blocking the child on a slow/chatty server.
	const stderrStream = transport.stderr;
	stderrStream?.on('data', (chunk: Buffer) => {
		const line = chunk.toString('utf8').trim();
		if (line) logger.warn('MCP', `[${cfg.id}] stderr: ${line}`);
	});

	return buildHandle(cfg.id, client, exitCallbacks);
}

async function connectHttp(cfg: Extract<McpConnectionConfig, { transport: 'http' }>): Promise<McpClientHandle> {
	const client = new Client({ name: `wollama-${cfg.id}`, version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });

	const url = new URL(cfg.url);
	const fetchImpl = createSecureFetch({
		allowPrivateHosts: cfg.allowPrivateHost ? [url.hostname] : []
	});

	const transport = new StreamableHTTPClientTransport(url, {
		fetch: fetchImpl,
		authProvider: cfg.bearerToken ? { token: async () => cfg.bearerToken } : undefined,
		// No onUnauthorized: a 401 throws UnauthorizedError once, not an infinite retry.
		reconnectionOptions: {
			maxReconnectionDelay: 30_000,
			initialReconnectionDelay: 1_000,
			reconnectionDelayGrowFactor: 1.5,
			maxRetries: 2
		}
	});

	const exitCallbacks: ((code: number | null) => void)[] = [];
	transport.onclose = () => {
		for (const cb of exitCallbacks) cb(null);
	};
	transport.onerror = (err) => {
		logger.warn('MCP', `[${cfg.id}] transport error: ${err.message}`);
	};

	await client.connect(transport);

	return buildHandle(cfg.id, client, exitCallbacks);
}

export async function connectMcp(cfg: McpConnectionConfig): Promise<McpClientHandle> {
	if (cfg.transport === 'stdio') return connectStdio(cfg);
	return connectHttp(cfg);
}
