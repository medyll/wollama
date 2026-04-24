# GitHub Copilot Instructions for Wollama

## 1. Project Context & Principles

**Wollama** is a cross-platform AI chat app (Web, Desktop/Electron, Mobile/Capacitor) built as a **Monorepo**.

- **Source of Truth:** `PROJECT.md`. **Read it first.**
- **Code State:** Complete rewrite. **NEVER** reference `_old` folders.
- **Mobile First:** Design for touch/responsiveness first.
- **Offline-First:** Local-first data (RxDB) syncs to server (PouchDB).

## 2. Technical Stack (Strict Versions)

- **Frontend (`client/`):** Svelte 5 (Runes `$state`, `$derived` **MANDATORY**), Vite 7, Tailwind v4, DaisyUI v5, Capacitor v8, Electron v39.
- **Backend (`server/`):** Node.js v20+, Express v5, PouchDB v9 (LevelDB), Ollama, Whisper, Piper.
- **Shared (`shared/`):** TypeScript interfaces & schemas.

## 3. Monorepo Workflows (Run from root)

- **Dev:** `npm run dev:client` (Web), `npm run dev:server` (Backend), `npm run dev:electron` (Desktop).
- **Setup:** `npm run setup:audio` (Download ONNX models).
- **Test:** `npm run test:client`, `npm run test:server` (Vitest).
- **Lint:** `npm run lint` (Prettier + ESLint).

## 4. Architecture & Data Flow

- **Data Sync:** RxDB (`client/src/lib/db.ts`) <-> PouchDB (`server/db/database.ts`) via CouchDB replication.
- **Schema:** Update `shared/db/database-scheme.ts` **FIRST**.
- **Audio Strategy:**
    - **Web:** Server-side processing (Whisper/Piper).
    - **Desktop:** Native Node.js child processes.
    - **Mobile:** Capacitor Plugin (Native Bridge).

### Emotional TTS Sidecar (Chatterbox Turbo)

- **Architecture:** Server (Node.js) spawns a Python FastAPI sidecar (Chatterbox Turbo) for expressive TTS.
- **Communication:**
    - **Lifecycle:** Managed by Server `child_process.spawn`.
    - **Protocol:** REST/WebSocket on `localhost:[DYNAMIC_PORT]`.
- **Generation Protocol:**
    - **Ollama Output:** JSON `{ "text": "...", "emotion_tags": "[laugh]", "parameters": {...} }` or Inline `Text [gasp] text.`.
- **Audio Flow:** Server -> FastAPI (`/synthesize`) -> Stream/Buffer -> Client (Web Audio API).
- **Models:** Lazy loaded.

## 5. Coding Conventions

- **Svelte 5:** Runes ONLY. No `export let`, `$:` or `createEventDispatcher`. Use `{#snippet}`.
- **Styling:** Tailwind utility classes + DaisyUI components.
- **TypeScript:** Strict mode. Use aliases (`$lib`, `$components`).
- **Imports:** Client uses `$lib`, Server uses relative paths.

## 6. Key Files

- `PROJECT.md`: Specs.
- `shared/db/database-scheme.ts`: DB Schema.
- `client/src/lib/db.ts`: Client DB logic.
- `server/server.ts`: Backend entry.
