# Wollama Multi-Provider Architecture (design)

> Status: **proposal**, nothing implemented. Written 2026-08-21 against commit `1192f8f`.
> Goal: extend Wollama beyond Ollama to Codex CLI, opencode, the Anthropic API, and any OpenAI-compatible endpoint (OpenRouter, LM Studio, vLLM, …) configurable at runtime from the settings panel.
> `ARCH.md` describes the current (Ollama-only) system; this document describes the target and the migration.

---

## 1. Current state (verified)

Wollama is hard-wired to Ollama. There is no provider abstraction anywhere in the repo, and no prior design work on one — no doc, no story, no branch, no TODO entry.

| Fact | Evidence |
| --- | --- |
| Single LLM backend, no interface | `server/services/ollama.service.ts` is a 70-line pass-through over the `ollama` npm client |
| Chat endpoint calls Ollama directly | `server/server.ts:263` and `:297` (`OllamaService.chat`), streaming written as NDJSON |
| Model management is Ollama-shaped | `/api/models` → `OllamaService.list()`, `/api/models/pull` → `OllamaService.pull()` (`server/server.ts:323`, `:333`) |
| Bootstrap pulls a default model | `server/server.ts:488`–`:498` |
| RAG embeddings via Ollama | `server/services/rag/embed.ts` → `OllamaService.embed()` |
| Config assumes one host | `server/config.ts` → `config.ollama.{host,defaultModel}` |
| Schema stores a bare model string | `shared/db/database-scheme.ts` — `model: string` on `companions`, `user_companions`, `chats`, `messages`; `default_model` on `user_preferences` |
| Client sends the model name only | `client/src/lib/services/chat.service.ts:234` |
| ~30 client/server files reference Ollama | incl. `ChatWindow.svelte`, `CompanionEditor.svelte`, `OnboardingWizard.svelte`, `ServerConnectionCheck.svelte`, `user.svelte.ts` |

Only pre-existing "provider" notions in the repo are unrelated: STT/TTS `provider: 'openai' \| 'local'` (`server/config.ts`) and the web-search provider in `bmad/artifacts/stories/S4-01.md`.

---

## 2. The core problem: two provider families

Ollama, Anthropic, Codex and opencode are not four instances of one shape. They split into two families with different lifecycles, and pretending otherwise is the main design risk.

### Family A — `http` (stateless completion API)

Wollama owns the conversation. Full message history is sent on every turn; the provider returns tokens.

- **ollama** — local HTTP, no key, free, model management (`pull`/`list`/`show`/`delete`) available.
- **anthropic** — remote HTTPS, **API key required, metered per token**, no model management, no local models.
- **openai-compatible** — one generic adapter driven by `{ baseUrl, apiKey, headers }`, covering OpenRouter, LM Studio, vLLM, llama.cpp, Groq, Together, Mistral, DeepSeek, an OpenAI account, or Ollama's own `/v1` shim. **This is where the config panel earns its keep**: the user adds endpoints at runtime, no release needed.

### Family B — `agent` (session-based coding agent)

The agent owns the conversation, the tool loop, the sandbox and the working directory. Wollama sends a prompt into a **session** and consumes an **event stream**. History replay is not our job — resumption is done by session id.

- **codex** — `codex exec` CLI. Billed against the user's existing ChatGPT plan (the cost argument).
- **opencode** — `opencode run` CLI *or* `opencode serve` HTTP server. Provider-agnostic itself; billing depends on whichever provider the user configured inside opencode.

Consequences of Family B that Wollama does not currently handle:

1. **Tool calls happen inside the agent.** Wollama's `agent-runner.service.ts`, `hook-pipeline`, skills and `tool_calls` collection duplicate machinery the agent already has. For agent providers, Wollama's server-side agents/skills must be *disabled*, not merged — otherwise two tool loops fight.
2. **The agent has a working directory and can write files.** Ollama chat cannot. This is a security boundary, not a feature flag (see §7).
3. **Events are not tokens.** `item.started/updated/completed`, tool invocations, diffs, reasoning. The client currently renders only `message.content` deltas.
4. **Session state lives outside RxDB.** A chat that continues an agent session needs the external session id persisted next to it.

---

## 3. Target architecture

