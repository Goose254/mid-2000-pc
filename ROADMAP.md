# Roadmap

État du projet **mid-2000-pc**, vérifié dans le code le 11 novembre 2026. Ce
fichier ne décrit que ce qui existe réellement ; les idées sont rangées dans
« Applications envisagées ».

## Fait

**Démarrage et session** (`src/App.tsx`, `src/components/templates/`)

- Écran BIOS avec POST et test mémoire, BIOS Setup navigable au clavier
  (`Suppr` pendant le POST), écran de boot Windows XP — tous trois sur
  Canvas 2D.
- Écran d'ouverture de session, écran « Bienvenue », bureau.
- Fermeture de session, arrêt, redémarrage (retour au BIOS sans recharger la
  page), écran bleu quand on termine un processus système critique.

**Bureau et fenêtres** (`src/components/`, `src/common/stores/`)

- Gestionnaire de fenêtres : déplacement, redimensionnement dans les
  8 directions, réduction / agrandissement animés, ordre d'empilement,
  placement en cascade, mémoire de placement par application.
- Barre des tâches (boutons de fenêtres, zone de notification, horloge), menu
  Démarrer, boîte de dialogue Exécuter, overlay d'arrêt.
- Icônes du bureau déplaçables sur une grille, positions conservées dans le
  `localStorage`.

**Système de fichiers virtuel** (`src/common/fs/`)

- Arborescence du lecteur `C:` avec dossiers et fichiers texte, API complète
  (`stat`, `readDir`, `readFile`, `writeFile`, `mkdir`, `rename`, `move`,
  `copy`, `remove`) et Corbeille (`restore`, `emptyTrash`,
  `deletePermanently`).
- Persistance dans le `localStorage` (clé `mid-2000-pc-fs-v1`), validée au
  chargement.
- 46 tests Vitest (chemins, store, persistance).

**Applications** (`src/apps/`)

- **Explorateur** : branché sur le système de fichiers. Poste de travail,
  navigation précédente / suivante / dossier parent, barre d'adresse
  saisissable, arborescence des dossiers, cinq modes d'affichage, tri,
  sélection multiple, création de dossier et de document texte, renommage,
  suppression vers la Corbeille, couper / copier / coller, menu contextuel,
  propriétés.
- **Bloc-notes** : ouvre un fichier texte depuis l'Explorateur et l'enregistre
  dans le système de fichiers (« Enregistrer sous » écrit directement dans
  `C:\Mes documents`, sans boîte de dialogue).
- **Gestionnaire des tâches** : cinq onglets (Applications, Processus,
  Performances, Mise en réseau, Utilisateurs), fin de tâche, arrêt de
  processus, métriques simulées, graphes sur canvas, barre d'état calculée,
  icône animée dans la zone de notification.
- **Comptes d'utilisateurs** : création, renommage, image, type de compte,
  mot de passe, suppression ; comptes conservés dans le `localStorage`.
- **Démineur** : complet (niveaux, partie personnalisée, marques, meilleurs
  temps, sons).

**Outillage**

- CI GitHub Actions : lint, vérification des types, tests, build.
- `npm audit` : aucun avis sur les dépendances de production.

## Dette technique connue

Chaque point a été constaté dans le code à la date ci-dessus.

- **Pas de registre central des applications.** Les applications sont
  importées à la main dans `Desktop.tsx` (icônes du bureau) et `StartMenu.tsx`,
  et redéclarées dans l'`executableMap` de
  `src/components/organisms/RunDialog/RunDialog.tsx`. Cette table ne connaît
  que `explorer.exe`, `taskmgr.exe` et `winmine.exe` : le Bloc-notes et les
  Comptes d'utilisateurs ne se lancent pas depuis Exécuter.
- **Internationalisation partielle.** 8 fichiers `.tsx` sur 79 utilisent
  `useTranslation`. Sont traduits (fr / en, 90 clés chacun) : les écrans de
  session (ouverture, bienvenue, fermeture, arrêt, extinction), le libellé du
  bouton Démarrer et le format de l'horloge, le menu contextuel des boutons de
  la barre des tâches, le menu contextuel du bureau et les Comptes
  d'utilisateurs. Tout le reste est en français codé en dur : menu Démarrer,
  icônes du bureau, Explorateur, Bloc-notes, Gestionnaire des tâches, Démineur,
  Exécuter, overlay d'arrêt.
- **Mutation d'un objet du store pendant le rendu.**
  `src/components/organisms/Window/Window.tsx` (lignes 61 à 93) affecte
  `buttons.maximize.action`, `minimize.action` et `close.action` directement
  sur l'objet lu dans le store, dans le corps du composant.
