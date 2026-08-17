# Wollama

Wollama est une application de chat pour Ollama. Elle fonctionne dans le navigateur, avec Electron sur ordinateur et avec Capacitor sur mobile.

Les conversations et les réglages restent disponibles hors ligne. Quand le serveur revient, RxDB synchronise les données avec PouchDB.

## Fonctionnalités

- Chat en streaming avec rendu Markdown, coloration du code, pièces jointes et historique local.
- Recherche dans les conversations, les messages et les noms d’assistants.
- Compagnons configurables : modèle, prompt système, voix, ton, humeur, spécialisation et avatar.
- Entrée vocale avec Whisper et lecture des réponses avec Piper ou Chatterbox.
- Téléchargement et sélection des modèles Ollama depuis les réglages.
- Base de connaissances RAG alimentée par des fichiers ou une page web.
- Skills avec commandes slash, dont `/help`, `/summarize` et `/translate`.
- Hooks avant et après traitement des messages, avec activation depuis les réglages.
- Agents de recherche web et de lecture de page.
- Onboarding, profil local protégé par mot de passe et connexion facultative pour la synchronisation.
- Thème clair ou sombre, cinq langues et interface responsive.
- Liens profonds sur mobile et fonctionnement hors ligne.

## Stack

| Partie          | Technologies                                                  |
| --------------- | ------------------------------------------------------------- |
| Client          | Svelte 5, SvelteKit, Vite, Tailwind CSS 4, `@medyll/css-base` |
| Serveur         | Node.js, Express, PouchDB                                     |
| Stockage client | RxDB et IndexedDB                                             |
| Bureau          | Electron                                                      |
| Mobile          | Capacitor                                                     |
| IA et audio     | Ollama, Whisper, Piper, Chatterbox                            |
| Tests           | Vitest et Playwright                                          |

## Prérequis

- Node.js 20 ou plus récent
- pnpm 11
- Ollama sur `http://127.0.0.1:11434`
- Android Studio uniquement pour Android

Préparez au moins un modèle Ollama :

```bash
ollama serve
ollama pull mistral
```

## Installation

```bash
git clone https://github.com/medyll/wollama.git
cd wollama
pnpm install
```

Les modèles audio sont facultatifs :

```bash
pnpm setup:audio
```

## Développement

Lancez le serveur et le client dans deux terminaux :

```bash
pnpm dev:server
```

```bash
pnpm dev:client
```

Le client écoute sur `http://localhost:5173` et le serveur sur `http://localhost:3000`.

Pour Electron :

```bash
pnpm dev:electron
```

Pour Android :

```bash
pnpm build
pnpm --filter @wollama/client exec cap sync android
pnpm --filter @wollama/client exec cap run android
```

## Vérifications

```bash
pnpm check
pnpm test:client -- --run
pnpm test:server
```

Tests navigateur :

```bash
pnpm --filter @wollama/client exec playwright install
pnpm --filter @wollama/client exec playwright test
```

État actuel : 216 tests client et 74 tests serveur passent. Playwright couvre notamment l’onboarding, le shell du chat, les réglages, le responsive, les compagnons, les skills et la synchronisation entre appareils.

## Structure

```text
wollama/
├── client/       Application Svelte, Electron et Capacitor
├── server/       API Express, Ollama, audio, RAG, skills et agents
├── shared/       Schémas et types partagés
└── packages/     Paquets internes, dont Chatterbox
```

Le schéma de données de référence se trouve dans `shared/db/database-scheme.ts`.

## Configuration

Si Ollama refuse les requêtes du client, autorisez son origine :

```bash
OLLAMA_ORIGINS="*" ollama serve
```

Les données du serveur sont stockées dans `server/db_data/`. Effacer les données du navigateur déclenche une nouvelle synchronisation depuis le serveur.