```text
settings panel ──► /api/providers (CRUD)
                          │
                          ▼
              provider-config.service.ts
              ├─ instances.json  (server-side, redacted over HTTP)
              └─ secrets store   (API keys, never leaves the server)
                          │
POST /api/chat/generate  { providerId, model, messages, ... }
        │                 │
        ▼                 ▼
ProviderRegistry (server/services/providers/index.ts)
   resolves providerId → instance config → adapter
        │
        ├─ http family ──────────────────────────────────────────┐
        │   ollama.provider.ts             → ollama npm client   │
        │   anthropic.provider.ts          → @anthropic-ai/sdk   │
        │   openai-compatible.provider.ts  → openai npm client   │
        │        └─ N instances: OpenRouter, LM Studio, vLLM…    │
        │                                                        │
        └─ agent family ─────────────────────────────────────────┤
            codex.provider.ts     → spawn `codex exec --json`     
            opencode.provider.ts  → `opencode serve` + @opencode-ai/sdk
                                                                 │
                                                                 ▼
                              normalized event stream (NDJSON, unchanged wire shape)
```

`OllamaService` stops being the chat entry point and becomes one implementation behind the registry. It stays as-is for Ollama-only concerns (`pull`, `show`, `ps`, `embed`).

### 3.1 Provider contract

New file: `shared/types/provider.ts` (shared, because the client needs `capabilities` to drive the UI).

```ts
export type ProviderFamily = 'http' | 'agent';

export interface ProviderCapabilities {
	streaming: boolean;
	tools: boolean;          // provider runs its own tool loop
	embeddings: boolean;     // can serve /api/rag
	modelManagement: boolean;// pull / delete / show
	vision: boolean;
	systemPrompt: boolean;   // false for agents that own their own system prompt
	sessions: boolean;       // requires session id persistence
	filesystemAccess: boolean; // agent can read/write the host FS
	requiresApiKey: boolean;
	requiresBinary?: string; // e.g. 'codex', 'opencode'
}

export interface ProviderModel {
	id: string;              // 'mistral:latest', 'claude-opus-5', 'gpt-5.1-codex'
	label: string;
	providerId: string;
	contextWindow?: number;
}

export interface ChatChunk {
	type: 'text' | 'reasoning' | 'tool' | 'usage' | 'done' | 'error';
	content?: string;
	toolName?: string;
	usage?: { input: number; output: number };
	sessionId?: string;      // agent family: echo back to persist
	raw?: unknown;
}

export interface LlmProvider {
	id: string;
	family: ProviderFamily;
	capabilities: ProviderCapabilities;
	isAvailable(): Promise<boolean>;            // health check, drives /api/health
	listModels(): Promise<ProviderModel[]>;
	chat(req: ChatRequest, signal: AbortSignal): AsyncIterable<ChatChunk>;
	embed?(input: string[]): Promise<number[][]>;
}
```

`ChatRequest` carries `{ model, messages, sessionId?, workingDir?, stream }`.

### 3.2 Provider *types* vs provider *instances* (dynamic configuration)

The registry must not be a hardcoded list. Two distinct concepts:

- **Provider type** — an adapter shipped in the code. Closed set: `ollama`, `anthropic`, `openai-compatible`, `codex`, `opencode`.
- **Provider instance** — a user-created configuration bound to a type, editable at runtime from the settings panel. Open set: "OpenRouter", "my vLLM box", "LM Studio laptop", "work OpenAI key", three different Ollama hosts.

```ts
export interface ProviderInstance {
	id: string;                 // uuid, stable — referenced by chats/companions
	type: ProviderType;         // which adapter drives it
	label: string;              // user-facing, editable, non-unique
	enabled: boolean;
	baseUrl?: string;           // openai-compatible / ollama
	defaultModel?: string;
	models?: ProviderModel[];   // cached catalogue; refreshable
	modelSource: 'auto' | 'manual'; // auto = GET /models, manual = user-entered list
	headers?: Record<string, string>; // extra headers (HTTP-Referer, X-OpenRouter-Title, org ids…)
	options?: Record<string, unknown>; // per-type extras (workingDir for agents, port for opencode)
	hasApiKey: boolean;         // the key itself is NEVER in this object — see §7
}
```

