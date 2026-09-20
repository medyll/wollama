/** Which built-in agent implementation backs an agent record. */
export type AgentType = 'web_search' | 'page_fetch' | 'file_reader' | 'custom';
/** Lifecycle state of a single tool call. */
export type ToolCallStatus = 'pending' | 'running' | 'done' | 'error';

/** A configured agent. `config` holds the type-specific settings. */
export interface Agent {
	agent_id: string;
	name: string;
	description: string;
	type: AgentType;
	config: Record<string, unknown>;
	is_enabled: boolean;
	created_at: string;
	updated_at: string;
}

/** Audit row for one tool call: its inputs, its outcome, and how long it took. */
export interface ToolCall {
	tool_call_id: string;
	message_id: string;
	agent_id: string;
	skill_id?: string;
	status: ToolCallStatus;
	input: Record<string, unknown>;
	output?: Record<string, unknown>;
	error?: string;
	started_at: string;
	finished_at?: string;
}
