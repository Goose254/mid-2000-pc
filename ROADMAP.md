# Roadmap

État du projet **mid-2000-pc**, vérifié dans le code le 11 novembre 2026 et
mis à jour le 12 novembre 2026 après un second lot de travaux de qualité. Ce
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
  8 directions avec une taille minimale, réduction / agrandissement animés,
  ordre d'empilement, placement en cascade, mémoire de placement par
  application. Une seule fenêtre est active à la fois ; fermer ou réduire la
  fenêtre active donne le focus à celle du dessus.
- Barre des tâches (boutons de fenêtres, zone de notification, horloge), menu
  Démarrer, boîte de dialogue Exécuter, overlay d'arrêt.
- Exécuter lance toute application du registre par son nom d'exécutable, sans
  tenir compte de la casse : `explorer.exe`, `notepad.exe`, `taskmgr.exe`,
  `winmine.exe`, `nusrmgr.cpl` (ou `control`). Un nom inconnu affiche
  « Windows ne trouve pas... ».
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
  propriétés. Corbeille : restauration d'un élément, de la sélection ou de
  tout son contenu (menu contextuel et volet des tâches), vidage avec la
  boîte de confirmation de Windows XP.
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

**Architecture et outillage**

- Registre central des applications (`src/apps/registry.ts`) : chaque
  application y est décrite une seule fois (identifiant, noms d'exécutable,
  nom, icônes, taille de fenêtre, icônes du bureau, entrées du menu Démarrer,
  chargeur). Le bureau, le menu Démarrer et Exécuter le lisent ; aucun
  n'importe une application.
- Applications chargées à la demande : le JavaScript initial pèse 451 kB
  (189 kB gzip) au lieu de 811 kB (317 kB gzip) ; chaque application est un
  fichier séparé (Explorateur 128 kB, Gestionnaire des tâches 104 kB, Démineur
  101 kB, Comptes d'utilisateurs 11 kB, Bloc-notes 5 kB), téléchargé à son
  premier lancement. La fenêtre ne s'ouvre qu'une fois le code arrivé ; en
  attendant, le bureau affiche le curseur « flèche + sablier ».
- Hauteur de la barre des tâches définie une seule fois (`TASKBAR_HEIGHT`,
  `src/common/constants/layout.ts`), publiée aux feuilles SCSS par la
  propriété CSS `--taskbar-height`.
- 137 tests Vitest : système de fichiers (46), gestionnaire de fenêtres (47),
  géométrie de redimensionnement (7), registre des applications (20),
  lancement à la demande (7), actions de la Corbeille (10).
- CI GitHub Actions : lint, vérification des types, tests, build.
- ESLint : aucune erreur, aucun avertissement.
- `npm audit` : aucun avis sur les dépendances de production.

## Dette technique connue

Chaque point a été constaté dans le code aux dates ci-dessus.

- **Internationalisation partielle.** 11 fichiers `.tsx` sur 79 utilisent
  `useTranslation`. Sont traduits (fr / en, 107 clés chacun) : les écrans de
  session (ouverture, bienvenue, fermeture, arrêt, extinction), le libellé du
  bouton Démarrer et le format de l'horloge, le menu contextuel des boutons de
  la barre des tâches, le menu contextuel du bureau, les Comptes
  d'utilisateurs et les actions de la Corbeille dans l'Explorateur. Tout le
  reste est en français codé en dur : menu Démarrer, icônes du bureau, le
  reste de l'Explorateur, Bloc-notes, Gestionnaire des tâches, Démineur,
  Exécuter, overlay d'arrêt. Les noms d'application du registre sont eux aussi
  en français.
- **Tests encore partiels.** Les stores des comptes, de la barre des tâches
  et de session, la logique du Démineur et les composants React n'ont aucun
  test ; Vitest tourne sans DOM.
- **Déplacement des fenêtres non borné.** Rien n'empêche de déposer une
  fenêtre avec sa barre de titre sous la barre des tâches, où l'on ne peut
  plus l'attraper ; « Déplacer » et « Taille » du menu de la barre des tâches
  sont inertes.
- **Entrées inertes.** Plusieurs éléments visibles sont désactivés ou sans
  action : la plupart des entrées du menu Démarrer (Internet, Calculatrice, le
  contenu de « Tous les programmes »...), le menu contextuel du bureau,
  « Mettre en veille », « Ouvrir... » et la recherche dans le Bloc-notes, les
  boutons de l'onglet Utilisateurs du Gestionnaire des tâches, « Couper » et
  « Supprimer » sur un élément de la Corbeille (on ne peut la vider qu'en
  entier).
- **Mot de passe cosmétique.** Le mot de passe d'un compte est stocké en clair
  dans le `localStorage` et n'est jamais demandé à l'ouverture de session.
- **Styles partagés par copie.** `ProcessesTab.tsx` et `UsersTab.tsx`
  importent la feuille `ApplicationsTab.module.scss`.
- **Son de fermeture de session absent.** `windows-xp-logoff.mp3` n'est pas
  livré dans le dépôt (voir `public/sounds/README.txt`) : à chaque fermeture
  de session ou arrêt, le navigateur reçoit une erreur 404, ignorée par le
  code. C'est la seule requête en échec sur un parcours complet du site.
- **Avertissements persistants.** Des avertissements de dépréciation Sass au
  build, et 7 avis `npm audit` modérés sur les dépendances de développement
  (minimatch, via typescript-eslint), sans correctif publié.

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
dans cette liste, sont désormais en place (voir « Fait »).

Une nouvelle application s'ajoute en deux temps : son code dans
`src/apps/<Nom>/main.tsx` (un `AppImplementation`), puis une entrée dans
`src/apps/registry.ts`. Elle se lance alors depuis Exécuter, et apparaît sur
le bureau si l'entrée déclare une icône.
