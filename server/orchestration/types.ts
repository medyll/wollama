// Core contracts for the Wollama tool/MCP orchestration layer.
// See docs/architecture/mcp-client-acp-team-investigation.md for the design rationale.

export type ToolRisk = 'read' | 'write' | 'execute' | 'external';

export interface ToolDescriptor {
	/** Namespaced id, e.g. 'builtin:web-search' | 'mcp:acp-team:agent_start' */
	id: string;
	serverId: string;
	/** Raw remote tool name */
	name: string;
	/** Sanitized name handed to the model, safe for provider function-name constraints */
	wireName: string;
	description?: string;
	inputSchema: Record<string, unknown>;
	outputSchema?: Record<string, unknown>;
	risk: ToolRisk;
}

export interface ExecutionContext {
	chat_id?: string;
	user_id?: string;
	message_id?: string;
	companion_id?: string;
	/** 'system' is for Wollama-internal supervised calls (e.g. run-manager polling
	 *  agent_watch on a run it already started) — never reachable from external input,
	 *  and exempt from the model-facing tool autoApprove allowlist. */
	origin: 'chat' | 'api' | 'system';
	signal?: AbortSignal;
	/** resolved, allowlisted absolute path; required for any acp-team call */
	workspace?: string;
	/** Set internally by tool-executor.ts, after permissionService approves a
	 *  write/execute grant for this exact call — never sourced from model or client
	 *  input. Absent means acp-team.guard.ts keeps forcing `mode: 'plan'`. */
	grantedMode?: 'default' | 'auto';
	/** The acp-team CLI-issued token the user typed into the consent prompt for this
	 *  one call, held only in permission-service's in-memory map — never persisted,
	 *  replicated, or logged. See M6 in the implementation plan. */
	grantedAuthorization?: string;
	/** Incremented by tool-executor.ts on every nested tool call. Wollama's own call
	 *  graph is always a single hop today (model -> toolExecutor -> one MCP server),
	 *  but an HTTP MCP server (M7) could itself be a gateway chaining into other
	 *  servers — this is the cycle breaker for that case, checked before any call. */
	hopCount?: number;
}

export interface ToolResult {
	ok: boolean;
	/** what goes back to the model as the `tool` message content */
	content: string;
	/** structured payload persisted in tool_calls.output */
	data?: Record<string, unknown>;
	error?: string;
	/** set by tool-executor.ts once a tool_calls audit row has been written */
	tool_call_id?: string;
}

export interface ToolRuntime {
	readonly serverId: string;
	list(ctx: ExecutionContext): Promise<ToolDescriptor[]>;
	call(toolId: string, input: unknown, ctx: ExecutionContext): Promise<ToolResult>;
}

export interface ToolCallRequest {
	wireName: string;
	args: Record<string, unknown>;
}

export type ProviderChunk =
	| { kind: 'text'; delta: string; raw: unknown }
	| { kind: 'tool_calls'; calls: ToolCallRequest[]; raw: unknown }
	| { kind: 'done'; raw: unknown };

export interface ProviderTurn {
	stream: AsyncIterable<ProviderChunk>;
}

export interface ProviderChatRequest {
	model: string;
	messages: unknown[];
	tools?: ToolDescriptor[];
	stream: boolean;
}

export interface ProviderAdapter {
	chat(req: ProviderChatRequest): Promise<ProviderTurn>;
	/** builds the assistant + tool messages to append before the next turn */
	buildToolMessages(calls: ToolCallRequest[], results: ToolResult[]): unknown[];
}

export type RunStatus =
	'queued' | 'running' | 'waiting_input' | 'cancelling' | 'completed' | 'failed' | 'cancelled' | 'interrupted' | 'timed_out';

export interface RunEvent {
	seq: number;
	type: string;
	payload: unknown;
}

export interface RunBackend {
	readonly backendId: string;
	/** Starts the remote run and returns its backend-side id. run-manager.ts mints and
	 *  owns the Wollama-side `run_id` — the backend never sees or needs it. */
	start(
		req: { agent: string; prompt: string; mode: 'plan' | 'default' | 'auto'; cwd: string; model?: string },
		ctx: ExecutionContext
	): Promise<{ remote_run_id: string }>;
	watch(
		remote_run_id: string,
		afterEvent: number,
		waitMs: number
	): Promise<{ status: RunStatus; events: RunEvent[]; lastEvent: number }>;
	cancel(remote_run_id: string): Promise<void>;
}

// Typed wire events written to the NDJSON stream alongside ollama chunks,
// under the `{"wollama": <WollamaEvent>}` key. Unmodified clients ignore this key.
export type WollamaEvent =
	| { type: 'tool_call'; tool_call_id: string; tool_id: string; risk: ToolRisk; input: unknown }
	| { type: 'tool_result'; tool_call_id: string; ok: boolean; summary: string; run_id?: string }
	| { type: 'tool_denied'; tool_id: string; reason: string }
	| {
			type: 'permission_request';
			request_id: string;
			tool_id: string;
			risk: ToolRisk;
			input: unknown;
			workspace?: string;
			host?: string;
	  }
	| { type: 'run_started'; run_id: string; backend: string }
	| { type: 'run_event'; run_id: string; seq: number; event_type: string; payload: unknown }
	| { type: 'run_gap'; run_id: string; from_seq: number; to_seq: number }
	| { type: 'run_ended'; run_id: string; status: RunStatus; error?: string };

export interface StreamSink {
	writeChunk(o: unknown): void;
	end(): void;
}
