// Provider-agnostic LLM contracts, shared by the server (which implements them)
// and the client (which drives the UI from `capabilities`).
// Design rationale: ARCH-PROVIDERS.md.

/**
 * `http`  — stateless completion API. Wollama owns the conversation and replays
 *           the full message history on every turn (ollama, anthropic, openai-compatible).
 * `agent` — session-based coding agent. The agent owns the conversation, its own
 *           tool loop and a working directory; Wollama sends prompts into a session
 *           and consumes events (codex, opencode).
 */
export type ProviderFamily = 'http' | 'agent';

/** Adapters shipped in the code. Closed set — user-created configurations are
 *  instances of one of these types, not new types. */
export type ProviderType = 'ollama' | 'anthropic' | 'openai-compatible' | 'codex' | 'opencode';

/** What a provider supports. Read by the client to decide which UI affordances to show. */
export interface ProviderCapabilities {
	streaming: boolean;
	/** provider can consume tool descriptors and emit tool calls */
	tools: boolean;
	/** provider can serve /api/rag embeddings */
	embeddings: boolean;
	/** pull / show / delete a model */
	modelManagement: boolean;
	vision: boolean;
	/** false when the provider owns its own system prompt (agent family) */
	systemPrompt: boolean;
	/** turns belong to a provider-side session whose id must be persisted */
	sessions: boolean;
	/** the provider can read and write the host filesystem */
	filesystemAccess: boolean;
	requiresApiKey: boolean;
	/** external binary the provider shells out to, e.g. 'codex' */
	requiresBinary?: string;
}

/** One model offered by a provider. */
export interface ProviderModel {
	/** provider-scoped model id, e.g. 'mistral:latest' | 'anthropic/claude-opus-5' */
	id: string;
	label: string;
	providerId: string;
	contextWindow?: number;
	/** the provider's own model record, passed through untouched for consumers
	 *  that already depend on its shape (the model picker reads ollama's fields) */
	raw?: unknown;
}

/** What `GET /api/providers` returns: never a secret, only whether one is set. */
export interface ProviderSummary {
	id: string;
	type: ProviderType;
	label: string;
	family: ProviderFamily;
	enabled: boolean;
	available: boolean;
	capabilities: ProviderCapabilities;
	hasApiKey: boolean;
}

/** Capability set with everything off — spread over it so a new capability added
 *  here defaults to unsupported rather than silently claiming support. */
export const NO_CAPABILITIES: ProviderCapabilities = {
	streaming: false,
	tools: false,
	embeddings: false,
	modelManagement: false,
	vision: false,
	systemPrompt: false,
	sessions: false,
	filesystemAccess: false,
	requiresApiKey: false
};

/** Provider used when nothing else is configured or selected. */
export const DEFAULT_PROVIDER_ID = 'ollama';
