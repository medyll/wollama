# AGENTS.md - Wollama Development Guide

This file contains essential development guidelines and commands for agentic coding agents working in the Wollama repository.

## 1. Build, Lint, and Test Commands

### Root Commands (Monorepo)

```bash
# Development
npm run dev:client          # Start Svelte 5 frontend (Vite)
npm run dev:server          # Start Node.js backend with audio setup
npm run dev:electron        # Start Electron desktop app

# Build & Check
npm run build              # Build client for production
npm run check              # Type check all projects

# Testing
npm run test:client        # Run all client tests (Vitest)
npm run test:server        # Run all server tests (Vitest)
npm run test:client -- --run  # Run client tests once (no watch)
npm run test:server -- --run  # Run server tests once (no watch)

# Single test file (replace with actual path)
npm run test:client -- src/components/button.test.ts
npm run test:server -- src/services/ollama.test.ts

# Quality Assurance
npm run lint               # Run Prettier + ESLint
npm run format             # Format all files with Prettier
npm run setup:audio        # Download audio models for TTS
```

### Nx Commands (if available)

```bash
# Use Nx for workspace management
nx run client:build        # Build client project
nx run server:test         # Run server tests
nx affected:test           # Test affected projects only
```

## 2. Code Style Guidelines

### TypeScript & JavaScript

- **Strict Mode**: TypeScript strict mode enabled throughout
- **No Explicit Any**: Use proper typing, avoid `any` type
- **Unused Variables**: ESLint will warn about unused variables
- **Import Organization**: Group imports by type (external, internal, type-only)

### Frontend (Svelte 5)

- **Runes Syntax Only**: Use `$state`, `$derived`, `$effect` - no old Svelte patterns
- **Component Structure**: Follow Svelte 5 conventions with `{#snippet}` syntax
- **Styling**: Tailwind utility classes + DaisyUI components only
- **File Naming**: kebab-case for components (e.g., `chat-window.svelte`)

### Backend (Node.js)

- **Relative Imports**: Use relative paths for server modules
- **Async/Await**: Prefer async/await over Promise chains
- **Error Handling**: Use try/catch blocks with proper error propagation
- **Type Safety**: Strong typing for all interfaces and schemas

### Shared Code

- **Type-Only Imports**: Use `import type` for shared interfaces
- **Schema Updates**: Update `shared/db/database-scheme.ts` first before any DB changes
- **Cross-Platform**: Consider platform differences (Web/Electron/Mobile)

## 3. Development Workflow

### Monorepo First

- Always run commands from the root directory
- Use workspace flags (`-w @wollama/*`) when needed
- Follow the monorepo structure: client/, server/, shared/

### Platform Considerations

- **Web**: Server-side audio processing
- **Desktop**: Native Node.js child processes
- **Mobile**: Capacitor Plugin with native bridge

### Offline-First Architecture

- Client uses RxDB for local-first data
- Server uses PouchDB with CouchDB replication
- Always consider offline scenarios in data flow

## 4. Key Files and Their Purposes

- `PROJECT.md`: Complete project specifications and requirements
- `shared/db/database-scheme.ts`: Database schema - update this first
- `client/src/lib/db.ts`: Client database logic and RxDB setup
- `server/server.ts`: Backend entry point and Express setup
- `server/db/database.ts`: PouchDB server database configuration

## 5. Testing Guidelines

### Test Structure

- Use Vitest for all testing
- Client tests use jsdom environment with SvelteKit integration
- Server tests use Node.js environment with TypeScript support
- Write descriptive test names following the pattern: `functionName_shouldDoSomething`

### Test Commands

- Run all tests: `npm run test:client` or `npm run test:server`
- Run single test: `npm run test:client -- path/to/test.test.ts`
- Watch mode: `npm run test:client -- --watch`
- Single run: `npm run test:client -- --run`

## 6. Quality Assurance

### Pre-commit Hooks

- Husky + lint-staged configured for automatic checks
- Prettier runs on all JS/TS/Svelte/JSON/MD files
- ESLint fixes on JS/TS/Svelte files automatically

### Linting Rules

- TypeScript strict mode enforced
- Svelte-specific rules (no-at-html-tags, require-each-key)
- Custom ESLint overrides for Svelte syntax

