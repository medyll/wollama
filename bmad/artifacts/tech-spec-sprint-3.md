Tech Spec — Sprint 3: Skills + Autocomplete

Scope
- Implement client-side SkillAutocomplete.svelte (initial implementation) to provide autocomplete for slash commands and skill names.
- Implement server-side /api/skills invocation pipeline: parsing, permission checks, hook middleware (pre/post), validation, and execution routing to skill handlers.

API: /api/skills
- POST /api/skills/execute
  - body: { skillId: string, input: string, userId?: string, context?: object }
  - responses: 200 { result }, 4xx validation/auth, 5xx server
- GET /api/skills?query=... (autocomplete source)
  - returns list of { id, name, description, triggers }

Invocation Pipeline (server)
1. Authenticate user (optional for local dev)
2. Validate payload schema
3. Run pre-send hooks (middleware chain) — may mutate payload or cancel
4. Route to skill handler (sync/async) — skill returns ToolCallMessage or text
5. Run post-send hooks (logging, telemetry, transform output)
6. Return standardized response shape

Hooks
- pre hooks: validate/augment input, rate-limit, user transform
- post hooks: telemetry, response sanitization, caching
- Hook API: (context, payload) => { continue: boolean, payload?: obj }

Client: SkillAutocomplete.svelte
- Uses Svelte 5 runes ($state) and fetches GET /api/skills?query=term
- Debounce input (200ms), keyboard navigation, accessible (aria) list
- Emits event on selection with selected skill object
- Accepts props: minChars (3), debounceMs (200)

Testing & Acceptance
- Unit tests for GET endpoint and pipeline middleware
- Component tests (vitest + jsdom) for keyboard, selection, debounce
- E2E test: type into input, select suggestion, POST to /api/skills/execute -> mock handler

Acceptance Criteria
- Autocomplete suggestions appear after minChars and are keyboard accessible
- /api/skills/execute runs through pre/post hooks and returns expected result shape

> Assumed: Server uses Express v5 (per PROJECT.md); use existing shared types in shared/ for skill definitions.