A **preset** is just a prefilled `ProviderInstance` the UI offers as a starting point (OpenRouter, Groq, Together, LM Studio, …): type `openai-compatible` plus a known `baseUrl` and doc link. Presets live in `shared/configuration/provider-presets.ts` as data, so adding a vendor is a one-line data change, not an adapter.

The registry therefore resolves `providerId` → `ProviderInstance` → adapter instance, and caches adapters keyed by instance id, invalidated on config write.

### 3.3 Wire format

Keep NDJSON on `/api/chat/generate`. Today the server forwards raw Ollama chunks; that leaks the provider shape to the client. Normalize to `ChatChunk` and adapt the client reader once. The Ollama adapter maps `{ message: { content } }` → `{ type: 'text', content }`, so the change is contained.

---

## 4. Per-provider notes

### 4.1 ollama (reference implementation)

No behaviour change. Wrap the existing service. Only provider with `modelManagement: true` and `embeddings: true`.

### 4.2 anthropic (`http`, API key)

- SDK: `@anthropic-ai/sdk`, client `new Anthropic()` reading `ANTHROPIC_API_KEY` from the server env.
- Stream with `client.messages.stream({...})` — required anyway for large `max_tokens`.
- Model ids (no date suffixes): `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`. Default to `claude-opus-5`.
- Thinking: `thinking: { type: 'adaptive' }`, plus `display: 'summarized'` if reasoning is to be shown in the UI. `budget_tokens` is removed on current models (400). Assistant prefill is rejected (400).
- Depth/cost knob: `output_config: { effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max' }`.
- No `listModels` equivalent worth calling per request — the Models API exists (`client.models.list()`), cache it; a static list is acceptable for v1.
- Mapping work: system prompt is a top-level `system` field, not a `role: 'system'` message; message content is a block array; images are `{ type: 'image', source: { type: 'base64', media_type, data } }`.
- **Cost:** metered per token. This is the one provider where a user can spend real money by accident — surface token usage from `usage` chunks and consider prompt caching (`cache_control: { type: 'ephemeral' }`) for the companion system prompt, which is stable across turns.

### 4.3 openai-compatible (`http`, generic — the dynamic one)

One adapter, unlimited instances. Contract assumed: `POST {baseUrl}/chat/completions` with `Authorization: Bearer <key>`, SSE streaming (`data: {...}` lines terminated by `data: [DONE]`), deltas at `choices[0].delta.content`, and `GET {baseUrl}/models` for the catalogue.

- Client: `openai` npm package (`new OpenAI({ baseURL, apiKey, defaultHeaders })`) rather than hand-rolled SSE — every target below documents itself as OpenAI-SDK compatible.
- Model discovery: `modelSource: 'auto'` calls `GET /models`; on failure fall back to `'manual'` (a text field) instead of blocking the instance. Local runtimes and gateways vary in what they return; never make the instance unusable because the catalogue call 404s.
- Streaming edge cases to normalize into `ChatChunk`: `delta.reasoning` / `delta.reasoning_details` (OpenRouter, DeepSeek), `usage` arriving only in the final chunk, providers that ignore `stream_options`.
- Capabilities are **per instance, not per type** — vision, tools and context window differ between an OpenRouter model and a local llama.cpp build. Default conservatively (`tools: false`, `embeddings: false`) and let the user tick what their endpoint supports; a "Test connection" action can probe `GET /models` and one tiny completion.

**OpenRouter** (recommended preset):

- `baseUrl: https://openrouter.ai/api/v1`, `Authorization: Bearer <OPENROUTER_API_KEY>`.
- Optional ranking headers: `HTTP-Referer` (site URL) and `X-OpenRouter-Title` (app name) — good defaults for a Wollama preset.
- `GET /api/v1/models` returns the full catalogue with pricing and context length: feed `contextWindow`, and show price per model in the picker, which is exactly the cost transparency motivating this work.
- Model ids are slugs (`anthropic/claude-opus-5`, `openai/gpt-…`); `~vendor/…-latest` aliases track flagship versions without a redeploy.
- Interesting for Wollama: OpenRouter already does fallback routing across providers, so a single instance covers many models with one key. It also makes Claude reachable **without** an Anthropic key (§4.2 becomes optional rather than mandatory).

