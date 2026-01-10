# Corrections des Régressions Critiques - Onboarding & Companions

**Date:** 2026-01-10  
**Commit:** f9c4d0e  
**Status:** ✅ Toutes les régressions corrigées

---

## Contexte

Suite à la consolidation des Epics 1-3, plusieurs régressions critiques ont été découvertes empêchant l'utilisation normale de l'application:

- URL Ollama incorrecte dans l'onboarding (port 3000 au lieu de 11434)
- Companions système non chargés ("No companions available")
- Skip button non fonctionnel
- Menu visible pendant l'onboarding
- Rafraîchissement renvoyant à l'onboarding
- Chat échouant avec "Generation failed" (serveur non atteint)

---

## Problèmes Identifiés et Solutions

### 1. URL Ollama Incorrecte (Port 11434 vs 3000)

**Problème:**

- L'onboarding affichait `http://localhost:3000` par défaut pour Ollama
- Port 3000 = serveur d'application Wollama
- Port 11434 = service Ollama

**Impact:**

- Test de connexion échouait
- Impossible de valider l'étape 2 de l'onboarding
- Chat ne pouvait pas générer de réponses

**Solution:**

```typescript
// client/src/lib/state/user.svelte.ts
preferences = $state({
	ollamaUrl: 'http://localhost:11434', // ✅ Ollama service
	serverUrl: 'http://localhost:3000' // ✅ Wollama app server
	// ...
});
```

```svelte
<!-- client/src/routes/onboarding/OnboardingWizard.svelte -->
let serverUrl = $state(userState.preferences.ollamaUrl || 'http://localhost:11434');
```

**Fichiers modifiés:**

- `client/src/lib/state/user.svelte.ts` (ajout `ollamaUrl`)
- `client/src/routes/onboarding/OnboardingWizard.svelte` (bind à `ollamaUrl`)

---

### 2. Confusion entre serverUrl (Application) et Ollama URL

**Problème:**

- `CompanionEditor.svelte` utilisait `serverUrl` (3000) pour contacter Ollama `/api/tags`
- Requête échouait car Ollama n'est pas sur le port 3000

**Architecture clarifiée:**

```
┌─────────────────────────────────────────┐
│ CLIENT (Browser/Electron)               │
│                                         │
│  ┌──────────┐        ┌──────────┐      │
│  │ChatService│───────▶│serverUrl │      │
│  │          │        │  :3000   │      │
│  └──────────┘        └──────────┘      │
│       │                                 │
│       │ /api/chat/generate              │
│       ▼                                 │
│  ┌──────────┐        ┌──────────┐      │
│  │Companion │───────▶│ollamaUrl │      │
│  │Editor    │        │  :11434  │      │
│  └──────────┘        └──────────┘      │
│       │                                 │
│       │ /api/tags                       │
│       ▼                                 │
└─────────────────────────────────────────┘
           │                    │
           │                    │
           ▼                    ▼
    ┌──────────┐          ┌──────────┐
    │ SERVER   │          │ OLLAMA   │
    │ :3000    │          │ :11434   │
    └──────────┘          └──────────┘
         │                      ▲
         │                      │
         └──────────────────────┘
           Server relays chat requests
```

**Solution:**

```svelte
<!-- client/src/components/CompanionEditor.svelte -->
// Avant: const serverUrl = userState.preferences.serverUrl || 'http://localhost:11434'; // Après: const ollamaUrl = userState.preferences.ollamaUrl
|| 'http://localhost:11434'; const response = await fetch(`${ollamaUrl}/api/tags`);
```

**Fichiers modifiés:**

- `client/src/components/CompanionEditor.svelte`

---

### 3. Skip Button Non Fonctionnel

**Problème:**

```typescript
async function completeOnboarding() {
	if (userState.uid) {
		// ❌ uid peut être null pendant l'onboarding
		// ...
	}
}
```

**Impact:**

- Impossible de skip l'onboarding si uid non défini
- Button skip ne faisait rien

**Solution:**

