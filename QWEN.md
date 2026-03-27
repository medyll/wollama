# Wollama - AI Chat Application Context

## Project Overview

**Wollama** is a cross-platform AI chat application (Web, Desktop, Mobile) that runs locally with **Ollama**. It supports text streaming and voice interactions (STT/TTS) with an offline-first architecture.

### Core Technologies

| Layer | Technology |
|-------|------------|
| **Frontend** | Svelte 5 (Runes), Vite, Tailwind CSS v4, DaisyUI |
| **Backend** | Node.js v20+, Express.js, PouchDB (LevelDB) |
| **Desktop** | Electron |
| **Mobile** | Capacitor (Android/iOS) |
| **Database** | RxDB (Client/IndexedDB) ↔ PouchDB (Server) sync |
| **AI** | Ollama API (streaming), Whisper (STT), Piper (TTS) |

## Monorepo Structure

```
wollama/
├── client/              # Svelte 5 frontend (@wollama/client)
│   ├── src/
│   │   ├── lib/         # DB, services, state (Svelte 5 Runes)
│   │   ├── routes/      # SvelteKit pages
│   │   └── components/  # UI components (kebab-case naming)
│   ├── electron/        # Electron main process
│   └── android/         # Capacitor Android project
├── server/              # Node.js backend (@wollama/server)
│   ├── services/        # Business logic (ollama, stt, tts)
│   ├── db/              # PouchDB setup
│   └── routes/          # Express routes
├── shared/              # Shared code (@wollama/shared)
│   └── db/              # Database schema (single source of truth)
└── packages/            # Internal packages (e.g., chatterbox TTS)
```

## Build & Development Commands

### Root Commands (run from project root)

```bash
# Development
npm run dev:client       # Start Svelte 5 frontend (Vite) - http://localhost:5173
npm run dev:server       # Start Node.js backend with audio setup - http://localhost:3000
npm run dev:electron     # Start Electron desktop app

# Build & Type Check
npm run build            # Build client for production
npm run check            # Type check all projects

# Testing
npm run test:client      # Run client tests (Vitest, watch mode)
npm run test:server      # Run server tests (Vitest)
npm run test:client -- --run   # Client tests once (no watch)
npm run test:server -- --run   # Server tests once (no watch)

# Quality Assurance
npm run lint             # Prettier check + ESLint
npm run format           # Auto-fix formatting with Prettier
npm run setup:audio      # Download ONNX models for TTS/STT
```

### Workspace Commands

```bash
npm run <command> -w @wollama/client   # Client-specific commands
npm run <command> -w @wollama/server   # Server-specific commands
```

## Development Conventions

### TypeScript
- **Strict mode** enabled throughout
- **No `any` type** - use proper typing
- **Type-only imports**: `import type` for interfaces

### Svelte 5 (Frontend)
- **Runes syntax only**: `$state`, `$derived`, `$effect` (no old Svelte patterns)
- **Component naming**: kebab-case (e.g., `chat-window.svelte`)
- **Styling**: Tailwind utility classes + DaisyUI components only
- **New syntax**: Use `{#snippet}` for component slots

### Backend (Node.js)
- **Relative imports** for server modules
- **Async/await** over Promise chains
- **Try/catch** with proper error propagation

### Code Style
- **Tabs** for indentation (see `.prettierrc`)
- **Single quotes** for strings
- **No trailing commas**
- **Print width**: 130 characters

## Database Architecture

### Schema Management
1. **Always update first**: `shared/db/database-scheme.ts`
2. Then implement client-side RxDB changes
3. Then update server-side PouchDB configuration

### Key Collections
- `users`, `user_preferences`
- `companions`, `user_companions` (AI personalities)
- `chats`, `messages`
- `user_prompts` (custom instructions)
- `skills`, `agents`, `hooks` (extensibility)
- `tool_calls`

### Offline-First Sync
- **Client**: RxDB with IndexedDB
- **Server**: PouchDB with LevelDB adapter
- **Sync**: CouchDB replication protocol

## Platform-Specific Audio Strategy

| Platform | STT/TTS Execution |
|----------|-------------------|
| **Web** | Server-side (Node.js child processes) |
| **Desktop (Electron)** | Native Node.js child processes (whisper.cpp, piper binaries) |
| **Mobile (Capacitor)** | Custom Capacitor Plugin (native bridge to JNI/Swift) |

## Key Configuration Files

| File | Purpose |
|------|---------|
| `PROJECT.md` | Complete project specifications |
| `AGENTS.md` | Development guide for coding agents |
| `shared/db/database-scheme.ts` | Database schema (update first) |
| `client/src/lib/db.ts` | Client RxDB setup |
| `server/server.ts` | Backend entry point |
| `server/db/database.ts` | PouchDB configuration |
| `.prettierrc` | Code formatting rules |
| `tsconfig.json` | TypeScript configuration |

## Testing Guidelines

- **Framework**: Vitest for all projects
- **Client tests**: jsdom environment with SvelteKit integration
- **Server tests**: Node.js environment
- **Naming pattern**: `functionName_shouldDoSomething`
- **Run single file**: `npm run test:client -- path/to/test.test.ts`

## Important Considerations

### Prerequisites
- Node.js v20+ and npm
- Ollama running on `http://127.0.0.1:11434`
- Android Studio (for mobile development)

### Environment Variables
- Set `OLLAMA_ORIGINS="*"` for CORS if needed
- Use environment variables for sensitive configuration (never commit secrets)

### Deep Linking (Mobile)
- Custom URL schemes handled in `client/src/routes/+layout.svelte`
- Intercept `appUrlOpen` event from Capacitor App plugin

### Accessibility
- Application must be RGAA 2.0 compatible
- Use semantic HTML and ARIA attributes

### Internationalization (i18n)
- Supported languages: English, French, German, Spanish, Italian
- Locale stored in `user_preferences.locale`

## Common Issues

### Build Failures
- Run `npm install` at root to install all workspace dependencies
- Check TypeScript config in each project

### Ollama Connection
- Ensure Ollama is running: `ollama serve`
- Pull a model: `ollama pull mistral`

### Database Sync
- Clear browser data triggers re-sync from server
- Server data stored in `db_data/` directory

### Audio Permissions
- Web/Electron: Browser `navigator.mediaDevices`
- Mobile: `RECORD_AUDIO` permission (handled by Capacitor)
