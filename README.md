# Wollama

**Wollama** is a modern, cross-platform AI chat application designed to run locally with **Ollama**. It supports text and voice interactions (Speech-to-Text & Text-to-Speech) and is built for Web, Desktop (Windows/Linux/macOS), and Mobile (Android/iOS).

## 🚀 Features

- **Local AI**: Powered by [Ollama](https://ollama.com/), ensuring privacy and offline capabilities.
- **Cross-Platform**: Runs on Web, Desktop (Electron), and Mobile (Capacitor).
- **Voice Interaction**:
    - **STT**: Whisper integration for voice input.
    - **TTS**: Text-to-Speech support for AI responses.
- **Rich Chat UI**: Markdown support, code highlighting, image attachments.
- **Customizable**: Theming (DaisyUI), multiple languages (i18n), and configurable AI personalities (Companions).
- **Sync**: Offline-first architecture using RxDB (Client) and PouchDB (Server).
- **Skills & Hooks**: Extensible system with slash commands (/translate, /summarize) and pre/post message processing.
- **Agents**: Built-in WebSearch and PageFetch agents for external data retrieval.
- **Testing**: 237+ unit and E2E tests for reliability.

## 🎯 New in v0.0.9

- **Skills System**: Add custom slash commands for quick actions
- **Hooks System**: Intercept and modify messages before/after sending
- **Agents**: Web search and page fetching capabilities
- **Enhanced UX**: Loading skeletons, error boundaries, improved chat input
- **Better Testing**: Comprehensive test coverage for backend and frontend

## 🛠️ Technical Stack

- **Frontend**: Svelte 5 (Runes), Vite, Tailwind CSS v4, DaisyUI.
- **Backend**: Node.js (Express), PouchDB (LevelDB).
- **Desktop Wrapper**: Electron.
- **Mobile Wrapper**: Capacitor.
- **Database**: RxDB (Client) <-> PouchDB (Server) sync.

## 🧠 Architecture Highlights

### Context Injection: Whisper & Piper Integration

The application employs a specific strategy for integrating Speech-to-Text (Whisper) and Text-to-Speech (Piper) across different platforms to ensure optimal performance and offline capabilities:

- **Web (Browser)**:
    - **Execution**: Delegated to **Server**.
    - **Strategy**: Audio is recorded/played by the browser but processed by the Node.js backend (Whisper/Piper) to avoid heavy client-side load.

- **Desktop (Electron)**:
    - **Execution**: Native **Node.js Child Processes**.
    - **Strategy**: Bypasses the browser layer to use optimized precompiled C++ binaries (`whisper.cpp`, `piper`) for maximum performance (AVX/CUDA).

- **Mobile (Capacitor)**:
    - **Strategy**: **Custom Capacitor Plugin** (Native Bridge).
    - **Implementation**: Bridges to native libraries (JNI/Swift) to leverage device NPU/GPU, avoiding the performance overhead of running WASM inside a WebView.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js** (v20 or higher) & **npm**.
2.  **Ollama**: Installed and running (`ollama serve`).
    - Pull a model: `ollama pull mistral` (or your preferred model).
3.  **Android Studio** (for Android development).
4.  **Visual Studio Build Tools** (for Windows native modules compilation, if needed).

## ⚙️ Installation & Setup

1.  **Clone the repository**

    ```bash
    git clone https://github.com/medyll/wollama.git
    cd wollama
    ```

2.  **Install Dependencies**
    This project uses a monorepo-like structure. Install dependencies at the root:

    ```bash
    npm install
    ```

3.  **Setup Audio Models (Optional but recommended)**
    Downloads necessary ONNX models for local TTS/STT.
    ```bash
    npm run setup:audio
    ```

## 💻 Development Environment

You can run the different parts of the application using the following scripts:

### 1. Web Development (Browser)

Runs the Node.js server and the Vite frontend in parallel.

```bash
# Terminal 1: Start the Backend Server
npm run server:dev

# Terminal 2: Start the Frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Server: `http://localhost:3000`

### 2. Desktop Development (Electron)

Runs the application in an Electron window.

```bash
npm run electron:dev
```

### 3. Mobile Development (Android)

Syncs the web build to the Android project and opens Android Studio or runs on a connected device.

```bash
# Build the frontend first
npm run build

# Sync with Capacitor
npx cap sync

# Run on device/emulator
npx cap run android
```

## 🧪 Testing

### Unit Tests

```bash
# Client tests (Vitest + jsdom)
npm run test:client -- --run

# Server tests (Vitest + Node.js)
npm run test:server -- --run
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
cd client && npx playwright test

# Run with UI
cd client && npx playwright test --ui

# Run specific test file
cd client && npx playwright test e2e/tests/smoke.spec.ts
```

### Test Coverage

- **Client**: 166 tests (components, services, utils)
- **Server**: 71 tests (services, agents, routes)
- **E2E**: 4 smoke tests (critical user flows)

## ⚠️ Technical Considerations & Troubleshooting

### Audio & Permissions

- **Microphone Access**:
    - **Web/Electron**: Uses standard `navigator.mediaDevices`. Ensure your OS allows microphone access to the terminal/app.
    - **Mobile**: Requires `RECORD_AUDIO` permission (handled by Capacitor).
- **Audio Formats**: The app automatically detects supported MIME types (`audio/webm` vs `audio/mp4`) for cross-platform compatibility (iOS vs Android/Desktop).

### Database & Sync

- The app uses an **Offline-First** approach.
- **Client**: RxDB stores data in IndexedDB.
- **Server**: PouchDB stores data in `db_data/` (LevelDB).
- **Sync**: Data is automatically replicated between Client and Server when connected. If you clear browser data, it will re-sync from the server.

### Ollama Connection

- The application expects Ollama to be running on `http://127.0.0.1:11434`.
- Ensure CORS is configured in Ollama if you run into connection issues (set `OLLAMA_ORIGINS="*"`).
- **Docker Users**: If running Ollama in Docker, ensure the port is exposed and accessible from the host.

### Mobile Specifics

- **Deep Linking**: Custom URL schemes are handled in `client/src/routes/+layout.svelte` to support opening the app via links.
- **Assets**: If you add new assets, run `npx cap copy` to update the native platforms.

### Build & Production

- **Server**: The server can be compiled to a single executable using `pkg`.
- **Electron**: Use `electron-builder` (configuration in `package.json`) to generate installers.

## 📂 Project Structure

```
wollama/
├── client/                 # Frontend (SvelteKit)
│   ├── electron/           # Electron main process
│   ├── src/
│   │   ├── components/     # UI Components
│   │   ├── lib/
│   │   │   ├── db.ts       # RxDB Client Setup
│   │   │   ├── services/   # Audio, Chat, STT Services
│   │   │   └── state/      # Global State (Svelte 5 Runes)
│   │   └── routes/         # App Pages
├── server/                 # Backend (Express)
│   ├── services/           # STT, TTS, Ollama Logic
│   └── server.ts           # Entry Point
├── android/                # Native Android Project
├── bin/                    # Binary resources (Piper, Whisper models)
└── db_data/                # Server-side Database storage
```