```typescript
async function completeOnboarding() {
	// ✅ Pas besoin de uid pour compléter l'onboarding
	try {
		Object.assign(userState.preferences, { onboarding_completed: true });
		userState.save();
		goto('/chat');
	} catch (error) {
		console.error('Failed to complete onboarding:', error);
	}
}
```

**Fichiers modifiés:**

- `client/src/routes/onboarding/OnboardingWizard.svelte`

---

### 4. Persistence de onboarding_completed

**Problème:**

- `onboarding_completed` n'était pas défini dans les preferences par défaut
- Rafraîchissement de la page renvoyait à l'onboarding même après complétion

**Solution:**

```typescript
// client/src/lib/state/user.svelte.ts
preferences = $state({
	// ...
	onboarding_completed: false // ✅ Ajouté aux defaults
});
```

**Vérification au démarrage:**

```typescript
// client/src/routes/+layout.svelte
onMount(async () => {
	await DataInitializer.initializeDefaults();

	if (!userState.preferences.onboarding_completed) {
		goto('/onboarding');
		return;
	}
});
```

**Fichiers modifiés:**

- `client/src/lib/state/user.svelte.ts` (ajout champ)

---

### 5. Menu Visible Pendant l'Onboarding

**Problème:**

- Sidebar et Navbar affichés pendant l'onboarding
- Mauvaise UX (utilisateur pouvait naviguer avant configuration)

**Solution:**

```svelte
<!-- client/src/routes/+layout.svelte -->
{#if userState.preferences.onboarding_completed}
	<div class="drawer md:drawer-open h-screen overflow-hidden">
		<!-- Navbar + Sidebar + Content -->
	</div>
{:else}
	<!-- Onboarding mode: no sidebar/navbar -->
	<main class="h-screen w-screen overflow-hidden">
		{@render children()}
	</main>
{/if}
```

**Résultat:**

- Mode full-screen pour l'onboarding
- Pas de distraction UI
- Navigation forcée dans le wizard

**Fichiers modifiés:**

- `client/src/routes/+layout.svelte`

---

### 6. "No companions available" dans l'Onboarding

**Problème:**

```typescript
// DEFAULT_COMPANIONS manquait le champ is_locked: true
{
  companion_id: '1',
  name: 'General Assistant',
  // is_locked: MANQUANT ❌
}
```

```typescript
// CompanionSelector.svelte filtre par is_locked
companions = all.filter((c): c is Companion => 'is_locked' in c && c.is_locked === true);
// ❌ Aucun companion ne matchait le filtre
```

**Impact:**

- Liste vide dans l'étape 3 de l'onboarding
- Impossible de sélectionner un companion
- Message d'erreur "No companions available"

**Solution:**

```typescript
// shared/configuration/data-default.ts
export const DEFAULT_COMPANIONS: Partial<Companion>[] = [
	{
		companion_id: '1',
		name: 'General Assistant',
		is_locked: true // ✅ Ajouté à tous les 6 companions
		// ...
	}
	// ... tous les autres avec is_locked: true
];
```

**Fichiers modifiés:**

- `shared/configuration/data-default.ts` (6 companions)

---

### 7. Version Base de Données Incrémentée

**Justification:**

- Modification du schéma `preferences` (ajout `ollamaUrl`, `onboarding_completed`)
- Changement structurel nécessite nouvelle version

**Changement:**

```typescript
// client/src/lib/db.ts
const db = await createRxDatabase({
	name: 'wollama_client_db_v14' // v13 → v14
	// ...
});
```

**Impact:**

- Nouvelle base de données créée
- Anciennes données conservées (v13 reste en IndexedDB)
- Re-initialisation des données par défaut

**Fichiers modifiés:**

- `client/src/lib/db.ts`

---

## Tests de Validation

### ✅ Test 1: Onboarding - URL Ollama par Défaut

```
1. Effacer localStorage
2. Rafraîchir l'app
3. Vérifier Step 1 → Step 2
4. Vérifier input affiche "http://localhost:11434" ✅
```

### ✅ Test 2: Onboarding - Skip Button

