export type HookEvent =
	| 'pre-send'
	| 'post-receive'
	| 'on-session-start'
	| 'on-session-end'
	| 'on-tool-result';

export type HookHandlerType = 'builtin' | 'llm' | 'skill';
export type HookScope = 'global' | 'user' | 'companion';

export interface HookLogEntry {
	hook_id: string;
	event: HookEvent;
	duration_ms: number;
	mutated: boolean;
	error?: string;
}

export interface MessageDraft {
	content: string;
	role: 'user' | 'assistant' | 'tool' | 'system';
	skill_invoked?: string;
	images?: { name: string; type: string; dataUri: string; base64: string }[];
}

export interface HookContext {
	event: HookEvent;
	chat_id: string;
	user_id: string;
	companion_id?: string;
	message: MessageDraft;
	session_metadata: Record<string, unknown>;
	hook_log: HookLogEntry[];
}

export type HookHandler = (ctx: HookContext) => Promise<HookContext>;

export interface Hook {
	hook_id: string;
	name: string;
	event: HookEvent;
	handler_type: HookHandlerType;
	handler_ref: string;
	priority: number;
	scope: HookScope;
	scope_id?: string;
	is_enabled: boolean;
	config: Record<string, unknown>;
	created_at: string;
	updated_at: string;
}
