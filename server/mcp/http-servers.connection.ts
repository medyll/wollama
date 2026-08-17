import { config } from '../config.js';
import { connectionManager } from './connection-manager.js';
import { createMcpRuntime } from './mcp.runtime.js';
import { toolCatalog } from '../orchestration/tool-catalog.js';
import { logger } from '../utils/logger.js';

/** Registers every Streamable HTTP MCP server declared in `config.mcp.servers[]`
 *  (M7). Credentials are resolved from the named env var here — the token itself
 *  never lives in server/config.ts's parsed object. */
export function registerHttpServers(): void {
	for (const server of config.mcp.servers) {
		const bearerToken = server.tokenEnvVar ? process.env[server.tokenEnvVar] : undefined;
		if (server.tokenEnvVar && !bearerToken) {
			logger.warn(
				'MCP',
				`[${server.id}] tokenEnvVar '${server.tokenEnvVar}' is set but the env var is empty — connecting without auth`
			);
		}

		connectionManager.configure({
			id: server.id,
			transport: 'http',
			url: server.url,
			bearerToken,
			allowPrivateHost: server.allowPrivateHost
		});

		// No pre-known risk map for third-party servers — createMcpRuntime defaults
		// every unmapped tool to 'execute' (fail closed).
		toolCatalog.register(createMcpRuntime(server.id));
	}
}

/** The target host for a configured HTTP MCP server — shown in the consent prompt so
 *  a user approving an 'external' tool call can see where the request actually goes. */
export function getHttpServerHost(serverId: string): string | undefined {
	const server = config.mcp.servers.find((s) => s.id === serverId);
	if (!server) return undefined;
	try {
		return new URL(server.url).hostname;
	} catch {
		return undefined;
	}
}