```
1. Onboarding Step 1 → Skip
2. Vérifie redirection vers /chat ✅
3. Vérifie onboarding_completed = true ✅
4. Rafraîchir → reste sur /chat ✅
```

### ✅ Test 3: Companions Disponibles

```
1. Onboarding Step 3
2. Vérifie liste de 6 companions affichée ✅
3. Vérifie "General Assistant", "Expert Coder", etc. ✅
```

### ✅ Test 4: Menu Caché Pendant Onboarding

```
1. Effacer localStorage
2. Rafraîchir
3. Vérifie absence Sidebar ✅
4. Vérifie absence Navbar ✅
5. Compléter onboarding
6. Vérifie présence Sidebar + Navbar ✅
```

### ✅ Test 5: Chat Generation

```
1. Compléter onboarding
2. Créer nouveau chat
3. Envoyer "hello"
4. Vérifie requête POST vers http://localhost:3000/api/chat/generate ✅
5. Vérifie streaming de réponse ✅
```

---

## Récapitulatif des Fichiers Modifiés

| Fichier                                                | Changements                                  | Raison                             |
| ------------------------------------------------------ | -------------------------------------------- | ---------------------------------- |
| `client/src/lib/state/user.svelte.ts`                  | + `ollamaUrl`, `onboarding_completed`        | Séparation Ollama/App, persistence |
| `client/src/routes/onboarding/OnboardingWizard.svelte` | Bind `ollamaUrl`, fix `completeOnboarding()` | URL correcte, skip button          |
| `client/src/routes/+layout.svelte`                     | Condition `onboarding_completed`             | Cacher menu pendant onboarding     |
| `client/src/components/CompanionEditor.svelte`         | `ollamaUrl` au lieu de `serverUrl`           | Contacter Ollama directement       |
| `client/src/lib/db.ts`                                 | v13 → v14                                    | Migration schéma                   |
| `shared/configuration/data-default.ts`                 | + `is_locked: true` (6 companions)           | Identification companions système  |

---

## État Final

### ✅ Régressions Corrigées

1. ✅ URL Ollama par défaut (11434)
2. ✅ Confusion serverUrl/ollamaUrl clarifiée
3. ✅ Skip button fonctionnel
4. ✅ Persistence onboarding_completed
5. ✅ Menu caché pendant onboarding
6. ✅ Companions système chargés
7. ✅ DB version incrémentée

### ✅ Epics Complets

- Epic 1: Onboarding & Server Connection (4/4)
- Epic 2: Companion System (4/4)
- Epic 3: Chat Interface & Messaging (4/4)

### 📋 Prochaines Étapes

- Epic 4: Sync & Offline Support (0/4)
- Epic 5: Testing & Reliability (0/5)

---

## Notes Techniques

### Architecture URLs

```typescript
// Client preferences
{
  ollamaUrl: 'http://localhost:11434',   // Direct Ollama API
  serverUrl: 'http://localhost:3000',    // Wollama backend API
}

// Usage patterns:
// - ollamaUrl: CompanionEditor /api/tags, Model selection
// - serverUrl: ChatService /api/chat/generate, Audio APIs, Sync
```

### Companion Ownership Model

```typescript
// System companions (read-only)
interface Companion {
	companion_id: string;
	is_locked: true; // Identifies system companions
	// ...
}

// User companions (editable)
interface UserCompanion {
	user_companion_id: string;
	companion_id?: string; // If fork, references original
	user_id: string;
	// ...
}

// Filter logic in CompanionSelector:
companions.filter((c) => 'is_locked' in c && c.is_locked === true);
```

### Onboarding Flow

```
Step 0: Intro → Step 1: Server Config (ollamaUrl) → Step 2: Companion Selection
                    ↓                                           ↓
              Test Connection                            Select Companion
              (Ollama /api/version)                      (Optional, can skip)
                    ↓                                           ↓
              Store ollamaUrl                           Store companion_id
                    ↓                                           ↓
                    └───────────────────────────────────────────┘
                                      ↓
                          onboarding_completed = true
                          userState.save()
                          goto('/chat')
```
