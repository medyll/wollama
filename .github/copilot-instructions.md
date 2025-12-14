# GitHub Copilot Instructions for Wollama

## Project Context

**Wollama** is a cross-platform AI chat application (Mobile & Desktop) undergoing a complete rewrite.

- **Source of Truth:** The `PROJECT.md` file contains all functional specifications, architecture, and data models. Refer to it systematically.
- **Code State:** This is a migration/rewrite. **DO NOT USE** folders named `_old`. They are obsolete archives.
- **Language:** The instructions file is in English, but follow user preference for conversation language.

## Technical Stack (Strict)

- **Framework:** Svelte 5 (Runes mandatory: `$state`, `$derived`, `$effect`, `$props`).
- **Build:** Vite + SvelteKit (Static Adapter).
- **Styles:** Tailwind CSS v4 (via `@tailwindcss/vite`) + DaisyUI.
- **Engine:** Tauri (Desktop) / Capacitor (Mobile).
- **Database:** See `PROJECT.md` (JSON Flat file / SQLite).

## Development Conventions

### Svelte 5

- Use Runes syntax exclusively. No `export let` or `$:`.
- Use `snippets` (`{#snippet}`) instead of `slots`.
- Event handling via props (e.g., `onclick`) and not `createEventDispatcher`.

### Architecture & Files

- **New Components:** Must be created in `src/components/` (outside of `_old`).
- **Business Logic:** Must be implemented in `src/lib/` (outside of `_old`).
- **Imports:** Use aliases `$lib`, `$components`, `$types`.

### Workflow

- If a feature is described in `PROJECT.md` but missing from the code, it must be implemented from scratch, without blindly copying old code.
- Code must be modular and typed (Strict TypeScript).

## Specific Rules

- **Mobile First:** The interface must be designed for mobile first (Responsive).
