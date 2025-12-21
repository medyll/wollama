# GitHub Copilot Instructions for Wollama

## 1. Project Context & Principles

**Wollama** is a cross-platform AI chat application (Web, Desktop/Electron, Mobile/Capacitor) built as a **Monorepo**.

- **Source of Truth:** `PROJECT.md` contains all functional specs, architecture, and data models. **Read it first.**
- **Code State:** This is a complete rewrite. **NEVER** use or reference folders named `_old`.
- **Mobile First:** UI must be designed for mobile touch targets and responsiveness first, then adapted for desktop.
- **Offline-First:** Data is local-first (RxDB on client) and syncs to server (PouchDB).

## 2. Technical Stack (Strict Versions)

### Frontend (`client/`)

- **Framework:** Svelte 5 (Runes syntax `$state`, `$derived`, `$effect`, `$props` **MANDATORY**).
- **Build:** Vite + SvelteKit (Static Adapter).
- **Styling:** Tailwind CSS v4 + DaisyUI v5. Use `data-theme` for theming.
- **Mobile:** Capacitor v8 (Android/iOS).
- **Desktop:** Electron v39.

### Backend (`server/`)

- **Runtime:** Node.js v20+ (ES Modules).
- **Framework:** Express v5.
- **Database:** PouchDB v9 (LevelDB adapter).
- **AI:** Ollama (local), Whisper (STT), Piper (TTS).

### Shared (`shared/`)

- **Types & Schemas:** Shared TypeScript interfaces and database schemas.

## 3. Monorepo Workflows

Run commands from the **root** directory:

- **Development:**
    - Client (Web): `npm run dev:client`
    - Server: `npm run dev:server`
    - Electron: `npm run dev:electron`
- **Testing:**
    - Client: `npm run test:client` (Vitest)
    - Server: `npm run test:server` (Vitest)
- **Linting:** `npm run lint` (Prettier + ESLint)

### IDE Setup (VS Code)

- **Extensions:** Install `Svelte for VS Code`, `ESLint`, `Prettier`, and `Tailwind CSS`.
- **Formatting:** Configured to run **Prettier** and **ESLint --fix** on save.
- **Settings:** Workspace settings are in `.vscode/settings.json`.

## 4. Architecture & Data Flow

### Data Synchronization

- **Client:** Uses **RxDB** (`client/src/lib/db.ts`) with Dexie storage.
- **Server:** Uses **PouchDB** (`server/db/database.ts`) with `pouchdb-find`.
- **Sync:** CouchDB Replication Protocol.
- **Schema:** Defined in `shared/db/database-scheme.ts`. **Always update this file first** when changing data models.

### Component Structure (`client/src/`)

- **`components/`**: Reusable UI components.
- **`lib/`**: Business logic, state, and services.
    - `lib/state/`: Svelte 5 reactive state files (`.svelte.ts`).
    - `lib/services/`: API clients and hardware integration.
- **`routes/`**: SvelteKit file-based routing.

## 5. Coding Conventions

### Svelte 5

- **Runes Only:** Use `$state`, `$derived`, `$effect`, `$props`.
- **No Legacy:** Do NOT use `export let`, `$:`, or `createEventDispatcher`.
- **Events:** Pass callback props (e.g., `onclick`) instead of dispatching events.
- **Snippets:** Use `{#snippet}` instead of `<slot>`.

### TypeScript

- **Strict Mode:** No `any`. Define interfaces in `shared/` if used across workspaces.
- **Imports:** Use aliases:
    - Client: `$lib`, `$components`, `$types`.
    - Server: Relative imports or configured paths.

### Styling

- Use Tailwind utility classes.
- Use DaisyUI components for consistency.
- Ensure dark/light mode compatibility via DaisyUI themes.

## 6. Key Files to Reference

- `PROJECT.md`: Full specifications.
- `shared/db/database-scheme.ts`: Database schema definitions.
- `client/src/lib/db.ts`: Client-side database logic.
- `server/server.ts`: Backend entry point.
