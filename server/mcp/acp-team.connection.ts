import { config } from '../config.js';
import { connectionManager } from './connection-manager.js';
import { createMcpRuntime } from './mcp.runtime.js';
import { ACP_TEAM_RISK_MAP } from './acp-team.risk.js';
import { acpTeamBackend } from './acp-team.backend.js';
import { toolCatalog } from '../orchestration/tool-catalog.js';
import { registerRunBackend } from '../orchestration/run-manager.js';
import { logger } from '../utils/logger.js';
import { ACP_TEAM_SERVER_ID } from './acp-team.constants.js';

export { ACP_TEAM_SERVER_ID };

/** Registers the acp-team MCP connection config + ToolRuntime when enabled. Does not
 *  connect eagerly — connection-manager connects lazily on first getConnection(). */
export function registerAcpTeam(): void {
	if (!config.mcp.acpTeam.enabled) return;
	if (!config.mcp.acpTeam.entry) {
		logger.warn('MCP', 'ACP_TEAM_ENABLED=1 but ACP_TEAM_ENTRY is not set — skipping acp-team registration');
		return;
	}

	// No `env` override → the stdio transport falls back to its own reduced
	// DEFAULT_INHERITED_ENV_VARS set (PATH, SystemRoot, TEMP, APPDATA, etc. — enough
	// for a Node child on Windows without leaking Wollama's full environment). We
	// only need to add AGENT_BRIDGE_DATA_DIR on top of that, which means building the
	// reduced set explicitly here instead of leaving it undefined.
	const baseEnv: Record<string, string> = {};
	for (const key of ['PATH', 'SYSTEMROOT', 'TEMP', 'TMP', 'APPDATA', 'LOCALAPPDATA', 'USERPROFILE', 'HOMEDRIVE', 'HOMEPATH']) {
		const v = process.env[key];
		if (v) baseEnv[key] = v;
	}
	if (config.mcp.acpTeam.dataDir) baseEnv.AGENT_BRIDGE_DATA_DIR = config.mcp.acpTeam.dataDir;

	connectionManager.configure({
		id: ACP_TEAM_SERVER_ID,
		transport: 'stdio',
		// Never spawn `npx` — on Windows the resolvable binary is npx.cmd, which
		// requires shell:true and inherits its quoting bugs. Spawn node directly
		// against acp-team's known entry file instead.
		command: process.execPath,
		args: [config.mcp.acpTeam.entry],
		env: baseEnv
	});

	toolCatalog.register(createMcpRuntime(ACP_TEAM_SERVER_ID, ACP_TEAM_RISK_MAP));
	registerRunBackend(acpTeamBackend);
}
