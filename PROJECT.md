# TOTAL PROJECT: TECHNICAL CONTEXT, ARCHITECTURE & DATA

## 1. PROJECT DEFINITION
Cross-platform AI chat application (Mobile & Desktop) with text (Streaming) and voice (STT/TTS) capabilities.
* **Hosting:** Self-hosted Node.js server on Windows (compiled as .exe).
* **Clients:** Android, iOS (via Capacitor) and Windows, Linux, macOS (via Electron).
*   **Target AI:** Ollama (Local).
*   **Target UX:** Responsive (Mobile First) & Themable (Light/Dark/Custom).
*   **Internationalization:** The application is multi-language (i18n) with support for English, French, German, Spanish, Italian.

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
* **Database:** PouchDB (LevelDB adapter) + express-pouchdb.
* **API:** REST + PouchDB Sync Protocol.

### AI & Audio
* **LLM:** Ollama API (Streaming enabled).
* **STT (Input):** Whisper (via Ollama or OpenAI API compatible).
* **TTS (Output):** Web Speech API (Front) or **Piper** (Local Neural TTS) on Backend.
* **Analysis:** Real-time Tone/Sentiment detection of user input.
* **Expressivity:** Adaptive Voice Mood/Style generation in server responses.

## 3. MONOREPO STRUCTURE

```text
/root
├── client/                     # [Svelte 5 + Vite]
│   ├── src/
│   │   ├── lib/
│   │   │   ├── db.ts           # RxDB Client Database & Sync Logic
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
│   ├── server.ts               # Entry Point (Express + PouchDB Server)
│   ├── config.ts               # Centralized Configuration
│   ├── db/                     # Database Initialization
│   │   └── database.ts         # PouchDB Setup
│   └── services/               # Isolated Business Logic
│       ├── ollama.service.ts   # LLM Management & Streaming
│       ├── generic.service.ts  # Server-side Data Access
│       ├── stt.service.ts      # Audio Input Processing (Whisper)
│       ├── tts.service.ts      # Audio Output Processing
│       └── storage.service.ts  # (Deprecated/Legacy)
│
├── shared/                     # [Shared Code]
│   ├── db/
│   │   ├── database-scheme.ts  # Single Source of Truth for Schema
│   │   └── schema-definition.ts
│   └── services/
│       └── abstract-generic.service.ts # Shared Interface
│
└── package.json                # Global Scripts
```

## 4. DATA MODEL (SIMPLIFIED SCHEMA)

**Architecture:** Offline-First with Sync.
- **Client:** RxDB (IndexedDB/Dexie)
- **Server:** PouchDB (LevelDB)
- **Sync:** CouchDB Replication Protocol

**Convention:** Primary and foreign IDs must be prefixed by the entity name.

### User
Represents the human user.

- `user_id`: UUID (PK)
- `username`: String
- `created_at`: Timestamp

### UserPreferences
- `user_preferences_id`: UUID (PK)
- `user_id`: Link → User
- `theme`: String
- `locale`: String
- `server_url`: String
- `default_model`: String
- `default_temperature`: Number
- `auto_play_audio`: Boolean

### Companion
Represents the AI configuration (Personality).

- `companion_id`: UUID (PK)
- `name`: String (e.g., "Jarvis")
- `description`: String
- `system_prompt`: Text (Base instructions for the LLM)
- `model`: String (Ollama model name, e.g., "mistral:latest")
- `voice_id`: String (Identifier of the TTS voice used)
- `avatar`: String
- `specialization`: String
- `is_locked`: Boolean

### Chat (Session)
A conversation between a User and a Companion.

- `chat_id`: UUID (PK)
- `user_id`: Link → User
- `companion_id`: Link → Companion
- `title`: String
- `tags`: Array<String>
- `category`: String
- `context`: Array<Number> (Embedding context)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Message
A single exchange in a Chat.

- `message_id`: UUID (PK)
- `chat_id`: Link → Chat
- `role`: Enum `['system', 'user', 'assistant', 'tool']`
- `content`: Text (Raw Markdown)
- `status`: Enum `['idle', 'done', 'sent', 'streaming', 'error']`
- `sentiment`: String (Detected emotion/tone of the input)
- `voice_style`: String (TTS parameter for mood/expressivity)
- `audio_file_path`: String (Optional, local path)
- `images`: Array<Object>
- `urls`: Array<Object>
- `created_at`: Timestamp

## 5. DATA FLOW

### A. Text Flow (Streaming)

1. **UI:** User input → Svelte Store (`chat.svelte.js`).
2. **Persistence:** Client inserts message into RxDB (`status: 'sent'`).
3. **Sync:** RxDB replicates to Server PouchDB.
4. **Processing:** Server detects new message (Change Stream) OR Client calls API.
   * *Current Implementation:* Client calls Server API for generation, Server streams response back.
5. **Response:** Server streams chunks to Client.
6. **Update:** Client updates RxDB message content progressively (`status: 'streaming'`).
7. **Finalization:** Message marked as `done`.

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
- **Settings (`/settings`)**: 
    - Initial configuration (Nickname, Server).
    - Model Management: List installed models, Pull new models (with progress bar).
    - Back button to return to home/chat.
- **Chat Home (`/chat`)**: Empty state, invitation to start a conversation.
- **Active Chat (`/chat/[id]`)**: Main discussion interface.
    - **Message Bubbles:**
        - Must support Markdown rendering including Code Blocks with syntax highlighting.
        - Must support Image display.
    - **Agent Actions (Last Message Only):**
        - A component bar must appear at the bottom of the last message from the `assistant` role.
        - **Actions required:**
            - **Rating:** Thumbs Up / Thumbs Down (Good/Bad).
            - **Reload:** Button to regenerate the response.
            - **Share:** Button (Functionality to be defined later).
            - **Copy:** Button to copy content to clipboard (Must trigger a toast notification).

### Modals & Overlays
- **Compagnon Selector**: AI choice grid (Name, Description, Model). Accessible from the chat header.
- **Settings (Coming Soon)**: Advanced configuration.

## 9. DEVELOPMENT PHASING

- **Phase 1 (Core):** Node Server + Svelte Client Text (Streaming) + JSON Data Structure + Theming.
- **Phase 2 (Audio):** Complete STT/TTS Pipeline.
- **Phase 3 (Platform):** Capacitor (Android) and Electron (Desktop) Configuration.
- **Phase 4 (Build):** `.exe` and `.apk` Packaging.
