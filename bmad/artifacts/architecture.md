# Architecture — Wollama Agents / Skills / Hooks

**Version:** 1.0 | **Date:** 2026-03-22

---

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (Svelte 5 / SvelteKit)                                    │
│                                                                     │
│  ChatInput ──► SlashCommandParser ──► SkillAutocomplete.svelte      │
│      │                  │                        │                  │
│      │           skill détecté          fetch skills (RxDB live)    │
│      │                  ▼                                           │
│      │         SkillDispatcher                                       │
│      │                  │                                           │
│      └──────────────────┘                                           │
│      POST /api/chat/:id/messages  (message + skill_invoked?)        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP / SSE
┌──────────────────────────▼──────────────────────────────────────────┐
│  SERVER (Express)                                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  HookPipeline                                                │   │
│  │                                                              │   │
│  │  1. [on-session-start hooks]  → enrichir session_metadata   │   │
│  │  2. [pre-send hooks]          → muter message.content       │   │
│  │  3. SkillResolver             → parse /command [args]       │   │
│  │     └─► SkillRunner                                         │   │
│  │           └─► AgentRunner    → tool_calls table             │   │
│  │                 └─► résultat injecté comme role:'tool'       │   │
│  │  4. OllamaService             → stream LLM response         │   │
│  │  5. [post-receive hooks]      → muter réponse               │   │
│  │  6. PersistMessage            → PouchDB                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Routes nouvelles:                                                  │
│    GET  /api/skills                                                 │
│    POST /api/skills/:slug/invoke                                    │
│    GET  /api/hooks                                                  │
│    POST /api/agents/:id/run                                         │
│    GET  /api/agents/:tool_call_id/status                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ CouchDB replication
┌──────────────────────────▼──────────────────────────────────────────┐
│  PouchDB (server) ◄──► RxDB (client)                               │
│  Tables sync: skills, agents, hooks, tool_calls                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Interfaces TypeScript clés

### HookContext (shared/types/hooks.ts)

```ts
export type HookEvent = 'pre-send' | 'post-receive' | 'on-session-start' | 'on-session-end' | 'on-tool-result';

export interface MessageDraft {
	content: string;
	role: 'user' | 'assistant' | 'tool' | 'system';
	skill_invoked?: string;
	images?: string[];
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

export interface HookLogEntry {
	hook_id: string;
	event: HookEvent;
	duration_ms: number;
	mutated: boolean;
	error?: string;
}

export type HookHandler = (ctx: HookContext) => Promise<HookContext>;
```

### Skill (shared/types/skills.ts)

```ts
export type HandlerType = 'builtin' | 'llm' | 'agent';
export type ScopeType = 'global' | 'user' | 'companion';

export interface Skill {
	skill_id: string;
	name: string;
	display_name: string;
	description: string;
	command: string;
	icon: string;
	input_schema: Record<string, unknown>;
	handler_type: HandlerType;
	handler_ref: string;
	scope: ScopeType;
	is_enabled: boolean;
	created_at: string;
	updated_at: string;
}
```

### Agent / ToolCall (shared/types/agents.ts)

```ts
export type AgentType = 'web_search' | 'page_fetch' | 'file_reader' | 'custom';

export interface Agent {
	agent_id: string;
	name: string;
	type: AgentType;
	config: Record<string, unknown>;
	is_enabled: boolean;
}

export interface ToolCall {
	tool_call_id: string;
	message_id: string;
	agent_id: string;
	skill_id?: string;
	status: 'pending' | 'running' | 'done' | 'error';
	input: Record<string, unknown>;
	output?: Record<string, unknown>;
	error?: string;
	started_at: string;
	finished_at?: string;
}
```

---

## Pipeline Hook — règles d'exécution

1. **Chargement** : `HookRegistry` charge tous les hooks actifs depuis PouchDB au démarrage, indexés par event.
2. **Tri** : hooks triés par `priority` (croissant) pour chaque event.
3. **Exécution** : séquentielle, chaque hook reçoit le `HookContext` sorti du précédent.
4. **Isolation** : exception → `error` loggé dans `hook_log`, ctx transmis inchangé, pipeline continue.
5. **Hooks bloquants** : `config.blocking: true` → exception propagée, message rejeté.

---

## Règle slash command

Regex : `^\/([a-z][a-z0-9-]*)(?:\s+(.*))?$`

- Groupe 1 = slug du skill
- Groupe 2 = arguments bruts

Parsing client (autocomplete) ET serveur (exécution). Le client poste `skill_invoked: "/translate fr"` dans le payload, sans exécuter lui-même.

---

## Fichiers à créer / modifier

### Shared

- `shared/db/database-scheme.ts` — +4 tables, extensions messages/companions
- `shared/types/hooks.ts`, `skills.ts`, `agents.ts` — interfaces

### Server

- `server/services/hook-pipeline.service.ts`
- `server/services/hook-registry.service.ts`
- `server/services/skill-resolver.service.ts`
- `server/services/skill-runner.service.ts`
- `server/services/agent-runner.service.ts`
- `server/services/agents/web-search.agent.ts`
- `server/services/agents/page-fetch.agent.ts`
- `server/services/skills/translate.skill.ts`
- `server/services/skills/summarize.skill.ts`
- `server/services/skills/help.skill.ts`
- `server/routes/skills.ts`, `server/routes/agents.ts`
- `server/server.ts` — enregistrement routes + HookPipeline

### Client

- `client/src/lib/utils/slash-command-parser.ts`
- `client/src/lib/services/skills.service.ts`
- `client/src/components/SkillAutocomplete.svelte`
- `client/src/components/ToolCallMessage.svelte`
- `client/src/components/HookInspector.svelte`
- `client/src/lib/db.ts` — bump schema version
