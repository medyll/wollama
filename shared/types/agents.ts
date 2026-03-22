export type AgentType = 'web_search' | 'page_fetch' | 'file_reader' | 'custom';
export type ToolCallStatus = 'pending' | 'running' | 'done' | 'error';

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

export interface AgentRunRequest {
	agent_id: string;
	skill_id?: string;
	message_id: string;
	input: Record<string, unknown>;
}

export interface AgentRunResult {
	tool_call_id: string;
	output: Record<string, unknown>;
	error?: string;
}
