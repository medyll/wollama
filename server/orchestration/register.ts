import { toolCatalog } from './tool-catalog.js';
import { builtinRuntime } from './builtin.runtime.js';
import { registerAcpTeam } from '../mcp/acp-team.connection.js';
import { registerHttpServers } from '../mcp/http-servers.connection.js';

/** Registers the always-on built-in ToolRuntime, plus any MCP server enabled via
 *  config/env: acp-team (stdio) and any Streamable HTTP servers in
 *  config.mcp.servers[] (M7). */
export function registerBuiltinRuntimes(): void {
	toolCatalog.register(builtinRuntime);
	registerAcpTeam();
	registerHttpServers();
}