**Ollama via this adapter:** possible (`http://host:11434/v1`) but keep the native `ollama` type — it is the only path to `pull`/`show`/`ps` and embeddings.

### 4.4 codex (`agent`, CLI)

- Command: `codex exec [OPTIONS] <PROMPT>` (alias `codex e`), the officially supported non-interactive entry point.
- `--json` (alias `--experimental-json`) emits JSONL events on stdout. Event types (`ThreadEvent`): `thread.started`, `turn.started`, `turn.completed` (carries `usage`: `input_tokens`, `cached_input_tokens`, `cache_write_input_tokens`, `output_tokens`, `reasoning_output_tokens`), `turn.failed`, `item.started`, `item.updated`, `item.completed`, `error`.
- Continuation: `codex exec --json resume --last <PROMPT>` or `resume <SESSION_ID> <PROMPT>`. `thread.started` gives the id to persist.
- Useful flags: `-C <dir>` (working dir), `--skip-git-repo-check`, `--ephemeral` (no session files), `--ignore-user-config`, `-o/--output-last-message <FILE>`, `--output-schema <FILE>`.
- Integration = `spawn` + line-split stdout + JSON.parse per line. No HTTP.
- **Do not pass `--dangerously-bypass-approvals-and-sandbox`.** Approval/sandbox policy is the security surface; default policy stays.
- Model choice is codex-side config, not a Wollama parameter. `listModels()` returns a small static/configured list.

### 4.5 opencode (`agent`, CLI or HTTP)

Two integration paths — **prefer the server**:

1. **`opencode serve [--port N] [--hostname H] [--cors ORIGIN]`** — headless HTTP server exposing an OpenAPI surface, with the official `@opencode-ai/sdk` JS client (`session.create`, `session.prompt`, `session.promptAsync`, `session.abort`, `session.messages`, `session.fork`, `session.list`). Basic auth via `OPENCODE_SERVER_PASSWORD` (user defaults to `opencode`). This matches Wollama's existing sidecar pattern (`server/services/sidecar.service.ts` already manages child processes for TTS).
2. **`opencode run [message..]`** — one-shot, `--format json` for raw JSON events, `--model provider/model`, `--continue` / `--session <id>` / `--fork`, `--agent <name>`, `--password`/`--username` to attach to a running server.

Path 1 gives typed clients, abort support and session listing for one long-lived child process; path 2 pays process startup per turn. Use `sidecar.service.ts` to own the lifecycle.

`--model` takes `provider/model`, which means opencode has its *own* provider namespace nested inside ours. Surface it as `opencode:anthropic/claude-opus-5` rather than flattening.

---

## 5. Data model migration

`model: string` is insufficient — `'claude-opus-5'` is ambiguous once OpenRouter, opencode and a direct Anthropic key can all serve it.

`provider_id` below always stores a **provider instance id** (§3.2), never a type name, so two OpenRouter accounts or three Ollama hosts stay distinguishable.

Add to `shared/db/database-scheme.ts`:

| Collection | Field | Notes |
| --- | --- | --- |
| `user_preferences` | `default_provider: string` | default `'ollama'` |
| `companions`, `user_companions` | `provider_id: string` | default `'ollama'` |
| `chats` | `provider_id: string`, `external_session_id?: string` | session id for agent family |
| `messages` | `provider_id?: string` | a chat may switch providers mid-thread |

RxDB requires a schema version bump plus a migration strategy per touched collection; the strategy is a constant fill (`provider_id: 'ollama'` — the id of the seeded default Ollama instance). Server-side PouchDB documents need the same default applied lazily on read — there is no migration runner on that side today.

### 5.1 Where provider instances live

Two candidate homes, and the choice is forced by secrets:

| Option | Verdict |
| --- | --- |
| A collection in `shared/db/database-scheme.ts` | **No.** Every PouchDB database created through `dbManager` is served, unauthenticated, at `/_db/{name}` (`server/server.ts:90` mounts `expressPouchDB` with no auth middleware in front of it). Provider configs would be publicly readable and writable on a LAN-bound server. |
| A server-side store outside the replicated set | **Yes.** Instance configs live in a JSON file owned by a new `provider-config.service.ts`, in a directory distinct from `config.database.dir`, file mode `0600`. |

