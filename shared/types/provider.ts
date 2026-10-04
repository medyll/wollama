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
export type ProviderType = 'ollama' | 'anthropic' | 'openai-compatible' | 'codex' | 'claude' | 'kimi' | 'opencode';

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

/** Persist a provider/model pair in the existing model field without changing stored chats. */
const MODEL_PREFIX = 'wollama:provider:';
export function providerModelKey(providerId: string, model: string): string {
	return providerId === DEFAULT_PROVIDER_ID
		? model
		: `${MODEL_PREFIX}${encodeURIComponent(providerId)}/${encodeURIComponent(model)}`;
}

export function resolveProviderModel(value: string): { providerId: string; model: string } {
	if (!value.startsWith(MODEL_PREFIX)) return { providerId: DEFAULT_PROVIDER_ID, model: value };
	const parts = value.slice(MODEL_PREFIX.length).split('/');
	if (parts.length !== 2 || !parts[0] || !parts[1]) throw new Error('Invalid provider model selection');
	return { providerId: decodeURIComponent(parts[0]), model: decodeURIComponent(parts[1]) };
}

export function providerModelLabel(value: string): string {
	const { providerId, model } = resolveProviderModel(value);
	const labels: Record<string, string> = { codex: 'Codex', claude: 'Claude', kimi: 'Kimi' };
	return providerId === DEFAULT_PROVIDER_ID ? model : `${labels[providerId] || providerId} · ${model}`;
}
