# Enquête : Wollama comme client MCP, avec `acp-team` en perspective

Date : 16 août 2026  
Portée : lecture de `D:\development\wollama` et `D:\development\acp-team`, confrontée aux versions actuelles de MCP et ACP.

## Objectif

Wollama doit se connecter à un ou plusieurs serveurs MCP, découvrir leurs outils et les rendre utilisables dans une conversation.

`acp-team` entre dans ce modèle sans adaptation de protocole particulière. C'est déjà un serveur MCP stdio qui cache les différences entre ACP, les CLI agents et les API de modèles.

```text
Web / Mobile / Electron
          |
          v
      API Wollama
          |
          v
 Conversation Orchestrator
 +---------------------------+
 | ProviderAdapter           |----> Ollama
 | ToolCatalog               |----> built-in + serveurs MCP
 | ToolExecutor              |----> validation + autorisations
 | RunManager / EventStore   |----> suivi, annulation, historique
 +-------------+-------------+
               |
               v
     MCP Connection Manager
       |                 |
       | stdio           | Streamable HTTP
       v                 v
    acp-team       autres serveurs MCP
       |
       +---- ACP / CLI / HTTP ----> Kimi, Codex, OpenCode, Ollama, ...
```

## Verdict

Le choix est bon, mais Wollama n'a pas encore le composant qui rendrait une connexion MCP utile. Le serveur Express et le schéma `tool_calls` ne suffisent pas : il manque la boucle qui transmet les définitions d'outils au modèle, intercepte ses appels, exécute l'outil puis relance le modèle avec le résultat.

| Capacité                 | État actuel           | Travail restant                                              |
| ------------------------ | --------------------- | ------------------------------------------------------------ |
| Client MCP stdio         | Absent                | Processus enfant, négociation, découverte, appels, fermeture |
| Client MCP HTTP          | Absent                | Transport distant, auth, reconnexion et politique réseau     |
| Catalogue d'outils       | Absent                | Namespace, cache de capacités, filtrage par utilisateur      |
| Boucle d'appels d'outils | Absente               | LLM → appel → résultat `role: tool` → LLM                    |
| Suivi des runs           | Partiel               | L'actuel runner attend la fin du handler                     |
| Autorisations            | Absentes dans Wollama | Consentement par outil, risque et workspace                  |
| Compatibilité `acp-team` | Bonne                 | Un client MCP stdio générique suffit                         |

Priorité : MCP stdio et boucle d'outils d'abord. Le transport HTTP viendra après, quand la même abstraction aura été prouvée avec `acp-team`.

## Ce qui existe dans Wollama

### Le chat relaie Ollama sans boucle d'outils