- **Hauteur de la barre des tâches en dur.** La valeur `30` est répétée dans
  `Window.tsx` (`window.innerHeight - 30`, deux fois) et `Desktop.tsx`
  (`window.innerHeight - 30` et `calc(100vh - 30px)`).
- **Un seul bundle JavaScript** d'environ 811 kB (317 kB gzip) : aucune
  application n'est chargée à la demande, et Vite signale le dépassement à
  chaque build.
- **Tests limités au système de fichiers.** Les stores (fenêtres,
  applications, comptes), la logique du Démineur et les composants n'ont aucun
  test.
- **Corbeille incomplète côté interface.** L'Explorateur affiche la Corbeille
  et y envoie les éléments supprimés, mais ni « Restaurer » ni « Vider la
  Corbeille » ne sont proposés, alors que le système de fichiers les
  implémente.
- **Curseur par défaut introuvable en production.** Trois règles pointent vers
  un chemin relatif faux pour `default.cur` (`Window.module.scss` ligne 183,
  `WindowsXpArrowsPlugin.css` lignes 33 et 158) : le build les laisse telles
  quelles et le navigateur reçoit une erreur 404 (il retombe sur le curseur
  système).
- **Entrées inertes.** Plusieurs éléments visibles sont désactivés ou sans
  action : la plupart des entrées du menu Démarrer (Internet, Calculatrice, le
  contenu de « Tous les programmes »...), le menu contextuel du bureau,
  « Mettre en veille », « Ouvrir... » et la recherche dans le Bloc-notes, les
  boutons de l'onglet Utilisateurs du Gestionnaire des tâches.
- **Mot de passe cosmétique.** Le mot de passe d'un compte est stocké en clair
  dans le `localStorage` et n'est jamais demandé à l'ouverture de session.
- **Styles partagés par copie.** `ProcessesTab.tsx` et `UsersTab.tsx`
  importent la feuille `ApplicationsTab.module.scss`.
- **Dépendance inutilisée.** `lucide-react` est déclarée mais n'est importée
  nulle part dans `src/`.
- **Avertissements persistants.** Un avertissement ESLint
  (`react-refresh/only-export-components` dans `ExplorerContext.tsx`), des
  avertissements de dépréciation Sass au build, et 7 avis `npm audit` modérés
  sur les dépendances de développement (minimatch, via typescript-eslint),
  sans correctif publié.

## Applications envisagées

Aucune de ces applications n'existe aujourd'hui. Effort indicatif : **S** moins
d'une journée, **M** quelques jours, **L** une à plusieurs semaines.

| Application | Intérêt | Effort | Dépendances |
|---|---|---|---|
| **Calculatrice** (`calc.exe`) | Autonome ; figure déjà dans le menu Démarrer | **S** | Aucune |
| **WordPad** (`wordpad.exe`) | Édition de texte enrichi ; complète le Bloc-notes | **M** | Système de fichiers ; éditeur `contentEditable` |
| **Paint** (`mspaint.exe`) | Très évocateur ; le canvas est déjà maîtrisé dans le projet | **M/L** | Stockage d'images (le système de fichiers ne gère que du texte) |
| **Panneau de configuration** | L'entrée du menu Démarrer n'ouvre aujourd'hui que les Comptes d'utilisateurs ; pourrait piloter thème, langue, fond d'écran | **M** | Store de préférences ; i18n pour la langue |
| **Solitaire / FreeCell** | Fort attrait nostalgique ; logique autonome comme le Démineur | **L** | Jeu de cartes à produire |
| **Lecteur Windows Media** | Figure déjà dans le menu Démarrer ; lecture `<audio>` / `<video>` | **M** | Médias à fournir |
| **Internet Explorer (bac à sable)** | Très emblématique ; pages d'époque servies localement | **M/L** | Contenu simulé ; historique et favoris ; pas de vrai réseau |
| **Invite de commandes** (`cmd.exe`) | Peu d'assets ; `dir`, `cd`, `type` deviennent une vitrine du système de fichiers | **M** | Système de fichiers |
| **Observateur d'événements** | Réutilise la molecule `Table` ; journaux simulés | **S/M** | Source d'événements simulée |
| **Visionneuse d'images** | Double-clic sur une image dans l'Explorateur | **S/M** | Stockage d'images |

Le Bloc-notes, la Corbeille et la boîte de dialogue Propriétés, qui figuraient
dans cette liste, sont désormais en place (voir « Fait » et, pour la Corbeille,
« Dette technique connue »).
