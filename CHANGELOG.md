# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.0.9] - 2026-03-27

### Added
- **Skills System**: Slash commands for quick actions (/translate, /summarize, etc.)
- **Hooks System**: Pre/post message processing pipeline for custom logic
- **Agents**: Built-in WebSearch and PageFetch agents for external data retrieval
- **ToolCallMessage Component**: Display agent tool execution results in chat
- **HookInspector**: Debug panel for viewing hook execution logs
- **Settings Page**: Manage skills and hooks with enable/disable toggles
- **Unit Tests**: Backend services (STT, TTS, Ollama) and frontend components
- **E2E Smoke Tests**: Critical user flow testing with Playwright
- **Skeleton Component**: Loading placeholder for better UX
- **ErrorBoundary Component**: Graceful error handling with retry

### Changed
- **Chat Input**: Auto-resizing textarea (max 50vh) with transparent background
- **Message Bubbles**: Rounded corners (2xl), cleaner design without tails
- **Message Actions**: Always visible below assistant messages
- **Auto-scroll**: Smart scrolling that respects user scroll position
- **Test Coverage**: 237+ tests across backend and frontend

### Fixed
- Loading states for chat list, messages, and settings
- Error handling with user-friendly messages and retry options
- Toast notifications for copy, toggle, and error states
- Various UI polish improvements

### Technical
- Svelte 5 Runes syntax throughout
- Vitest for unit testing (client + server)
- Playwright for E2E testing
- DaisyUI components for consistent styling

---

## [0.0.8] - 2026-03-20

### Added
- User preferences management
- Companion customization
- Multi-language support (i18n)

### Changed
- Improved offline-first sync with RxDB/PouchDB

---

## [0.0.7] - 2026-03-10

### Added
- Voice input (STT) with Whisper
- Voice output (TTS) with Piper
- Dark/Light theme support