## 7. Architecture Principles

### Data Flow

1. Update shared schema first
2. Implement client-side RxDB changes
3. Update server-side PouchDB configuration
4. Test data sync across platforms

### Audio Strategy

- Web: Server-side Whisper/Piper processing
- Desktop: Native Node.js child processes
- Mobile: Capacitor Plugin native bridge

### TTS Sidecar (Chatterbox Turbo)

- Server spawns Python FastAPI sidecar
- REST/WebSocket communication on localhost
- Lazy-loaded models for performance

## 8. Common Issues and Solutions

### Build Failures

- Check package.json for correct workspace scripts
- Verify TypeScript configuration in each project
- Ensure all dependencies are installed with `npm install`

### Test Failures

- Run tests with `--run` flag for non-watch mode
- Check test environment configuration (jsdom vs Node.js)
- Verify test file paths and naming conventions

### Linting Issues

- Run `npm run format` to auto-fix formatting
- Check ESLint configuration for specific rule violations
- Use `npm run lint` to identify all issues before committing

## 9. Security Considerations

- Never commit secrets or API keys
- Use environment variables for sensitive configuration
- Validate all user inputs and API responses
- Follow OWASP guidelines for web application security

## 10. Performance Guidelines

- Use lazy loading for heavy components and models
- Optimize bundle size with proper code splitting
- Consider offline-first performance implications
- Monitor memory usage for audio processing tasks

Remember: This is a production-ready AI chat application with strict coding standards and cross-platform requirements. Always follow the established patterns and conventions.

# context-mode — MANDATORY routing rules

You have context-mode MCP tools available. These rules are NOT optional — they protect your context window from flooding. A single unrouted command can dump 56 KB into context and waste the entire session.

## BLOCKED commands — do NOT attempt these

### curl / wget — BLOCKED
Any shell command containing `curl` or `wget` will be intercepted and blocked by the context-mode plugin. Do NOT retry.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` to fetch and index web pages
- `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")` to run HTTP calls in sandbox

### Inline HTTP — BLOCKED
Any shell command containing `fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, or `http.request(` will be intercepted and blocked. Do NOT retry with shell.
Instead use:
- `context-mode_ctx_execute(language, code)` to run HTTP calls in sandbox — only stdout enters context

### Direct web fetching — BLOCKED
Do NOT use any direct URL fetching tool. Use the sandbox equivalent.
Instead use:
- `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` to query the indexed content

## REDIRECTED tools — use sandbox equivalents

### Shell (>20 lines output)
Shell is ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`, and other short-output commands.
For everything else, use:
- `context-mode_ctx_batch_execute(commands, queries)` — run multiple commands + search in ONE call
- `context-mode_ctx_execute(language: "shell", code: "...")` — run in sandbox, only stdout enters context

### File reading (for analysis)
If you are reading a file to **edit** it → reading is correct (edit needs content in context).
If you are reading to **analyze, explore, or summarize** → use `context-mode_ctx_execute_file(path, language, code)` instead. Only your printed summary enters context.

### grep / search (large results)
Search results can flood context. Use `context-mode_ctx_execute(language: "shell", code: "grep ...")` to run searches in sandbox. Only your printed summary enters context.

## Tool selection hierarchy

1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — Primary tool. Runs all commands, auto-indexes output, returns search results. ONE call replaces 30+ individual calls.
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — Query indexed content. Pass ALL questions as array in ONE call.
3. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — Sandbox execution. Only stdout enters context.
4. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` — Fetch, chunk, index, query. Raw HTML never enters context.
5. **INDEX**: `context-mode_ctx_index(content, source)` — Store content in FTS5 knowledge base for later search.

## Output constraints

- Keep responses under 500 words.
- Write artifacts (code, configs, PRDs) to FILES — never return them as inline text. Return only: file path + 1-line description.
- When indexing content, use descriptive source labels so others can `search(source: "label")` later.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call the `stats` MCP tool and display the full output verbatim |
| `ctx doctor` | Call the `doctor` MCP tool, run the returned shell command, display as checklist |
| `ctx upgrade` | Call the `upgrade` MCP tool, run the returned shell command, display as checklist |