La route [`server/server.ts`](../../server/server.ts#L153) enrichit les messages, exécute les hooks `pre-send`, appelle `OllamaService.chat`, puis retransmet du NDJSON. L'appel aux lignes 227 à 231 ne fournit aucun tableau `tools`.

[`server/services/ollama.service.ts`](../../server/services/ollama.service.ts#L6) transmet le payload à Ollama sans couche de fournisseur et utilise `any`. Côté client, [`client/src/lib/services/chat.service.ts`](../../client/src/lib/services/chat.service.ts#L250) ne traite que `json.message.content` et `json.done`. Aucun code ne collecte `tool_calls`, n'ajoute de message `role: 'tool'` ni ne lance le tour suivant.

Il faut corriger un écart adjacent avant de brancher MCP : le serveur attend `chat_id`, `user_id` ou `companion_id` pour activer les hooks, alors que le corps envoyé aux lignes 255 à 260 ne contient aucun de ces identifiants. Le flux principal contourne donc normalement son propre hook `pre-send`.

### Les briques agentiques ne forment pas encore un runtime

- Le schéma définit `skills`, `agents`, `hooks` et `tool_calls` dans [`shared/db/database-scheme.ts`](../../shared/db/database-scheme.ts#L232).
- [`server/services/agent-runner.service.ts`](../../server/services/agent-runner.service.ts#L20) écrit un état `running`, mais attend directement le résultat du handler. Son endpoint de statut ne suit pas un vrai travail en arrière-plan.
- [`server/agents/index.ts`](../../server/agents/index.ts#L1) contient seulement deux agents codés en dur.
- [`server/services/hook-pipeline.service.ts`](../../server/services/hook-pipeline.service.ts#L20) sait ordonner et isoler les hooks built-in. Les handlers `llm` et `skill` restent absents aux lignes 54 à 59.
- `post-receive` et `on-tool-result` existent dans les types sans être raccordés à la route de chat.
- Les skills `llm` renvoient toujours HTTP 501 dans [`server/routes/skills.ts`](../../server/routes/skills.ts#L70).

Ce travail n'est pas perdu. Les noms sont utiles, la persistance existe, mais MCP doit passer par un runtime commun plutôt que par une nouvelle route collée à côté.

## Ce que fournit le dépôt local `acp-team`

Le dépôt analysé est bien `D:\development\acp-team`, package `@medyll/acp-team` 1.0.5.

### Un serveur MCP prêt à être consommé

[`../acp-team/src/mcp-server.js`](../../../acp-team/src/mcp-server.js#L1) construit un `McpServer` et utilise `StdioServerTransport`. [`../acp-team/package.json`](../../../acp-team/package.json#L1) demande Node 20+, `@modelcontextprotocol/sdk` `^1.24.1` et Zod 3.

Les outils qui comptent pour Wollama sont :

- `agent_start`, qui rend immédiatement un `run_id` ;
- `agent_watch`, avec curseur d'événements et attente bornée ;
- `agent_stop`, utilisable avant ou après la création d'une session agent ;
- `agent_fanout` pour les délégations parallèles ;
- `agent_list`, `agent_status`, `run_history`, `run_show` et `run_retry` ;
- les outils de budget, d'usage, de configuration et de diagnostic.

[`../acp-team/src/runs/run-manager.js`](../../../acp-team/src/runs/run-manager.js#L87) gère déjà les files d'attente, la concurrence par agent, l'annulation et les événements séquencés. Il distingue `queued`, `running`, `cancelling`, `completed`, `failed` et `cancelled`.

### Wollama n'a pas besoin de parler ACP

`acp-team` parle ACP avec Kimi et OpenCode, pilote Codex par son flux JSONL, et joint Ollama en HTTP. Le contrat dans [`../acp-team/src/agents/agent.js`](../../../acp-team/src/agents/agent.js#L1) renvoie une forme commune quels que soient le transport ou le fournisseur.

Wollama doit donc considérer `acp-team` comme n'importe quel serveur MCP. Une implémentation ACP directe dans Wollama doublerait du code déjà testé sans débloquer de besoin utilisateur supplémentaire.

### Frontière d'autorisation à préserver

Les appels `acp-team` sans mode utilisent `plan`, donc la lecture seule. `default` et `auto` demandent un jeton court lié à l'agent, au dossier, au mode, à une durée et à un nombre d'usages. Seul son hash reste sur disque.

Wollama ne doit ni fabriquer ces jetons depuis un outil MCP, ni les synchroniser par RxDB/PouchDB. Le backend peut les garder en mémoire après une confirmation explicite dans l'interface, puis les oublier une fois le run lancé.

Autre point pratique : `acp-team` prend le cwd du processus par défaut. Wollama doit toujours fournir un workspace résolu et autorisé. Le répertoire d'installation du serveur ne doit jamais devenir le dossier de travail implicite d'un agent.

### État après redémarrage

`acp-team` journalise le cycle de vie dans `runs.jsonl`, mais pas les réponses ni les sessions actives. Après un crash, il marque les runs ouverts comme `interrupted` au lieu de prétendre les reprendre.

Si Wollama veut restaurer l'écran après un redémarrage ou synchroniser l'historique entre appareils, il doit stocker ses propres snapshots de run, les événements publics utiles et le résultat final.

## Version MCP à cibler

La spécification stable du 28 juillet 2026 fonctionne avec des requêtes JSON-RPC autonomes et une négociation de capacités par requête. Le SDK TypeScript v2 est maintenant réparti entre client, serveur et adaptateurs de runtime. Pour Wollama, seul le paquet client et ses transports comptent. Voir la [spécification MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28), le [résumé des changements](https://blog.modelcontextprotocol.io/posts/2026-07-28/) et le [guide client TypeScript v2](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-client.html).

Choix conseillé :

- nouveau code Wollama avec `@modelcontextprotocol/client` v2 ;
- connexion `acp-team` en stdio et mode legacy explicite tant qu'il reste sur le SDK MCP v1 ;
- négociation `auto` pour les autres serveurs afin d'accepter la révision moderne et le repli 2025 ;
- aucune dépendance aux surfaces `roots`, `sampling` et logging dépréciées ;
- gestion de `input_required` pour les confirmations ou paramètres manquants.

La politique de version doit appartenir à chaque connexion, pas à une constante globale. `acp-team` et un serveur HTTP récent ne parleront pas forcément la même révision.

## Architecture de code recommandée

```text
server/orchestration/
  conversation-orchestrator.ts
  provider-adapter.ts
  tool-catalog.ts
  tool-executor.ts
  permission-service.ts
  run-manager.ts
  event-store.ts

server/mcp/
  connection-manager.ts
  connection-config.ts
  stdio-connection.ts
  http-connection.ts
  capability-cache.ts
  remote-tool.adapter.ts
  acp-team.adapter.ts
```

Le client Svelte ne doit pas ouvrir lui-même les connexions MCP. Le backend Node garde les processus stdio, les credentials HTTP et les limites de workspace ; Web, Electron et Capacitor passent tous par la même API Wollama.

Contrats centraux :

```typescript
interface ToolDescriptor {
	id: string; // ex. mcp:acp-team:agent_start
	serverId: string;
	name: string;
	description?: string;
	inputSchema: Record<string, unknown>;
	outputSchema?: Record<string, unknown>;
	risk: 'read' | 'write' | 'execute' | 'external';
}

interface ToolRuntime {
	list(context: ExecutionContext): Promise<ToolDescriptor[]>;
	call(toolId: string, input: unknown, context: ExecutionContext): Promise<ToolResult>;
}

interface RunBackend {
	start(request: RunRequest): Promise<RunHandle>;
	watch(handle: RunHandle, after: number): Promise<RunSnapshot>;
	cancel(handle: RunHandle): Promise<void>;
}
```

`AcpTeamBackend` mappe `start`, `watch` et `cancel` vers `agent_start`, `agent_watch` et `agent_stop`. Les agents built-in de Wollama devront adopter ce même contrat ou disparaître progressivement, sinon le projet conservera deux systèmes de run incompatibles.

## Données à ajouter

| Collection         | Contenu                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `mcp_servers`      | transport, commande ou URL, état, révision préférée, propriétaire et scope |
| `mcp_capabilities` | copie datée des tools, resources et prompts découverts                     |
| `mcp_grants`       | décisions par serveur, outil, risque et contexte                           |
| `runs`             | état normalisé, backend, handle distant, chat/message, dates et erreur     |
| `run_events`       | événements ordonnés nécessaires à l'interface et à l'audit                 |
| `tool_calls`       | appel atomique, entrée validée, sortie filtrée et provenance               |
| `secret_refs`      | références opaques vers un coffre local, jamais les secrets eux-mêmes      |

États communs : `queued`, `running`, `waiting_input`, `cancelling`, `completed`, `failed`, `cancelled`, `interrupted` et `timed_out`.

Le fichier [`shared/db/database-scheme.ts`](../../shared/db/database-scheme.ts) reste la source de vérité. Les commandes de processus, variables d'environnement, OAuth tokens et autorisations `acp-team` ne doivent pas apparaître en clair dans les collections synchronisées.

## Ordre d'implémentation

| Jalon | Résultat vérifiable                                                | Limite du jalon                                            |
| ----- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| M0    | `ProviderAdapter`, `ToolRuntime`, `RunBackend` et événements typés | Le comportement du chat reste identique                    |
| M1    | Boucle Ollama avec un outil built-in en lecture seule              | Un test prouve les deux tours modèle                       |
| M2    | Client MCP stdio générique                                         | `tools/list` et `tools/call` passent contre un fixture     |
| M3    | Connexion au dépôt local `acp-team`                                | `agent_list` fonctionne depuis Wollama                     |
| M4    | Run `plan` supervisé                                               | `agent_start`, suivi et annulation fonctionnent            |
| M5    | Persistance des runs et rendu Svelte                               | Un rechargement conserve l'état visible                    |
| M6    | Autorisations de workspace et modes d'écriture                     | Aucun write sans consentement récent                       |
| M7    | Client MCP Streamable HTTP                                         | Auth, révocation, timeout et reconnexion passent les tests |

Le premier morceau fonctionnel doit rester petit : Wollama lance `acp-team` depuis le backend, découvre les outils, appelle `agent_list`, puis exécute un run `plan`. Pas de fan-out, de configuration ni de mode écriture avant que ce trajet soit testé de bout en bout.

## Règles de sécurité côté client MCP

- Chaque serveur reçoit un identifiant et un namespace d'outils stable.
- Wollama valide les arguments avec le schéma annoncé, tout en traitant descriptions et annotations comme non fiables.
- L'utilisateur autorise séparément lecture, écriture, exécution et action réseau externe.
- Les workspaces passent par une allowlist et une résolution de chemin réel.
- Les serveurs stdio démarrent avec une liste d'environnement réduite ; stderr ne doit jamais contaminer stdout JSON-RPC.
- Les connexions HTTP bloquent les redirections et destinations privées inattendues, avec une exception explicite pour les serveurs locaux choisis par l'utilisateur.
- Les résultats ont une limite de taille, les appels un timeout, les runs une limite de concurrence et les conversations une limite de tours d'outil.
- Le journal conserve la provenance : modèle, serveur MCP, outil, décision, durée, état et résultat filtré.
- Wollama détecte les cycles et refuse qu'un outil rappelle indéfiniment le même serveur à travers une passerelle.

## Décisions retenues

1. Wollama sera uniquement hôte/client MCP.
2. `acp-team` sera le premier serveur MCP réel utilisé pour valider l'architecture.
3. MCP stdio arrive avant Streamable HTTP.
4. Wollama ne réimplémente pas ACP au premier cycle.
5. Le code neuf part sur le SDK MCP TypeScript v2, avec une connexion legacy dédiée à `acp-team` 1.0.5.
6. Le runtime d'outils précède l'interface de configuration des serveurs.
7. Les modes d'écriture restent fermés jusqu'à l'arrivée du service d'autorisation et de l'écran de consentement.

## Risque principal

Le protocole n'est pas le morceau difficile. Le vrai danger consiste à garder trois chemins d'exécution séparés : le chat Ollama, `AgentRunnerService` et le futur client MCP. Ils finiraient avec des états, des permissions et des historiques différents.

Commencer par `ToolRuntime` et `RunBackend` évite cette divergence. Une fois cette base en place, `acp-team` devient une connexion MCP parmi d'autres, exactement comme souhaité.
