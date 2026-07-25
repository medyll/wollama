# PRD — Wollama : Système Agents / Skills / Hooks

**Version:** 1.0
**Date:** 2026-03-22
**Statut:** In Progress
**Owner:** Solo developer

---

## 1. Problème

Wollama est aujourd'hui un chat IA passif : l'utilisateur envoie un message, l'IA répond. Il n'existe aucun moyen d'invoquer des capacités spécifiques inline, aucune façon pour l'IA d'agir sur des ressources externes, et aucun mécanisme pour enrichir automatiquement le contexte de chaque conversation.

Depuis la création du projet, un modèle architectural a émergé (notamment via Claude Code / MCP) qui répond exactement à ce besoin : **skills** (commandes slash activables par l'utilisateur), **agents** (sous-processus autonomes côté serveur), et **hooks** (middleware événementiel). Ce PRD formalise l'adoption de ce modèle dans Wollama.

---

## 2. User Stories

### Skills (commandes slash)

- En tant qu'utilisateur, je tape `/translate fr` suivi d'un texte et le message est traduit en français dans la réponse.
- En tant qu'utilisateur, je tape `/summarize` et le compagnon résume la conversation actuelle.
- En tant qu'utilisateur, je tape `/help` et vois la liste des skills disponibles avec leur description.
- En tant qu'utilisateur, l'autocomplétion me propose les skills dès que je tape `/` dans le chat.
- En tant qu'administrateur, je peux activer/désactiver des skills par compagnon depuis les paramètres.

### Agents (actions autonomes)

- En tant qu'utilisateur, je tape `/search Svelte 5 runes` et un agent récupère des résultats web qui sont injectés dans le contexte avant que l'IA réponde.
- En tant qu'utilisateur, je tape `/fetch https://example.com` et l'agent récupère le contenu de la page pour l'IA.
- En tant qu'utilisateur, je vois l'état d'exécution de l'agent (spinner → résultat) dans le fil de messages.

### Hooks (automatisations)

- En tant qu'utilisateur, chaque message que j'envoie est automatiquement enrichi de la date/heure courante (hook `inject-datetime`, pre-send).
- En tant que compagnon configuré, un hook `on-session-start` injecte un contexte météo ou de localisation.
- En tant qu'utilisateur, un hook `post-receive` nettoie automatiquement les espaces superflus dans les réponses.
- En tant que développeur, je peux inspecter le `hook_log` de chaque message pour déboguer les hooks actifs.

---

## 3. Exigences clés

### Skills

- [ ] Détection de `/command [args]` dans le texte de l'input utilisateur.
- [ ] Autocomplétion dropdown déclenchée à la frappe de `/`.
- [ ] Chaque skill a : nom, slug, description, icône, `handler_type` (builtin | llm | agent), `handler_ref`.
- [ ] Skills persistés en DB et synchronisés cross-device via RxDB ↔ PouchDB.
- [ ] Scope : global, user, ou companion-specific.

### Agents

- [ ] Agents exécutés côté serveur en tâches async.
- [ ] Résultat injecté comme message `role: 'tool'` dans l'historique avant l'appel Ollama.
- [ ] Table `tool_calls` : traçabilité complète (input, output, status, timestamps).
- [ ] Polling ou SSE pour l'état d'un agent en cours d'exécution.
- [ ] Agents built-in v1 : `WebSearchAgent`, `PageFetchAgent`.

### Hooks

- [ ] Pipeline synchrone : `on-session-start → pre-send → [LLM] → post-receive → persist`.
- [ ] Hooks exécutés en ordre de priorité (numérique, croissant).
- [ ] Hooks non-bloquants par défaut (échec isolé, loggé, non-fatal).
- [ ] Interface `HookContext` mutable : hooks peuvent modifier `message.content` et `session_metadata`.
- [ ] Hooks built-in v1 : `inject-datetime` (pre-send), `trim-whitespace` (post-receive).
- [ ] Scope : global, user, ou companion.

### Infrastructure

- [ ] Overhead hook pipeline < 200ms sur un message standard.
- [ ] Réplication correcte des nouvelles tables (skills, agents, hooks, tool_calls) via CouchDB sync.
- [ ] Fonctionnel sur Web, Electron (desktop), Capacitor (mobile).
- [ ] Pas de breaking change sur l'API chat existante (`POST /api/chat/generate`).

---

## 4. Hors scope (v1)

- Orchestration multi-agents (graphes d'agents, dépendances entre agents).
- Connexions à des serveurs MCP distants.
- Exécution de code en sandbox (shell, Docker, Python).
- Marketplace de skills/hooks.
- Auth OAuth pour les skills (ex. Google Calendar).

---

## 5. Critères de succès

| Critère                         | Mesure                                                      |
| ------------------------------- | ----------------------------------------------------------- |
| 3 skills built-in opérationnels | `/translate`, `/summarize`, `/help` fonctionnent end-to-end |
| 2 agents built-in opérationnels | `WebSearchAgent`, `PageFetchAgent` retournent des résultats |
| Overhead hook pipeline          | < 200ms mesuré sur 10 messages consécutifs                  |
| Réplication skills/hooks        | Créer un skill sur onglet A → visible sur onglet B < 5s     |
| Builds cross-platform           | Electron + Capacitor buildent sans erreur                   |
| Couverture tests                | HookPipeline, SkillResolver, AgentRunner : > 80% lignes     |

---

## 6. Architecture résumée

```
ChatInput → SlashCommandParser → POST /api/chat/:id/messages
                                          │
                     ┌────────────────────▼─────────────────────┐
                     │  HookPipeline (server/Express)            │
                     │  [on-session-start] → enrichissement      │
                     │  [pre-send hooks]   → mutation message    │
                     │       → SkillResolver (si /command)       │
                     │           → SkillRunner                   │
                     │               → AgentRunner (si agent)    │
                     │       → OllamaService (contexte enrichi)  │
                     │  [post-receive hooks] → mutation réponse  │
                     │       → PersistMessage (PouchDB)          │
                     └──────────────────────────────────────────┘
                                          ↕ CouchDB replication
                               RxDB client (skills/hooks/tool_calls)
```

---

## 7. Nouvelles tables DB

### `skills`

| Champ                   | Type      | Description                 |
| ----------------------- | --------- | --------------------------- |
| skill_id                | uuid      | PK                          |
| name                    | string    | slug ex: "translate"        |
| display_name            | string    | "Translate"                 |
| description             | string    | Affiché dans l'autocomplete |
| command                 | string    | "/translate"                |
| icon                    | string    | emoji ou URL                |
| input_schema            | json      | JSON Schema des arguments   |
| handler_type            | enum      | builtin \| llm \| agent     |
| handler_ref             | string    | nom fn builtin ou agent_id  |
| scope                   | enum      | global \| user \| companion |
| is_enabled              | boolean   |                             |
| created_at / updated_at | timestamp |                             |

### `agents`

| Champ                   | Type      | Description                                       |
| ----------------------- | --------- | ------------------------------------------------- |
| agent_id                | uuid      | PK                                                |
| name                    | string    |                                                   |
| description             | string    |                                                   |
| type                    | enum      | web_search \| file_reader \| page_fetch \| custom |
| config                  | json      | config spécifique (API key, base_url...)          |
| is_enabled              | boolean   |                                                   |
| created_at / updated_at | timestamp |                                                   |

### `hooks`

| Champ                   | Type      | Description                                                                      |
| ----------------------- | --------- | -------------------------------------------------------------------------------- |
| hook_id                 | uuid      | PK                                                                               |
| name                    | string    |                                                                                  |
| event                   | enum      | pre-send \| post-receive \| on-session-start \| on-session-end \| on-tool-result |
| handler_type            | enum      | builtin \| llm \| skill                                                          |
| handler_ref             | string    |                                                                                  |
| priority                | number    | Ordre d'exécution (croissant)                                                    |
| scope                   | enum      | global \| user \| companion                                                      |
| scope_id                | uuid?     | user_id ou companion_id si scoped                                                |
| is_enabled              | boolean   |                                                                                  |
| config                  | json      | config spécifique au hook                                                        |
| created_at / updated_at | timestamp |                                                                                  |

### `tool_calls`

| Champ                    | Type      | Description                         |
| ------------------------ | --------- | ----------------------------------- |
| tool_call_id             | uuid      | PK                                  |
| message_id               | uuid      | FK → messages                       |
| agent_id                 | uuid      | FK → agents                         |
| skill_id                 | uuid?     | FK → skills si déclenché par skill  |
| status                   | enum      | pending \| running \| done \| error |
| input                    | json      |                                     |
| output                   | json      |                                     |
| error                    | string?   |                                     |
| started_at / finished_at | timestamp |                                     |

### Extensions tables existantes

- `messages` : + `tool_call_id?`, `skill_invoked?`, `hook_log?` (array de {hook_id, event, duration_ms, mutated})
- `companions` : + `hooks` (uuid[]), `skills` (uuid[])

---

## 8. Plan de livraison (6 sprints)

| Sprint | Focus                                                  | Durée estimée |
| ------ | ------------------------------------------------------ | ------------- |
| S1     | Foundation DB + interfaces TS                          | 1 semaine     |
| S2     | Hook Pipeline + middleware chat                        | 1 semaine     |
| S3     | Skills + slash commands + UI autocomplete              | 1 semaine     |
| S4     | Agents built-in (WebSearch, PageFetch)                 | 1 semaine     |
| S5     | Frontend UX (ToolCallMessage, HookInspector, Settings) | 1 semaine     |
| S6     | Tests, polish, cross-platform validation               | 1 semaine     |
