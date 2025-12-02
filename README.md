# Wollama

Wollama is a cross-platform AI chat application using Ollama.

## Prerequisites

- **Node.js** v20+
- **Ollama** (running locally)
- **Docker** (for Audio Stack)

## Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Audio Stack (TTS/STT):**
    Wollama uses an external service for high-quality Speech-to-Text and Text-to-Speech.
    ```bash
    docker-compose up -d
    ```
    This starts the `speeches` service on port `9000`.

3.  **Run Development Server:**
    ```bash
    npm run server:dev
    ```

4.  **Run Client:**
    ```bash
    npm run dev
    # or
    npm run electron:dev
    ```

## Architecture

- **Client:** Svelte 5 + Vite + Tailwind
- **Server:** Node.js + Express + PouchDB
- **AI:** Ollama (Text) + Speeches (Audio)
