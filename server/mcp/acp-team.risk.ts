import type { RiskMap } from './mcp.runtime.js';

// Static risk classification for acp-team's tools. Unmapped tools default to
// 'execute' (fail closed) inside createMcpRuntime — a newly added acp-team tool is
// never silently treated as safe.
export const ACP_TEAM_RISK_MAP: RiskMap = {
	// Inspection — safe to auto-approve.
	agent_list: 'read',
	agent_status: 'read',
	run_history: 'read',
	run_show: 'read',
	usage_status: 'read',
	usage_report: 'read',
	ollama_models: 'read',
	ollama_running: 'read',
	ollama_model_show: 'read',
	system_doctor: 'read',
	model_ratings: 'read',
	model_rate: 'read',
	model_recommend: 'read',
	budget_check: 'read',
	config_inspect: 'read',

	// Delegation — runs an agent. Gated (mode forced to 'plan' until M6).
	agent_start: 'execute',
	agent_ask: 'execute',
	agent_fanout: 'execute',
	agent_cancel: 'execute',
	agent_stop: 'execute',
	agent_watch: 'execute',
	run_retry: 'execute',

	// Mutates local config/state or pulls models — closed until M6's write-mode flow.
	config_apply: 'write',
	config_stage: 'write',
	config_rollback: 'write',
	ollama_pull: 'write',
	usage_sync: 'write',
	usage_compact: 'write'
};