Split accordingly:

- **Server-only:** the `ProviderInstance` records and, separately, the secrets map `{ [instanceId]: apiKey }`.
- **Client-visible (over `/api/providers`, not replication):** the same records **redacted** — `hasApiKey: boolean`, never the key, never the raw `headers` if they embed a token.
- **Replicated (RxDB):** only `provider_id` references on companions/chats/messages/preferences.

A user switching device loses provider configs (they are server-side, per instance). That is correct — the server is the thing holding the keys.

**Never store API keys in any replicated collection.** RxDB syncs to the client through `/_db`; anything written there leaves the server.

---

## 6. HTTP surface changes

| Endpoint | Change |
| --- | --- |
| `POST /api/chat/generate` | accept `provider_id` + optional `session_id`; route through the registry; emit normalized `ChatChunk` NDJSON; return `session_id` in the terminal chunk for agent providers |
| `GET /api/providers` | **new** — list provider instances, redacted, with `capabilities` and live availability |
| `GET /api/provider-types` | **new** — the closed set of adapters + their presets, to build the "add provider" form |
| `POST /api/providers` | **new** — create an instance (accepts `apiKey`, stores it in the secret store, returns the redacted record) |
| `PATCH /api/providers/:id` | **new** — update; an omitted `apiKey` keeps the stored one, an empty string clears it |
| `DELETE /api/providers/:id` | **new** — refuse (`409`) while chats still reference it, or require `?force=true` and leave the orphan references readable |
| `POST /api/providers/:id/test` | **new** — connection probe: `GET /models` + a minimal completion; returns latency, model count, and the resolved capabilities |
| `POST /api/providers/:id/models/refresh` | **new** — re-fetch and cache the catalogue for `modelSource: 'auto'` |
| `GET /api/models` | aggregate across enabled instances; each entry gains `providerId`. Keep the flat Ollama shape behind `?provider=ollama` until the client migrates |
| `POST /api/models/pull` | Ollama-only; return `409` with a typed error when the target provider lacks `modelManagement` |
| `GET /api/health` | per-provider status map instead of a single Ollama boolean |
| RAG (`server/routes/rag.ts`, `services/rag/embed.ts`) | stays on Ollama for v1; guard with `capabilities.embeddings` and a clear error otherwise |
| Hooks / skills / agents | skip Wollama's tool pipeline when `family === 'agent'` (the agent runs its own) |

Bootstrap (`server/server.ts:488`) must stop assuming a pull is possible.

---

## 7. Security & config

Runtime-editable providers move key handling from "env var set by whoever runs the server" to "value typed into a UI", which is a real escalation. Rules:

- **Secret store**: keys live in a server-side file written by `provider-config.service.ts`, outside `config.database.dir`, mode `0600`, keyed by instance id. Never in RxDB, never in any `dbManager` database (see §5.1), never in a log line.
- **Redaction is server-side.** `/api/providers` returns `hasApiKey: boolean`; there is no endpoint that reads a key back. Editing a key is write-only.
- **Env vars remain supported and win**: `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY` seed instances at boot and mark them `managed: 'env'` (read-only in the UI). Headless/CI deployments keep working without the panel.
- **`/_db` is currently unauthenticated** (`server/server.ts:90`, mounted before `express.json()` with no middleware) and `config.cors.origin` defaults to `*` while `config.server.host` defaults to `0.0.0.0`. Adding user-supplied API keys to a server in that state is the single biggest risk in this plan — put `auth.service.ts` in front of `/_db` and the `/api/providers` write routes **before** P2 ships, not after.
- **SSRF**: `baseUrl` is user-supplied and the server will fetch it. Require `http(s)`, reject credentials-in-URL, and decide explicitly whether loopback/private ranges are allowed (they must be, for LM Studio and vLLM — so the mitigation is auth on the write route, not a network blocklist).
- **Custom `headers` are user-supplied**: block hop-by-hop and `Host`, and treat them as secret-bearing when redacting.
- Electron packaging: the server binary ships with the desktop app, so keys entered in the desktop settings panel land in the same server-side store — no separate path.
- **Agent providers can execute commands and write files on the host.** `codex exec` and `opencode run` are coding agents. Wollama today is a chat app with no such capability. Gate them behind an explicit opt-in setting, a fixed allowed working directory, and default approval policy. Do not expose them over a LAN-bound server (`config.server.host` defaults to `0.0.0.0`) without auth — `server/services/auth.service.ts` must cover these routes.
- CORS defaults to `*` (`config.cors.origin`). Tighten before shipping remote-capable providers.

