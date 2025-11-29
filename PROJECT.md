# TOTAL PROJECT: TECHNICAL CONTEXT, ARCHITECTURE & DATA

## 1. PROJECT DEFINITION
Cross-platform AI chat application (Mobile & Desktop) with text (Streaming) and voice (STT/TTS) capabilities.
* **Hosting:** Self-hosted Node.js server on Windows (compiled as .exe).
* **Clients:** Android, iOS (via Capacitor) and Windows, Linux, macOS (via Electron).
* **Target AI:** Ollama (Local).
* **Target UX:** Responsive (Mobile First) & Themable (Light/Dark/Custom).

## 2. TECHNICAL STACK (MANDATORY)

### Frontend (Client)
* **Framework:** Svelte 5 (Runes syntax `$state`, `$effect` mandatory).
* **Build System:** Vite.
* **CSS Framework:** Tailwind CSS + **DaisyUI**.
    * *Note:* Use DaisyUI themes for "Themable" management via `data-theme` attribute. with light dark theme or any other color
* **Mobile Engine:** Capacitor.
* **Desktop Engine:** Electron.
* **Markdown Renderer:** `marked` library.

### Backend (Server)
* **Runtime:** Node.js v20+.
* **Server Framework:** Express.js.
* **Packaging:** `pkg` (Binary compilation).
* **Database:** JSON Flat file (MVP) or SQLite.

### AI & Audio
* **LLM:** Ollama API (Streaming enabled).
* **STT (Input):** Whisper (via Ollama or OpenAI API compatible).
* **TTS (Output):** Web Speech API (Front) or Node.js TTS Engine (Back).

## 3. MONOREPO STRUCTURE

```text
/root
├── client/                     # [Svelte 5 + Vite]
│   ├── src/
│   │   ├── lib/
│   │   │   ├── state/          # Svelte 5 Stores (.svelte.js) - Theme Management here
│   │   │   ├── services/       # Client API & Audio Recorder
│   │   │   └── utils/          # Markdown Config & Audio Player
│   │   ├── assets/
│   │   ├── routes/
│   │   │   └── +layout.svelte  # Global Management (Deep Linking, Theme)
│   │   └── App.svelte
│   ├── electron/               # [Electron Main Process]
│   └── capacitor.config.ts     # [Mobile Config]
│
├── server/                     # [Node.js Express]
│   ├── server.js               # Entry Point
│   └── services/               # Isolated Business Logic
│       ├── ollama.service.js   # LLM Management & Streaming
│       ├── stt.service.js      # Audio Input Processing (Whisper)
│       ├── tts.service.js      # Audio Output Processing
│       └── storage.service.js  # JSON/SQLite Persistence
│
└── package.json                # Global Scripts
```

## 4. DATA MODEL (SIMPLIFIED SCHEMA)

**Convention:** Primary and foreign IDs must be prefixed by the entity name.

### User
Represents the human user.

- `user_id`: UUID
- `username`: String
- `preferences`: JSON `{ "theme": "dark", "auto_play_audio": boolean }`

### User_AI (Persona)
Represents the AI configuration (Personality).

- `user_ai_id`: UUID
- `name`: String (e.g., "Jarvis")
- `system_prompt`: String (Base instructions for the LLM)
- `voice_id`: String (Identifier of the TTS voice used)
- `model`: String (Ollama model name, e.g., "mistral")

### Chat (Session)
A conversation between a User and a User_AI.

- `chat_id`: UUID
- `user_id`: Link → User
- `user_ai_id`: Link → User_AI
- `title`: String
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Message
A single exchange in a Chat.

- `message_id`: UUID
- `chat_id`: Link → Chat
- `role`: Enum `['user', 'assistant', 'system']`
- `content`: Text (Raw Markdown)
- `audio_file_path`: String (Optional, local path)
- `timestamp`: Timestamp

## 5. DATA FLOW

### A. Text Flow (Streaming)

1. **UI:** User input → Svelte Store (`chat.svelte.js`).
2. **Transport:** POST `/chat` to Node.js.
3. **Backend:** Call Ollama API (`stream: true`).
4. **Response:** Pipe Ollama stream to HTTP response (Chunked).
5. **Rendering:** Svelte updates `` on each chunk. Render via `marked` + `{@html}`.

### B. Voice Flow (Audio)

1. **UI:** MediaRecorder captures audio → Blob.
2. **Transport:** Upload FormData to Node.js.
3. **Backend STT:** Convert Blob → Text (STT Service).
4. **Backend LLM:** Text → Ollama → Text Response.
5. **Backend TTS:** Text Response → Audio Buffer.
6. **UI:** Receive Audio → Auto-play.

## 6. AI DIRECTIVES (FOR CODING)

- **Svelte 5 Strict:** Use Runes exclusively (``, ``, ``). No old syntax.
- **Responsive UI:** Mobile First Design. Tailwind breakpoints (`md:`, `lg:`) for sidebar/chat.
- **Theming:** `data-theme` attribute on `<html>` managed by Svelte to toggle DaisyUI themes.
- **DaisyUI:** Use semantic classes (`chat`, `chat-start`, `chat-bubble`).
- **Error Handling:** Resilient streaming (reconnection, timeout handling).
- **Security:** Mandatory Markdown parsing before HTML injection.
- **Compatibility:** Runtime detection (Electron vs Capacitor vs Web) to adapt Audio API.
- **TypeScript:** The application must be strongly typed.
- **Accessibility:** The application must be RGAA 2.0 compatible.

## 7. MOBILE SPECIFICS (CAPACITOR & SVELTEKIT)

### Routing Architecture

- **SPA Mode Mandatory:** Use `@sveltejs/adapter-static` with `fallback: 'index.html'`.
- **SSR Disabled:** `export const ssr = false;` and `export const prerender = true;` in `src/routes/+layout.js`.

### Deep Linking (Incoming URLs)

Capacitor does not use the standard web router for app opens via custom scheme. You must intercept the `appUrlOpen` event and route manually.

**Required Snippet (`src/routes/+layout.svelte`):**

```javascript
import { onMount } from 'svelte';
import { goto } from '/navigation';
import { App } from '@capacitor/app';

onMount(() => {
    App.addListener('appUrlOpen', data => {
        // Cleanup: "myapp://chat/123" -> "/chat/123"
        const slug = data.url.split('.com').pop(); 
        if (slug) goto(slug);
    });
});
```

## 8. SCREEN LIST (UI MAP)

### Main Screens
- **Welcome (`/`)**: Loading, logo, automatic redirection.
- **Settings (`/settings`)**: Initial configuration (Nickname, Server).
- **Chat Home (`/chat`)**: Empty state, invitation to start a conversation.
- **Active Chat (`/chat/[id]`)**: Main discussion interface.

### Modals & Overlays
- **Persona Selector**: AI choice grid (Name, Description, Model). Accessible from the chat header.
- **Settings (Coming Soon)**: Advanced configuration.

## 9. DEVELOPMENT PHASING

- **Phase 1 (Core):** Node Server + Svelte Client Text (Streaming) + JSON Data Structure + Theming.
- **Phase 2 (Audio):** Complete STT/TTS Pipeline.
- **Phase 3 (Platform):** Capacitor (Android) and Electron (Desktop) Configuration.
- **Phase 4 (Build):** `.exe` and `.apk` Packaging.
