# Wollama Architecture

> Verified against the codebase on 2026-07-17. Runtime code and executable checks take precedence over historical sprint artifacts.

## System map

```text
Web / Electron / Capacitor
        │
        ▼
SvelteKit + Svelte 5 client
  ├─ UI components and routes
  ├─ application state (Svelte runes)
  ├─ RxDB / IndexedDB
  └─ chat, audio and synchronization services
        │ HTTP + streaming + CouchDB replication
        ▼
Express server
  ├─ Ollama chat and model management
  ├─ Whisper STT / Piper and Chatterbox TTS
  ├─ skills and hook pipeline
  ├─ WebSearch and PageFetch agents
  └─ PouchDB / LevelDB
```

## Workspace boundaries

| Workspace             | Responsibility                                       | Main entry points                                                          |
| --------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `client`              | Web UI and desktop/mobile shells                     | `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `electron/main.js` |
| `server`              | HTTP API, Ollama orchestration, audio and extensions | `server.ts`                                                                |
| `shared`              | Database schema, extension types and defaults        | `db/database-scheme.ts`, `types/`                                          |
| `packages/chatterbox` | Optional emotional-TTS Python sidecar                | `main.py`                                                                  |

The dependency direction is `client → shared` and `server → shared`. Shared defaults define their own data contract and do not import client-only types.

## Primary chat flow

1. `ChatWindow.svelte` coordinates the selected companion, chat history, input and audio state.
2. `chat.service.ts` persists the user message in RxDB and calls `POST /api/chat/generate`.
3. The server runs pre-send hooks, builds the effective prompt and streams Ollama output.
4. The client updates the assistant message while chunks arrive.
5. Post-receive hooks and optional TTS complete the response flow.
6. RxDB replicates collections to the per-user PouchDB databases exposed under `/_db`.

## HTTP surface

| Endpoint                     | Purpose                                    |
| ---------------------------- | ------------------------------------------ |
| `GET /api/health`            | Server and Ollama readiness                |
| `POST /api/chat/generate`    | Streaming chat generation                  |
| `GET /api/models`            | List Ollama models                         |
| `POST /api/models/pull`      | Pull an Ollama model                       |
| `POST /api/audio/transcribe` | Speech-to-text                             |
| `POST /api/audio/speak`      | Standard or emotional text-to-speech       |
| `/api/skills`                | List and invoke skills                     |
| `/api/hooks`                 | Inspect hooks                              |
| `/api/agents`                | Run agents and inspect tool-call status    |
| `/_db`                       | CouchDB-compatible PouchDB replication API |

## Data model

`shared/db/database-scheme.ts` is the source of truth for 13 collections:

- Identity: `users`, `user_preferences`
- Companions: `companions`, `user_companions`
- Conversation: `chats`, `messages`, `user_prompts`
- Taxonomy: `languages`, `tags`
- Extensions: `skills`, `agents`, `hooks`, `tool_calls`

Client schemas are generated for RxDB at startup. Server collections use PouchDB and the same logical definitions.

## Extension pipeline

```text
user message
  → slash-command resolution
  → pre-send hooks ordered by priority
  → Ollama generation or agent execution
  → tool-call persistence
  → post-receive hooks
  → client stream / optional TTS
```

Built-in skills are registered under `server/services/skills`. Built-in agents are registered under `server/agents`. Agent runs are persisted in `tool_calls`.

## Platform audio

| Platform | Strategy                                                                             |
| -------- | ------------------------------------------------------------------------------------ |
| Web      | Browser records and plays audio; server performs STT/TTS                             |
| Electron | Node/Electron can use packaged native binaries and the Chatterbox sidecar            |
| Android  | Capacitor shell around the client; native validation remains part of release testing |
| iOS      | No checked-in native project yet                                                     |

`STT_ENABLED=false` disables speech-to-text. Production authentication requires an explicit `AUTH_SECRET`.

## Verified quality baseline

As of 2026-07-17:

- Client TypeScript/Svelte check: 0 errors, 0 warnings
- Server TypeScript check: 0 errors
- Client unit/integration tests: 216 passing, 55 skipped legacy assertions
- Server unit tests: 74 passing
- E2E: present under `client/e2e`, not yet part of this verified baseline

## Known structural debt

1. `client/src/_old` still contains a large legacy tree and must not be removed without a reference/migration audit.
2. CouchDB live replication and the custom sync queue overlap; ownership and failure semantics need consolidation.
3. Fifty-five client assertions describe obsolete UI contracts or mocks and remain explicitly skipped.
4. The six Playwright specifications require a clean cross-platform validation pass.
5. LLM-backed skill invocation is not implemented; built-in skill handlers are functional.

## Development commands

```bash
npm run dev:client
npm run dev:server
npm run dev:electron
npm run check
npm run test:client -- --run
npm run test:server -- --run
```

Update `shared/db/database-scheme.ts` before changing either database implementation.