`config.ts` holds only bootstrap defaults; the live set of instances comes from the store:

```ts
providers: {
  storePath: process.env.PROVIDER_STORE || path.resolve(__dirname, 'secrets', 'providers.json'),
  default: process.env.DEFAULT_PROVIDER || 'ollama',
  // seeds, applied once if the store is empty; each becomes an instance with managed: 'env'
  seed: {
    ollama:     { host: process.env.OLLAMA_HOST, defaultModel: process.env.OLLAMA_DEFAULT_MODEL },
    anthropic:  { apiKey: process.env.ANTHROPIC_API_KEY, defaultModel: 'claude-opus-5' },
    openrouter: { apiKey: process.env.OPENROUTER_API_KEY, baseUrl: 'https://openrouter.ai/api/v1' },
    codex:      { enabled: process.env.CODEX_ENABLED === 'true', bin: process.env.CODEX_BIN || 'codex' },
    opencode:   { enabled: process.env.OPENCODE_ENABLED === 'true', bin: 'opencode', port: 4096 }
  }
}
```

Keep `config.ollama` as a deprecated alias for one release to avoid touching every call site at once.

---

## 8. Client changes

### 8.1 Provider settings panel (new)

The panel is the feature, not a form. Screens:

1. **List** — one row per instance: label, type badge, model count, availability dot (from `/api/providers`), enable/disable toggle, edit, delete. Env-seeded rows are marked read-only.
2. **Add** — first pick a preset card (Ollama, Anthropic, OpenRouter, LM Studio, vLLM, Groq, Together, "Custom OpenAI-compatible", Codex, opencode), which prefills the form. Presets come from `/api/provider-types`, so new vendors appear without a client change.
3. **Edit form** — fields shown by type:
   - `label`, `enabled`
   - `baseUrl` (openai-compatible, ollama)
   - `apiKey` — write-only, placeholder `••••` when `hasApiKey`, "Clear key" action
   - `defaultModel`
   - **Models**: `auto` (with a Refresh button and a searchable list) or `manual` (free-text list) — auto must degrade to manual on failure, never dead-end
   - **Extra headers**: key/value repeater (prefilled `HTTP-Referer` / `X-OpenRouter-Title` for the OpenRouter preset)
   - **Capabilities**: checkboxes with the probe's suggestion prefilled
   - agent types: working directory picker + the explicit filesystem-access opt-in from §7
4. **Test connection** — visible result: reachable, model count, latency, first-token latency. This is what makes a self-hosted endpoint debuggable without reading server logs.

Placement: alongside the existing settings routes, reusing the current form components — an instance editor is the same shape as `CompanionEditor.svelte`.

### 8.2 Elsewhere

- Model picker grouped by provider (`CompanionEditor.svelte`, chat header). Label agent providers distinctly — they are not interchangeable with chat models.
- Feature gating from `capabilities`: hide "pull model" for non-Ollama, hide RAG/attachments where unsupported.
- `ServerConnectionCheck.svelte` and `OnboardingWizard.svelte` currently equate "server healthy" with "Ollama reachable" — must become "at least one provider available", with Ollama remaining the recommended default path.
- `chat.service.ts` sends `provider_id` and persists `external_session_id` from the stream.
- Reasoning and tool events from agent providers need rendering; `ToolCallMessage.svelte` already exists and is the natural target.

---

## 9. Phasing

