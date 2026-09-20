// Core contracts for the Wollama tool/MCP orchestration layer.
// See docs/architecture/mcp-client-acp-team-investigation.md for the design rationale.

import type { ProviderCapabilities, ProviderFamily, ProviderModel, ProviderType } from '../../shared/types/provider.js';

/**
 * What a tool is allowed to do, from the caller's point of view. Drives the
 * permission prompts: `read` runs unattended, the others need a grant.
 */
export type ToolRisk = 'read' | 'write' | 'execute' | 'external';

/** One callable tool, as advertised by a runtime and offered to the model. */
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

/**
 * Everything a tool call needs to know about who asked for it and under which
 * grants it runs. Threaded from the HTTP layer down through tool-executor.ts.
 */
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

/** Outcome of a single tool call: what the model sees, plus what gets audited. */
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

/**
 * A source of tools — the builtin runtime, or one MCP server. Runtimes are
 * registered by `serverId` and are the only things that actually invoke a tool.
 */
export interface ToolRuntime {
	readonly serverId: string;
	list(ctx: ExecutionContext): Promise<ToolDescriptor[]>;
	call(toolId: string, input: unknown, ctx: ExecutionContext): Promise<ToolResult>;
}

/** A tool invocation as the model emitted it, before resolution to a descriptor. */
export interface ToolCallRequest {
	wireName: string;
	args: Record<string, unknown>;
}

/** One decoded item from a provider's streaming response. */
export type ProviderChunk =
	| { kind: 'text'; delta: string; raw: unknown }
	| { kind: 'tool_calls'; calls: ToolCallRequest[]; raw: unknown }
	| { kind: 'done'; raw: unknown };

/** A single provider round-trip, exposed as a stream of chunks. */
export interface ProviderTurn {
	stream: AsyncIterable<ProviderChunk>;
}

/** Provider-agnostic chat request. Adapters translate it to their own wire format. */
export interface ProviderChatRequest {
	model: string;
	messages: unknown[];
	tools?: ToolDescriptor[];
	stream: boolean;
}

/**
 * The wire half of a provider: turns a chat request into a stream, and knows how
 * to fold tool results back into the message list its API expects.
 */
export interface ProviderAdapter {
	chat(req: ProviderChatRequest): Promise<ProviderTurn>;
	/** builds the assistant + tool messages to append before the next turn */
	buildToolMessages(calls: ToolCallRequest[], results: ToolResult[]): unknown[];
}

/**
 * A registered, addressable LLM backend: a ProviderAdapter plus the identity and
 * metadata the registry, the HTTP surface and the client UI need.
 *
 * `id` is an instance id, not a type name — several instances may share a type
 * (three ollama hosts, two OpenRouter accounts). Today the registry seeds exactly
 * one instance per configured type; runtime-created instances land in P1.
 */
export interface LlmProvider extends ProviderAdapter {
	readonly id: string;
	readonly type: ProviderType;
	readonly family: ProviderFamily;
	/** user-facing name, editable once instances are configurable */
	readonly label: string;
	readonly capabilities: ProviderCapabilities;
	/** health probe; drives /api/health and the availability dot in the UI.
	 *  Must resolve false rather than throw when the backend is unreachable. */
	isAvailable(): Promise<boolean>;
	listModels(): Promise<ProviderModel[]>;
	/** only meaningful when capabilities.embeddings is true */
	embed?(input: string[]): Promise<number[][]>;
}

/** Lifecycle state of an agent run, as reported by run-manager.ts. */
export type RunStatus =
	'queued' | 'running' | 'waiting_input' | 'cancelling' | 'completed' | 'failed' | 'cancelled' | 'interrupted' | 'timed_out';

/** One event emitted by a run, ordered by the monotonic `seq` used to resume watching. */
export interface RunEvent {
	seq: number;
	type: string;
	payload: unknown;
}

/**
 * An external agent runner (today: acp-team) that Wollama starts runs on and
 * polls for events.
 */
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
/** Wollama-specific stream event. See the note above for how it rides the wire. */
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

/** Write side of the NDJSON response stream, so the orchestrator stays HTTP-agnostic. */
export interface StreamSink {
	writeChunk(o: unknown): void;
	end(): void;
}
