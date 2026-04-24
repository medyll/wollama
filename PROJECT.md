# TOTAL PROJECT: TECHNICAL CONTEXT, ARCHITECTURE & DATA

## 1. PROJECT DEFINITION

Cross-platform AI chat application (Mobile & Desktop) with text (Streaming) and voice (STT/TTS) capabilities.

- **Hosting:** Self-hosted Node.js server on Windows (compiled as .exe).
- **Clients:**
    - **Web:** Browser-based interface.
    - **Desktop:** Windows, Linux, macOS (via Electron).
    - **Mobile:** Android, iOS (via Capacitor).
- **Target AI:** Ollama (Local).
- **Target UX:** Responsive (Mobile First) & Themable (Light/Dark/Custom).
- **Internationalization:** The application is multi-language (i18n) with support for English, French, German, Spanish, Italian.

## 2. TECHNICAL STACK (MANDATORY)

### Frontend (Client)

- **Framework:** Svelte 5 (Runes syntax `$state`, `$effect` mandatory).
- **Build System:** Vite.
- **CSS Framework:** Tailwind CSS + **DaisyUI**.
    - _Note:_ Use DaisyUI themes for "Themable" management via `data-theme` attribute. with light dark theme or any other color
- **Mobile Engine:** Capacitor.
- **Desktop Engine:** Electron.
- **Markdown Renderer:** `marked` library.

### Backend (Server)

- **Runtime:** Node.js v20+.
- **Server Framework:** Express.js.
- **Packaging:** `pkg` (Binary compilation).
- **Database:** PouchDB (LevelDB adapter) + express-pouchdb.
- **API:** REST + PouchDB Sync Protocol.

### AI & Audio

- **LLM:** Ollama API (Streaming enabled).
- **STT (Input):** Whisper (via Ollama or OpenAI API compatible).
- **TTS (Output):** Web Speech API (Front) or **Piper** (Local Neural TTS) on Backend.
- **Analysis:** Real-time Tone/Sentiment detection of user input.
- **Expressivity:** Adaptive Voice Mood/Style generation in server responses.

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

### UserPrompts

Custom instructions injected into the system prompt.

- `prompt_id`: UUID (PK)
- `content`: String (Text Long)
- `is_active`: Boolean

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
    - _Current Implementation:_ Client calls Server API for generation, Server streams response back.
5. **Response:** Server streams chunks to Client.
6. **Update:** Client updates RxDB message content progressively (`status: 'streaming'`).
7. **Finalization:** Message marked as `done`.

### B. Voice Flow (Audio)

1. **UI:** MediaRecorder captures audio → Blob.
2. **Transport:** Upload FormData to Node.js.
3. **Backend STT:** Convert Blob → Text (STT Service).
4. **Backend LLM:** Text → Ollama → Text Response.
5. **Backend TTS:** Text Response → Audio Buffer.
6. UI: Receive Audio → Auto-play.

## 6. CONTEXT INJECTION: WHISPER & PIPER INTEGRATION (CROSS-PLATFORM)

**Objective:** Integrate Whisper (STT) and Piper (TTS) into a modern JavaScript application targeting three environments: Web, Desktop (Electron), and Mobile (Capacitor). The application must be offline-first.

### 1. Web Environment (Browser)

**Execution must be delegated to the Server.**

- **Strategy:** The browser does not run the models locally (No WASM).
- **STT:** The client records audio (MediaRecorder) and uploads the Blob to the Node.js Server. The Server processes it via Whisper and returns the text.
- **TTS:** The client requests audio from the Server. The Server generates it via Piper and streams the audio file back.

### 2. Desktop Environment (Electron)

Execution must prioritize native performance via **Node.js Child Processes**, bypassing the browser layer.