| Phase | Content | Risk |
| --- | --- | --- |
| **P0** | `LlmProvider` interface, registry, instance resolution, Ollama adapter, normalized `ChatChunk`. Single seeded instance. Behaviour identical. | low — pure refactor, covered by existing `ollama.service.test.ts` |
| **P1** | Instance store + secret store + `/api/providers` CRUD + auth on `/_db` and the write routes + the settings panel. Still Ollama-only, but now multi-instance (several Ollama hosts). | medium — new persistence, security work |
| **P1b** | Schema migration (`provider_id` everywhere) + model picker grouped by provider. | medium — RxDB migration, both DB sides |
| **P2** | `openai-compatible` adapter + presets (OpenRouter first). **Highest value per unit of work**: one adapter unlocks OpenRouter, LM Studio, vLLM, Groq, an OpenAI key — and Claude through OpenRouter without an Anthropic key. | medium — SSE normalization, heterogeneous endpoints |
| **P3** | Native Anthropic adapter (`@anthropic-ai/sdk`): adaptive thinking, prompt caching, per-token usage. Only worth it after P2, since P2 already reaches Claude. | low-medium once P2 exists |
| **P4** | opencode via `opencode serve` + SDK, reusing `sidecar.service.ts`. First agent-family provider: session persistence, event rendering, pipeline bypass. | high — new interaction model |
| **P5** | codex via `codex exec --json`. Same event plumbing as P4, different transport. | medium once P4 lands |

P0–P1b are the real work; P2–P5 are adapters once the seams exist. Do not start P2 before P0, or the second provider gets welded into `server.ts` the same way Ollama is today — and do not ship P2 before P1's auth work, since that is the release where the server starts holding user API keys.

---

## 10. Open decisions

1. **Is a coding agent the right thing inside a chat app?** Codex and opencode are built to edit repos. Wollama companions are conversational. Either accept a "dev mode" chat bound to a project directory, or restrict agents to read-only prompts — both are defensible, they are different products.
2. **Whose tool loop wins?** Proposal above: the agent's, with Wollama's hooks/skills disabled for that family. Alternative — keep Wollama's pre-send hooks (prompt enrichment is harmless) and disable only agents/tool_calls. Needs a call before P3.
3. **Can a chat switch provider mid-thread?** Schema allows it (`provider_id` on `messages`). For agent sessions it breaks continuity. Suggest: allowed within `http`, forbidden once an agent session exists.
4. **Anthropic key ownership** — per-user (multi-user server, key in user prefs = replicated, unacceptable) or per-instance (env, single key for everyone). Proposal: per-instance for v1; per-user requires a server-side, non-replicated secret store.
5. **Does opencode's nested provider namespace get exposed** or collapsed to a model list? Affects the picker UI.
6. **Cost display** — usage chunks exist for Anthropic, OpenRouter and codex (`turn.completed.usage`). Show a per-chat token counter, or nothing? Recommended: show it, since cost is the stated reason for preferring the CLI providers, and OpenRouter's catalogue carries per-model pricing.
7. **Multi-user vs single-user instances.** Provider instances as designed are server-global: every user of that server shares the keys. Per-user instances mean per-user secret scoping and an ownership column. Proposal: server-global for v1, matching the current single-server-single-household usage.
8. **Encryption at rest for the secret store.** File mode `0600` protects against other local users, not against a stolen disk or a synced folder. Encrypting requires a master key, which needs somewhere to live (OS keychain via Electron `safeStorage` on desktop, env var on headless). Decide before P2; `safeStorage` is the pragmatic answer for the desktop build.
9. **Deleting an instance referenced by history.** Hard-refuse, soft-orphan, or tombstone? Proposal: soft-orphan — chats stay readable and show "provider removed", new turns are blocked until reassigned.

---

## 11. References

- Codex CLI: `codex exec` flags and `ThreadEvent` JSONL — <https://github.com/openai/codex> (`codex-rs/exec/src/cli.rs`, `codex-rs/exec/src/exec_events.rs`)
- opencode CLI/server: <https://opencode.ai/docs/cli>, <https://opencode.ai/docs/server>; SDK `@opencode-ai/sdk`
- Anthropic Messages API / TS SDK: `@anthropic-ai/sdk`, streaming + adaptive thinking + prompt caching
- OpenRouter: <https://openrouter.ai/docs> — base URL `https://openrouter.ai/api/v1`, OpenAI-SDK drop-in, `GET /api/v1/models` catalogue, `HTTP-Referer` / `X-OpenRouter-Title` ranking headers
- Current architecture: [ARCH.md](ARCH.md); repo conventions: [AGENTS.md](AGENTS.md)
