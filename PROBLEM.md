# Processus Node orphelins après les tests E2E sous Windows

## Statut

Incident reproduit et cause localisée le 4 septembre 2026. Aucun correctif n'a encore été appliqué.

## Résumé

Des tests Playwright lancent le backend TypeScript avec cette chaîne de processus sous Windows :

```text
cmd.exe /c tsx.cmd server.ts
  -> node.exe ... tsx/dist/cli.mjs server.ts
     -> node.exe --require ...tsx... --import ...tsx... server.ts
```

Le teardown conserve seulement le `ChildProcess` retourné pour `cmd.exe`, puis appelle `serverProc.kill()`. Sous Windows, tuer ce shell ne tue pas forcément ses descendants. Le lanceur Node et le worker `tsx` continuent alors à tourner sans parent utile.

Trois workers abandonnés ont consommé environ 1,9 Go de mémoire physique et presque trois cœurs en continu pendant plusieurs jours. Le Gestionnaire des tâches les présentait comme trois groupes « Node.js JavaScript Runtime (2) ».

## Preuves relevées sur la machine

Capture effectuée le 4 septembre 2026 vers 15 h, heure de Paris.

| Lancement | Petit lanceur | Worker | Mémoire du worker observée | Début |
| --- | ---: | ---: | ---: | --- |
| E2E | 18712 | 41372 | ~680 Mo | 2026-08-29 22:16:41 |
| E2E | 50916 | 2712 | ~583 Mo | 2026-08-29 22:16:42 |
| Debug sync | 53392 | 55704 | ~649 Mo | 2026-08-29 22:32:02 |

Les trois workers exécutaient la même entrée :

```text
C:\nvm4w\nodejs\node.exe
  --require D:\development\wollama\node_modules\.pnpm\tsx@4.23.1\node_modules\tsx\dist\preflight.cjs
  --import file:///D:/development/wollama/node_modules/.pnpm/tsx@4.23.1/node_modules/tsx/dist/loader.mjs
  server.ts
```

Chaque worker avait accumulé environ 482 000 à 483 000 secondes de CPU, soit près de 134 heures. Au moment du contrôle, seul le PID 55704 écoutait encore sur `0.0.0.0:3004`; les deux autres ne possédaient plus de socket TCP, mais continuaient à utiliser du CPU et de la mémoire.

Windows signalait un dernier démarrage complet le 26 août à 22:34. Ces processus n'ont donc pas traversé un redémarrage réel : ils n'ont jamais été arrêtés depuis les tests du 29 août.

Aucun service, aucune clé `Run` et aucune tâche planifiée ne référence Wollama. Ils ne viennent pas d'un mécanisme de démarrage automatique.

## Corrélation avec les tests

Les heures de création des bases temporaires correspondent aux processus à la seconde près :

```text
2026-08-29 22:16:41  wollama-e2e-1788034601892
2026-08-29 22:16:42  wollama-e2e-1788034602390
2026-08-29 22:32:02  wollama-dbg-1788035522060
```

`client/e2e/tests/skills.spec.ts` crée les dossiers `wollama-e2e-*`. Aux lignes 58 à 64, il lance `cmd /c tsx.cmd server.ts`; aux lignes 83 à 90, son nettoyage se limite à `serverProc.kill()`.

`client/e2e/tests/multi-device-sync.spec.ts` répète le même montage aux lignes 64 à 73.

Le fichier local non suivi `client/e2e/tests/zz-sync-debug.spec.ts` crée les dossiers `wollama-dbg-*`. Il lance le serveur à la ligne 18 et exécute seulement `proc?.kill()` à la ligne 20. Le worker encore en écoute sur le port 3004 vient de ce test.

La coïncidence des lignes de commande, des heures et des noms de bases temporaires identifie le teardown Windows comme cause de l'incident.

## Défaut à corriger

`ChildProcess.kill()` cible le PID direct. Dans ces tests, ce PID appartient au shell `cmd.exe`, pas au processus Node qui sert l'API. Le wrapper `tsx.cmd` ajoute ensuite un autre étage Node. Le code perd donc la maîtrise du vrai serveur dès que le shell meurt ou que Playwright interrompt le processus parent.

Le problème concerne au moins :

- `client/e2e/tests/skills.spec.ts`
- `client/e2e/tests/multi-device-sync.spec.ts`
- `client/e2e/tests/zz-sync-debug.spec.ts` tant que ce fichier de diagnostic existe
- tout nouveau test qui recopierait `spawn('cmd', ['/c', tsxCmd, 'server.ts'])`

## Direction de correction

Créer un seul helper de lancement et d'arrêt pour les backends E2E, puis l'utiliser partout.

Sous Windows, l'arrêt doit cibler l'arbre du PID exact, par exemple avec `taskkill /PID <pid> /T /F`, et attendre la fin avant que le teardown retourne. Il ne faut jamais tuer tous les `node.exe` de la machine. Sur les autres systèmes, le helper doit conserver le comportement actuel ou gérer explicitement le groupe de processus créé.

Le helper doit aussi couvrir les sorties anormales du runner : échec de `beforeAll`, interruption, timeout et fermeture du processus Playwright. Une simple duplication de `taskkill` dans chaque spec recréerait le problème plus tard.

Une autre piste consiste à lancer directement l'entrée JavaScript de `tsx` avec `process.execPath`, sans passer par `cmd.exe` ni `tsx.cmd`. Même dans ce cas, le teardown doit garantir la mort des descendants éventuels.

## Critères d'acceptation

- Après chaque suite concernée, aucun nouveau processus dont la ligne de commande contient le chemin du dépôt et `server.ts` ne reste vivant.
- Le contrôle compare les PID présents avant et après le test afin de ne pas toucher un serveur Wollama déjà lancé par le développeur.
- Le nettoyage fonctionne quand le test passe, échoue, dépasse son timeout ou reçoit une interruption.
- Les ports réservés aux tests sont libérés avant la fin du teardown.
- Un test de régression Windows crée un processus avec au moins un descendant, lance le helper d'arrêt, puis vérifie que les deux PID ont disparu.
- Les bases de test restent cantonnées à des dossiers temporaires uniques, conformément à `AGENTS.md`.

## Nettoyage ponctuel de l'incident observé

Les PID ci-dessous ne valent que pour la capture du 4 septembre 2026. Vérifier leurs lignes de commande avant toute action, puis terminer chaque arbre depuis son petit lanceur :

```powershell
taskkill /PID 18712 /T /F
taskkill /PID 50916 /T /F
taskkill /PID 53392 /T /F
```

Après le nettoyage, contrôler qu'aucun des PID workers `41372`, `2712` et `55704` n'existe encore. Ne pas supprimer les répertoires de données réels du serveur; les seuls dossiers associés à ces tests se trouvent sous le répertoire temporaire Windows et portent les préfixes `wollama-e2e-`, `wollama-sync-e2e-` ou `wollama-dbg-`.

## Hors périmètre

L'application Claude rencontrait au même moment un échec AppX `0x80070020`. L'enquête ne relie pas cet incident aux processus Wollama. `humemory` utilise Bun et ne produit aucun des six processus décrits ici.