- **Strategy:** Embed optimized precompiled binaries (C++) (AVX/CUDA/CoreML) of `whisper.cpp` and `piper`.
- **Implementation:** Control these binaries via `child_process.spawn`.
    - _Piper:_ Send text via `stdin` and retrieve PCM audio stream via `stdout`.
    - _Whisper:_ Pass audio file as argument or via stream to get transcription.

### 3. Mobile Environment (Capacitor iOS/Android)

Hybrid approach depending on performance needs.

- **High Performance Option (Recommended):** Develop or use a **Custom Capacitor Plugin**. This plugin acts as a bridge to native C++ libraries (via JNI on Android and Swift/Objective-C on iOS) to exploit phone NPU/GPU.
- **Fallback:** Delegate to Server (like Web Environment) if offline mode is not strictly required for Audio, or if the device is too old.

### 4. Critical Points & Technical Constraints

The code generating AI must strictly follow these rules:

- **Unified Architecture:** Code must be modular (e.g., Adapter Pattern) to dynamically switch between `spawn` implementation (Electron), `Server API` implementation (Web), and `Native Plugin` implementation (Mobile) based on detected runtime environment.
- **Offline-First (Data):** While Audio processing might require a server connection for the Web client, the textual chat and data synchronization must remain offline-first.

## 7. AFFECTIVE COMPUTING MODULE (EMOTION MANAGEMENT)

### 1. OBJECTIVE

1.  **Input:** Detect user emotional state (Joy, Anger, Sadness, Neutral).
2.  **Output:** Modulate AI response (Tone, Laughter, Sighs) via TTS.

### 2. EMOTIONAL FLOW

#### A. Detection (User Input)

_Selected Option (MVP Node.js): Semantic Analysis of Transcribed Text._

1.  **Audio -> Text:** `stt.service.ts` transcribes audio via Whisper.
2.  **Text -> Emotion Label:**
    - _Method:_ Pass text through a micro-analysis module (e.g., `sentiment` library or a lightweight specific LLM prompt).
    - _Result:_ JSON `{ "sentiment": "happy", "score": 0.8 }`.
3.  **Context Injection:** Inject state before sending the main prompt to Ollama.
    - _Final Prompt:_ `[SYSTEM: User is HAPPY.] User: Hi Jarvis!`

#### B. Expression (AI Output)

_Key Technology: SSML (Speech Synthesis Markup Language)._

1.  **System Prompt:** Configure AI to use tags.
    - _Instruction:_ "If you find something funny, use the tag `<break time="500ms" />` for a pause or `*laughs*`."
2.  **LLM Generation:**
    - _Raw Response:_ `That's hilarious! <laugh>Hahaha</laugh>, I wouldn't have thought of that.`
3.  **TTS Parser:** `tts.service.ts` detects tags.
    - If TTS engine supports SSML (e.g., Google Cloud, Azure, some Coqui models) -> Direct send.
    - If TTS engine is basic -> Service injects a pre-recorded sound file (`laugh.mp3`) replacing the `<laugh>` tag.

### 3. TECHNICAL IMPLEMENTATION

#### Backend (`server/services/emotion.service.ts`)

- **Analyzer:** Use `natural` or `sentiment` (Node.js libs) for fast polarity detection (+/-) of transcribed text.
- **Audio Injector (Fallback):** If TTS cannot laugh:
    1.  Split text: `["That's hilarious!", "<laugh>", "I wouldn't have thought of that."]`
    2.  Generate Audio 1 + Load `laugh.wav` + Generate Audio 2.
    3.  Concatenate audio buffers using `ffmpeg` or a buffer concatenation utility.

#### System Prompt (Ollama)

Add to `system_prompt` in DB: ( and in config)

> "You are an expressive AI. Adapt your tone to the user's emotion.
> To express physical emotions, use these exact tokens:
>
> - [LAUGH] to laugh.
> - [SIGH] to sigh.
> - [CLEARS_THROAT] to clear throat.
>   Only use these tokens if the context truly warrants it."

### 4. DATA MODEL IMPACT

Add to **Message** table:

- `detected_emotion`: String (e.g., "anger", "joy") - stored for analytics or future memory.

## 8. AI DIRECTIVES (FOR CODING)

- **Svelte 5 Strict:** Use Runes exclusively (`, `, ``). No old syntax.
- **Responsive UI:** Mobile First Design. Tailwind breakpoints (`md:`, `lg:`) for sidebar/chat.
- **Theming:** `data-theme` attribute on `<html>` managed by Svelte to toggle DaisyUI themes.
- **DaisyUI:** Use semantic classes (`chat`, `chat-start`, `chat-bubble`).
- **Error Handling:** Resilient streaming (reconnection, timeout handling).
- **Security:** Mandatory Markdown parsing before HTML injection.
- **Compatibility:** Runtime detection (Electron vs Capacitor vs Web) to adapt Audio API.
- **TypeScript:** The application must be strongly typed.
- **Accessibility:** The application must be RGAA 2.0 compatible.

## 8. MOBILE SPECIFICS (CAPACITOR & SVELTEKIT)

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
	App.addListener('appUrlOpen', (data) => {
		// Cleanup: "myapp://chat/123" -> "/chat/123"
		const slug = data.url.split('.com').pop();
		if (slug) goto(slug);
	});
});
```

## 9. SCREEN LIST (UI MAP)

### Layout & Navigation (Responsive)

- **Top Bar (Header):**
    - **Left:** Mobile Menu Toggle (Navicon) - _Visible only on Mobile_.
    - **Center:** App Title ("Wollama").
    - **Right:**
        - Connection Status Indicator.
        - Language Selector.
        - **User Menu:** Avatar/Initial (or Sign In button). Displays nickname and sync status on Desktop.
- **Sidebar (Desktop):**
    - **Top:** Navicon (Collapse/Expand) & Search Icon (aligned).
    - **Content:** "New Chat" button + Scrollable list of recent chats.
    - **Bottom:** Settings button.
    - **Behavior:** Collapsible (Mini-sidebar mode).
- **Drawer (Mobile):**
    - **Content:** Same as Sidebar but fully expanded.
    - **Behavior:** Overlay (Drawer), auto-closes on navigation. No collapse mode.

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

## 10. DEVELOPMENT PHASING

- **Phase 1 (Core):** Node Server + Svelte Client Text (Streaming) + JSON Data Structure + Theming.
- **Phase 2 (Audio):** Complete STT/TTS Pipeline.
- **Phase 3 (Platform):** Capacitor (Android) and Electron (Desktop) Configuration.
- **Phase 4 (Build):** `.exe` and `.apk` Packaging.

## 11. CURRENT STATE & RECENT CHANGES (Dec 2025)

### UI/UX Improvements

- **Chat Interface:**
    - **Input Area:** Redesigned with auto-resizing textarea (max 50vh), transparent background, and bottom toolbar for attachments/send/mic.
    - **Message Bubbles:** Rounded corners (2xl) with removed "tail" and top corners flattened for a cleaner look.
    - **Message Actions:** Always visible below assistant messages (Copy, Rate, Regenerate, Share).
    - **Auto-scroll:** Smart auto-scroll to bottom on new messages, disabled if user is manually scrolling up.
- **Navigation:**
    - **Mobile:** Drawer layout for navigation.
    - **Generic UI Components:**
        - Enhanced `DataGenericList` and `DataCard` with full CRUD capabilities (Create, Read, Update, Delete).
        - Implemented confirmation dialogs for destructive actions.

### Context Management & Prompts

- **Dynamic Context:** Architecture to inject user profile and active files into the LLM context.
- **User Prompts:** New feature in Settings to manage custom instructions (phrases) that are automatically injected into the System Prompt.
    - **Desktop:** Collapsible Sidebar.
    - **User Menu:** Extracted to TopBar for better accessibility.
- **Android:**
    - Updated build configuration to use **Java 21 (LTS)**.
