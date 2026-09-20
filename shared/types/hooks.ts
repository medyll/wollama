/** Point in the message lifecycle at which hooks run. */
export type HookEvent = 'pre-send' | 'post-receive' | 'on-session-start' | 'on-session-end' | 'on-tool-result';

/** How a hook's `handler_ref` is resolved: an in-process function, an LLM call, or a skill. */
export type HookHandlerType = 'builtin' | 'llm' | 'skill';
/** How widely a hook applies. `user` and `companion` narrow it via `scope_id`. */
export type HookScope = 'global' | 'user' | 'companion';

/** Record of one hook execution, appended to the context so later hooks can see it. */
export interface HookLogEntry {
	hook_id: string;
	event: HookEvent;
	duration_ms: number;
	mutated: boolean;
	error?: string;
}

/** The message being built, which hooks may read and rewrite. */
export interface MessageDraft {
	content: string;
	role: 'user' | 'assistant' | 'tool' | 'system';
	skill_invoked?: string;
	images?: { name: string; type: string; dataUri: string; base64: string }[];
}

/** State passed through the hook pipeline. Each handler returns the next context. */
export interface HookContext {
	event: HookEvent;
	chat_id: string;
	user_id: string;
	companion_id?: string;
	message: MessageDraft;
	session_metadata: Record<string, unknown>;
	hook_log: HookLogEntry[];
}

/** A hook implementation: takes the context, returns the (possibly mutated) context. */
export type HookHandler = (ctx: HookContext) => Promise<HookContext>;

/** A registered hook as persisted. `priority` orders handlers within one event. */
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
