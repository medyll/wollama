# PROJET TOTAL : CONTEXTE TECHNIQUE, ARCHITECTURE & DATA

## 1. DÉFINITION DU PROJET
Application de chat IA multiplateforme (Mobile & Desktop) avec capacités textuelles (Streaming) et vocales (STT/TTS).
* **Hébergement :** Serveur Node.js auto-hébergé sur Windows (compilé en .exe).
* **Clients :** Android, iOS (via Capacitor) et Windows, Linux, macOS (via Electron).
* **IA Cible :** Ollama (Local).
* **UX Target :** Responsive (Mobile First) & Themable (Light/Dark/Custom).

## 2. STACK TECHNIQUE (IMPOSÉE)

### Frontend (Client)
* **Framework :** Svelte 5 (Syntaxe Runes `$state`, `$effect` obligatoire).
* **Build System :** Vite.
* **CSS Framework :** Tailwind CSS + **DaisyUI**.
    * *Note :* Utiliser les thèmes DaisyUI pour la gestion "Themable" via attribut `data-theme`.
* **Mobile Engine :** Capacitor.
* **Desktop Engine :** Electron.
* **Markdown Renderer :** Librairie `marked`.

### Backend (Serveur)
* **Runtime :** Node.js v20+.
* **Server Framework :** Express.js.
* **Packaging :** `pkg` (Compilation binaire).
* **Database :** JSON Flat file (MVP) ou SQLite.

### IA & Audio
* **LLM :** Ollama API (Streaming enabled).
* **STT (Input) :** Whisper (via Ollama ou OpenAI API compatible).
* **TTS (Output) :** API Web Speech (Front) ou Moteur TTS Node.js (Back).

## 3. STRUCTURE MONOREPO

```text
/root
├── client/                     # [Svelte 5 + Vite]
│   ├── src/
│   │   ├── lib/
│   │   │   ├── state/          # Stores Svelte 5 (.svelte.js) - Gestion Thème ici
│   │   │   ├── services/       # API Client & Audio Recorder
│   │   │   └── utils/          # Markdown Config & Audio Player
│   │   ├── assets/
│   │   ├── routes/
│   │   │   └── +layout.svelte  # Gestion globale (Deep Linking, Thème)
│   │   └── App.svelte
│   ├── electron/               # [Electron Main Process]
│   └── capacitor.config.ts     # [Mobile Config]
│
├── server/                     # [Node.js Express]
│   ├── server.js               # Entry Point
│   └── services/               # Logique Métier isolée
│       ├── ollama.service.js   # Gestion LLM & Streaming
│       ├── stt.service.js      # Traitement Audio Input (Whisper)
│       ├── tts.service.js      # Traitement Audio Output
│       └── storage.service.js  # Persistance JSON/SQLite
│
└── package.json                # Scripts globaux
```

## 4. MODÈLE DE DONNÉES (SCHEMA SIMPLIFIÉ)

**Convention :** Les IDs primaires et étrangers doivent être préfixés par le nom de l'entité.

### User
Représente l'utilisateur humain.

- `user_id`: UUID
- `username`: String
- `preferences`: JSON `{ "theme": "dark", "auto_play_audio": boolean }`

### User_AI (Persona)
Représente la configuration de l'IA (Personnalité).

- `user_ai_id`: UUID
- `name`: String (ex: "Jarvis")
- `system_prompt`: String (Instructions de base pour le LLM)
- `voice_id`: String (Identifiant de la voix TTS utilisée)
- `model`: String (Nom du modèle Ollama, ex: "mistral")

### Chat (Session)
Une conversation entre un User et un User_AI.

- `chat_id`: UUID
- `user_id`: Link → User
- `user_ai_id`: Link → User_AI
- `title`: String
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Message
Un échange unitaire dans un Chat.

- `message_id`: UUID
- `chat_id`: Link → Chat
- `role`: Enum `['user', 'assistant', 'system']`
- `content`: Text (Markdown brut)
- `audio_file_path`: String (Optionnel, chemin local)
- `timestamp`: Timestamp

## 5. FLUX DE DONNÉES (DATA FLOW)

### A. Flux Textuel (Streaming)

1. **UI :** Saisie utilisateur → Store Svelte (`chat.svelte.js`).
2. **Transport :** POST `/chat` vers Node.js.
3. **Backend :** Appel Ollama API (`stream: true`).
4. **Réponse :** Pipe du stream Ollama vers réponse HTTP (Chunked).
5. **Rendu :** Svelte met à jour `` à chaque chunk. Rendu via `marked` + `{@html}`.

### B. Flux Vocal (Audio)

1. **UI :** MediaRecorder capture l'audio → Blob.
2. **Transport :** Upload FormData vers Node.js.
3. **Backend STT :** Conversion Blob → Texte (Service STT).
4. **Backend LLM :** Texte → Ollama → Réponse Texte.
5. **Backend TTS :** Réponse Texte → Audio Buffer.
6. **UI :** Réception Audio → Lecture automatique.

## 6. DIRECTIVES IA (POUR CODING)

- **Svelte 5 Strict :** Utiliser exclusivement les Runes (``, ``, ``). Pas d'ancienne syntaxe.
- **Responsive UI :** Design Mobile First. Breakpoints Tailwind (`md:`, `lg:`) pour sidebar/chat.
- **Theming :** Attribut `data-theme` sur `<html>` géré par Svelte pour basculer les thèmes DaisyUI.
- **DaisyUI :** Utiliser les classes sémantiques (`chat`, `chat-start`, `chat-bubble`).
- **Gestion d'Erreur :** Streaming résilient (reconnexion, gestion timeout).
- **Sécurité :** Parsing Markdown obligatoire avant injection HTML.
- **Compatibilité :** Détection runtime (Electron vs Capacitor vs Web) pour adapter l'API Audio.

## 7. SPÉCIFICITÉS MOBILE (CAPACITOR & SVELTEKIT)

### Architecture Routing

- **Mode SPA Obligatoire :** Utilisation de `@sveltejs/adapter-static` avec `fallback: 'index.html'`.
- **SSR Désactivé :** `export const ssr = false;` et `export const prerender = true;` dans `src/routes/+layout.js`.

### Deep Linking (URLs Entrantes)

Capacitor n'utilise pas le router web standard pour les ouvertures d'app via custom scheme. Il faut intercepter l'événement `appUrlOpen` et router manuellement.

**Snippet requis (`src/routes/+layout.svelte`) :**

```javascript
import { onMount } from 'svelte';
import { goto } from '/navigation';
import { App } from '@capacitor/app';

onMount(() => {
    App.addListener('appUrlOpen', data => {
        // Nettoyage: "myapp://chat/123" -> "/chat/123"
        const slug = data.url.split('.com').pop(); 
        if (slug) goto(slug);
    });
});

## 8. PHASAGE DU DÉVELOPPEMENT

- **Phase 1 (Core) :** Serveur Node + Client Svelte Texte (Streaming) + Structure Données JSON + Theming.
- **Phase 2 (Audio) :** Pipeline STT/TTS complet.
- **Phase 3 (Platform) :** Configuration Capacitor (Android) et Electron (Desktop).
- **Phase 4 (Build) :** Packaging `.exe` et `.apk`.
