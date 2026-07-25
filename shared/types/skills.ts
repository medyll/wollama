export type HandlerType = 'builtin' | 'llm' | 'agent';
export type ScopeType = 'global' | 'user' | 'companion';

export interface Skill {
	skill_id: string;
	name: string; // slug: "translate"
	display_name: string;
	description: string;
	command: string; // "/translate"
	icon: string;
	input_schema: Record<string, unknown>; // JSON Schema for args
	handler_type: HandlerType;
	handler_ref: string; // builtin fn name or agent_id
	scope: ScopeType;
	is_enabled: boolean;
	created_at: string;
	updated_at: string;
}

export interface SkillInvocation {
	skill: Skill;
	args: string[]; // tokens after /command
	chat_id: string;
	message_id: string;
	user_id: string;
}

export interface SkillResult {
	skill_id: string;
	output: string;
	metadata?: Record<string, unknown>;
	error?: string;
}

/** Parsed slash command from raw input */
export interface ParsedSlashCommand {
	slug: string; // "translate"
	command: string; // "/translate"
	args: string[]; // ["fr", "hello"]
	raw_args: string; // "fr hello"
}
