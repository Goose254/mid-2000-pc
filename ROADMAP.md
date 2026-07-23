# Roadmap de développement

Ce document dresse un état des lieux technique du projet **mid-2000-pc** (simulation
d'un PC Windows XP dans le navigateur : React 18 + TypeScript + Vite 5 + Zustand +
SCSS Modules + i18next) et propose une trajectoire de développement priorisée.

Il se concentre sur les briques applicatives et l'architecture du *shell* :
l'Explorateur de fichiers, le Gestionnaire des tâches, le système de fenêtres et
les pistes de nouvelles applications. La séquence de démarrage (BIOS, boot,
écran de bienvenue) et la gestion de session/comptes font l'objet d'un chantier
séparé en cours et ne sont donc pas évaluées ici.

L'objectif est d'être honnête : une bonne partie du chrome de l'OS est en place et
soignée, mais plusieurs applications sont pour l'instant des **maquettes statiques**
fidèles visuellement plutôt que des applications réellement interactives. Le point
de blocage structurant est l'absence d'un **système de fichiers simulé**, dont
dépendent à la fois un Explorateur crédible et la plupart des applications
classiques (Bloc-notes, Paint, WordPad…).

---

## État des lieux

### Explorateur de fichiers

Fichiers concernés : `src/apps/Explorer/main.tsx`,
`src/apps/Explorer/components/MainWindow.tsx`,
`src/apps/Explorer/components/styles.module.scss`.

L'Explorateur est aujourd'hui une **reproduction statique de la vue « Poste de
travail »**. La coque est fidèle et convaincante, mais quasiment aucun élément
n'est interactif ; il n'existe aucune notion de navigation ni de contenu.

**Fait**
- Lancement en fenêtre via `AppTemplate` (`ExplorerApp`, `multiInstance: true`,
  taille 760×540), intégration correcte au système de fenêtres et à la barre des
  tâches (`main.tsx`).
- Reproduction visuelle complète de la vue « Poste de travail » : barre de menus
  (Fichier / Édition / Affichage / Favoris / Outils / ?), barre d'outils
  (Précédente / Suivante / Monter / Rechercher / Dossiers / Affichages), barre
  d'adresse, volet latéral (Gestion du système, Autres emplacements, Détails) et
  zone principale groupée (disques durs, périphériques amovibles, lecteurs
  réseau).
- Menus déroulants réellement ouvrables (composants `WindowToolbarMenuButton` +
  `FloatingMenu`), avec états désactivés (`aria-disabled`) sur les entrées non
  pertinentes.

**Partiel**
- Rien n'est réellement partiel : les éléments affichés sont soit décoratifs, soit
  inertes. Les listes (`STORAGE_GROUPS`, `SYSTEM_TASKS`, `OTHER_PLACES_TASKS`) sont
  des tableaux **codés en dur** dans `MainWindow.tsx`.

**Manquant**
- **Système de fichiers** : aucun. Aucune arborescence, aucun dossier, aucun
  fichier — la zone principale affiche une liste fixe de lecteurs.
- **Navigation** : les boutons Précédente / Suivante / Monter n'ont aucun
  gestionnaire (`onClick`). Aucun état de chemin courant ni d'historique.
- **Barre d'adresse** : champ `readOnly`, valeur figée `"Poste de travail"`, avec
  une unique option de menu déroulant identique. Le bouton « OK » n'a pas d'action.
- **Volet latéral** : les tâches (« Afficher les informations système », « Mes
  documents »…) et les emplacements sont des boutons sans handler. Le bloc
  « Détails » affiche un texte fixe (`Disque local (E:)`).
- **Ouverture d'éléments** : double-cliquer sur un disque ou un dossier ne fait
  rien (les `storageItem` sont des `<button>` sans `onClick`).
- **Actions fichiers** : ouvrir / renommer / supprimer / créer / couper / copier /
  coller sont présentes dans les menus mais toutes inertes (y compris « Fermer »
  dans le menu Fichier, qui n'a pas d'action).
- **Modes d'affichage** (Miniatures / Mosaïques / Icônes / Liste / Détails) :
  listés dans deux menus mais non implémentés — un seul rendu existe.
- **Sélection**, menu contextuel sur éléments, glisser-déposer, barre d'état
  dynamique, indicateur d'espace disque : absents.

> En résumé, l'Explorateur est une **capture d'écran interactive uniquement au
> niveau des menus**. Le rendre crédible suppose d'abord un modèle de système de
> fichiers, puis un état de navigation, puis le câblage des actions.

### Gestionnaire des tâches

Fichiers concernés : `src/apps/TaskManager/main.tsx`,
`src/apps/TaskManager/components/MainWindow.tsx`,
`src/apps/TaskManager/components/Tabs/ApplicationsTab.tsx`,
`src/apps/TaskManager/components/Tabs/ProcessesTab.tsx`,
`src/apps/TaskManager/components/TaskbarIcon.tsx`.

C'est l'application la plus fonctionnelle après le Démineur, mais seulement sur son
premier onglet. Cinq onglets sont affichés ; deux ont du contenu, trois sont vides.

**Fait**
- Onglet **Applications** réellement branché sur l'état du *shell* : il lit
  `useWindowsStore.windows`, exclut sa propre fenêtre et liste les fenêtres
  ouvertes (icône + titre + état « En cours d'exécution »).
- Actions de l'onglet Applications fonctionnelles :
  - **Fin de tâche** → `closeWindow(selectedAppId)`.
  - **Basculer vers** → réduit le Gestionnaire puis `bringToFront` de l'appli
    ciblée (double-clic géré également).
- **Icône de notification animée** (`TaskbarIcon.tsx`) : jauge CPU qui change
  d'image toutes les 2 s, avec menu contextuel dont « Fermer » est câblé. Joli
  détail fidèle à l'original.
- Barre d'état présente (`WindowStatusBar` + `StatusBarItem`).

**Partiel**
- Onglet **Processus** (`ProcessesTab.tsx`) : lit bien `useAppsStore.instances`,
  mais cette liste est majoritairement composée de **19 processus système factices
  codés en dur** (`ctfmon.exe`, `rundll32.exe`, `alg.exe`, `svchost.exe` ×16 —
  voir `defaultInstances` dans `appsStore.ts`). Les colonnes Nom d'utilisateur
  (`'Utilisateur'`), Processeur (`'00'`) et Mémoire (`'2 916 Ko'`) sont **statiques
  et identiques** pour toutes les lignes.
- La sélection de ligne existe (`rowSelection`) mais le bouton **« Terminer le
  processus » appelle `killProcess('')`** avec une chaîne vide : l'action est
  **inopérante** (bug — voir Dette technique).

**Manquant**
- Onglets **Performances**, **Mise en réseau** et **Utilisateurs** : **vides**,
  remplis de `<br/>` (`MainWindow.tsx`). Pas de graphes CPU/mémoire, pas d'historique
  d'utilisation, pas de liste d'utilisateurs.
- **Barre d'état statique** : « Processus : 22 », « UC utilisée : 0 % », « Charge
  dédiée : 95 Mo / 2048 Mo » sont des valeurs codées en dur qui ne reflètent ni le
  nombre réel d'instances ni quoi que ce soit de dynamique.
- **Menus décoratifs** : Fichier / Options / Affichage / Arrêter / ? n'ont aucun
  handler (ni « Nouvelle tâche (Exécuter…) », ni fréquence d'actualisation, etc.).
- Bouton **« Nouvelle tâche… »** (onglet Applications) sans action.
- Colonnes triables mais pas de vraies métriques à trier.

### Shell & architecture générale

Fichiers concernés : `src/common/stores/*`, `src/common/types/*`,
`src/common/utils/*`, `src/components/**`, `src/App.tsx`.

**Fait**
- **Système de fenêtres solide** (`windowsStore.ts`, `components/organisms/Window/Window.tsx`) :
  ouverture/fermeture, focus et ordre Z préservé (`bringToFrontPreservingZOrder`),
  déplacement, redimensionnement 8 directions, réduction/agrandissement avec
  animations pilotées par `transitionend`, cascade anti-collision des positions,
  et **mémoire de placement par application** (`windowPlacementMemory`).
- **Modèle applicatif propre** (`types/appTemplate.ts`) : chaque appli déclare
  `id`, `name`, `icons`, `multiInstance`, `MainWindow`, `TaskbarIcon?` et un
  `init(pid)` qui renvoie un contrôleur d'instance. Généricité de props bien pensée.
- **Stores Zustand découplés** : fenêtres, applications (`appsStore.ts`), barre des
  tâches, menu Démarrer, overlays, historique du dialogue Exécuter — responsabilités
  claires et légères.
- **Design atomique respecté** : `atoms / molecules / organisms / templates` avec
  une bibliothèque de composants réutilisables déjà riche (Button, Input, Checkbox,
  Radio, Textarea, MenuItem, FloatingMenu, WindowToolbar, Table, TitleBar,
  StatusBar…).
- **Dialogue Exécuter fonctionnel** (`RunDialog.tsx`) : parse la commande, mappe
  vers une appli, gère un historique (`runDialogStore.ts`) et affiche une erreur
  « Windows ne trouve pas… » réaliste.
- **Persistance ciblée via `localStorage`** : positions des icônes du Bureau
  (`Desktop.tsx`) et meilleurs temps du Démineur (`useMinesweeper.ts`).
- **Le Démineur** est une implémentation complète et fidèle (chording, marques,
  meilleurs temps persistés, sons) — bonne référence de ce qu'une « vraie » appli
  peut être dans cette architecture.

**Partiel**
- **i18n sous-exploité** : l'infrastructure existe (`src/i18n.ts` agrège
  automatiquement les `**/i18n/**/*.json` par namespace, détection de langue), mais
  seuls **4 composants** utilisent réellement `useTranslation` (`Taskbar`,
  `TaskbarButton`, `DesktopContextMenu`, `WindowsXPSplashScreen`). Les catalogues
  `fr.json` / `en.json` ne couvrent que 4 petites sections (splash, menu contextuel
  du Bureau, taskbar, menu contextuel de fenêtre). **Tout le reste de l'UI est en
  français codé en dur** (Explorateur, Gestionnaire des tâches, RunDialog, menu
  Démarrer, Démineur). La parité fr/en existe uniquement sur ces 4 sections.
- **Registre d'applications éclaté** : il n'y a pas de source unique de vérité des
  applis. Elles sont importées à la main dans `Desktop.tsx` (icônes du Bureau) et
  re-déclarées dans l'`executableMap` de `RunDialog.tsx`. Ajouter une appli impose
  d'éditer plusieurs fichiers.

**Manquant**
- **Aucun test** : pas de fichier `*.test.*` / `*.spec.*`, pas de Vitest/Jest
  configuré. La CI (`.github/workflows/ci.yml`) se limite à `lint` + `build`.
- **Aucune couche de système de fichiers** partagée — brique fondatrice absente
  (voir Chantiers prioritaires).
- Le contrôleur d'instance (`AppInstanceControl`) n'expose que `killInstance` ; pas
  de `bringToFront` / `minimize` standardisés par appli (commenté comme piste dans
  le code).

---

## Chantiers prioritaires

Ordre recommandé, du plus structurant au plus cosmétique. Effort indicatif :
**S** ≈ moins d'une journée, **M** ≈ quelques jours, **L** ≈ chantier d'une à
plusieurs semaines.

### 1. Socle de système de fichiers virtuel persistant — Effort : **L**
La brique manquante la plus structurante. Sans elle, ni l'Explorateur ni le
Bloc-notes / Paint / WordPad ne peuvent être crédibles.
- Modéliser une arborescence (dossiers/fichiers, métadonnées : nom, type, taille,
  dates), une API `readDir` / `stat` / `read` / `write` / `mkdir` / `rename` /
  `move` / `delete`, et une **corbeille**.
- Persister via `localStorage` (comme le Démineur et les icônes du Bureau) ou
  IndexedDB si l'on veut stocker des contenus volumineux (images de Paint).
- Fournir une arborescence initiale plausible (C:, Mes documents, Mes images…).
- Fichiers : nouveau module `src/common/fs/` (store Zustand + types + utils).
- Dépend de : rien. **Débloque** les chantiers 2 et une majorité de nouvelles
  applis.

### 2. Finalisation de l'Explorateur — Effort : **L**
- Introduire un état de navigation (chemin courant, historique avant/arrière) et
  câbler Précédente / Suivante / Monter.
- Rendre la barre d'adresse éditable et fonctionnelle (saisie d'un chemin, menu
  déroulant réel des emplacements).
- Afficher le **contenu réel** d'un dossier depuis le FS (chantier 1), avec les
  modes d'affichage annoncés (au moins Liste / Icônes / Détails).
- Câbler les actions : ouvrir, créer un dossier, renommer, supprimer (→ corbeille),
  couper/copier/coller, sélection et menu contextuel.
- Volet latéral et bloc « Détails » alimentés par la sélection.
- Fichiers : `src/apps/Explorer/**` (extraire un `useExplorer` sur le modèle de
  `useMinesweeper`).
- Dépend de : chantier 1.

### 3. Finalisation du Gestionnaire des tâches — Effort : **M**
- **Corriger le bug** de « Terminer le processus » (relier la sélection au `pid`
  réel au lieu de `killProcess('')`).
- Rendre la barre d'état dynamique (compter réellement instances/fenêtres).
- Alimenter l'onglet Processus avec des métriques simulées mais cohérentes
  (mémoire/CPU pseudo-aléatoires mais stables par processus) plutôt que des
  constantes identiques.
- Onglet **Performances** : graphe CPU + histogramme mémoire en `<canvas>` (le
  projet a déjà l'habitude du canvas pour BIOS/boot) alimenté par des valeurs
  simulées. Idéalement rendre crédibles ou masquer les onglets Réseau/Utilisateurs.
- Fichiers : `src/apps/TaskManager/**`, `appsStore.ts` (métriques par instance).
- Dépend de : rien (indépendant du FS).

### 4. Registre central d'applications — Effort : **S/M**
- Créer une source unique (`src/common/apps/registry.ts`) listant les
  `AppTemplate`, consommée par le Bureau, le menu Démarrer et l'`executableMap` du
  RunDialog.
- Simplifie l'ajout d'applis et supprime la duplication actuelle.
- Fichiers : nouveau `registry.ts`, puis `Desktop.tsx`, `RunDialog.tsx`,
  `StartMenu.tsx`, `appsStore.ts`.
- Dépend de : rien. À faire idéalement **avant** d'ajouter de nouvelles applis.

### 5. Couverture d'internationalisation — Effort : **M**
- Externaliser les chaînes codées en dur (Explorateur, Gestionnaire des tâches,
  RunDialog, menu Démarrer, Démineur) vers des namespaces i18n par appli.
- Garantir la parité fr/en et faire vivre le sélecteur de langue.
- Fichiers : `src/**/i18n/*.json` + composants correspondants.
- Dépend de : idéalement après stabilisation des libellés des applis.

### 6. Tests & CI — Effort : **M**
- Introduire **Vitest** + React Testing Library.
- Cibles à forte valeur : `windowsStore` (focus, z-order, min/max), `appsStore`
  (cycle de vie des instances), la future couche FS, et la logique du Démineur
  (`useMinesweeper.ts`, purement fonctionnelle et testable en isolation).
- Ajouter l'étape `test` au workflow (`.github/workflows/ci.yml`).
- Dépend de : rien ; la valeur croît avec la logique métier (chantiers 1–3).

### 7. Nettoyage de dette ciblé — Effort : **S**
- Factoriser le boilerplate commun aux onglets du Gestionnaire (voir Dette
  technique).
- Sortir les nombres magiques (hauteur de la taskbar `30`, etc.) dans des
  constantes partagées.
- Supprimer la mutation d'objet du store en cours de rendu dans `Window.tsx`.

---

## Nouvelles applications envisagées

Applications fidèles à l'esprit XP et réalistes dans cette architecture. L'effort
suppose le registre d'applications (chantier 4) en place.

| Application | Intérêt | Effort | Dépendances |
|---|---|---|---|
| **Bloc-notes** (`notepad.exe`) | Emblématique, simple ; démontre l'ouverture/sauvegarde de fichiers | **S** (visuel) / **M** (avec FS) | Textarea existant ; vrai FS pour ouvrir/enregistrer |
| **Calculatrice** (`calc.exe`) | Autonome, sans FS ; complète le menu Démarrer où elle figure déjà | **S** | Aucune (icône déjà présente) |
| **WordPad** (`wordpad.exe`) | Édition RTF simple ; complète le Bloc-notes | **M** | Vrai FS ; éditeur `contentEditable` |
| **Paint** (`mspaint.exe`) | Très évocateur ; canvas déjà maîtrisé dans le projet | **M/L** | `<canvas>` ; FS pour enregistrer/ouvrir des images |
| **Panneau de configuration** | Cohérent (déjà référencé partout dans le menu Démarrer/Explorateur) ; peut piloter des préférences réelles (thème, langue, fond d'écran) | **M** | Store de préférences ; i18n pour la langue |
| **Solitaire / FreeCell** | Fort attrait nostalgique ; logique de jeu autonome comme le Démineur | **L** | Aucune (assets de cartes à produire) |
| **Lecteur Windows Media** | Icônes/menu Démarrer déjà présents ; peut lire un `<audio>`/`<video>` embarqué | **M** | FS pour une bibliothèque de médias ; assets |
| **Internet Explorer (bac à sable)** | Très emblématique ; pages « web » factices d'époque servies localement | **M/L** | Contenu simulé ; historique/favoris ; pas de vrai réseau |
| **Invite de commandes** (`cmd.exe`) | Peu d'assets, fort cachet ; `dir`, `cd`, `type`… deviennent une vitrine du FS | **M** | Vrai FS (sinon peu d'intérêt) |
| **Observateur d'événements** | Bon usage de la molecule `Table` existante ; journaux simulés | **S/M** | Source d'événements simulée |
| **Visionneuse d'images / Aperçu** | Complète Paint et l'Explorateur (double-clic sur une image) | **S/M** | Vrai FS |
| **Corbeille** (fonctionnelle) | L'icône existe sur le Bureau mais son double-clic est vide | **S/M** | Vrai FS (corbeille) |
| **Bloc de dialogue Propriétés** | Réutilisable par l'Explorateur et le Bureau | **S** | Vrai FS pour les métadonnées |

> Recommandation : commencer par **Calculatrice** (indépendante, gain rapide,
> valide le registre d'applis) puis **Bloc-notes** (première vraie consommatrice du
> FS), qui servent de gabarits pour les suivantes.

---

## Dette technique & qualité

Points concrets relevés à la lecture du code (hors zones en refonte : boot/BIOS/session).

- **Bug — « Terminer le processus »** : `ProcessesTab.tsx` appelle
  `killProcess('')` (chaîne vide) au lieu du `pid` sélectionné ; le bouton ne fait
  rien. La sélection de ligne (`rowSelection`) n'est pas reliée à l'action.
- **Aucun test automatisé** ; CI limitée à `lint` + `build`. La logique la plus
  testable (`useMinesweeper`, stores) n'est couverte par rien.
- **i18n de façade** : 4 composants seulement utilisent `useTranslation` ; le reste
  de l'UI est en français codé en dur, alors que le projet se présente comme
  bilingue fr/en. Risque d'incohérence à mesure que l'UI grossit.
- **Duplication entre onglets du Gestionnaire** : `ApplicationsTab.tsx` et
  `ProcessesTab.tsx` partagent ~80 % de code (configuration `@tanstack/react-table`,
  `columnSizeVars`, `OverlayScrollbars`). `ProcessesTab` importe d'ailleurs
  `ApplicationsTab.module.scss`. À factoriser en un composant/hook `TaskTable`.
- **Données factices codées en dur** : 19 processus système dans
  `appsStore.defaultInstances`, barre d'état statique du Gestionnaire, listes de
  lecteurs de l'Explorateur. Acceptable comme décor, mais à isoler dans des
  fixtures clairement identifiées plutôt que dans la logique.
- **Absence de registre d'applications** : applis importées et re-déclarées dans
  `Desktop.tsx` et `RunDialog.tsx` (`executableMap`), source de divergences.
- **Effet de bord en rendu** : `Window.tsx` mutate directement
  `buttons.maximize.action` / `minimize` / `close` de l'objet du store pendant le
  rendu. Fonctionne aujourd'hui mais fragile (idempotence, mode concurrent React).
- **Styles en ligne et nombres magiques** : `TaskManager/MainWindow.tsx` utilise de
  nombreux styles inline et des espacements `<br/>` pour les onglets vides ; la
  hauteur de la taskbar (`window.innerHeight - 30`) est dupliquée dans `Desktop.tsx`
  et `Window.tsx`.
- **Détails mineurs** : `pidGenerator` s'appuie sur un compteur de module jamais
  réinitialisé ; `getAppIdFromPid` couple le format de `pid` (`-<n>`) à l'`id`
  d'appli ; dans `Explorer/main.tsx`, `iconSmall` et `iconMedium` pointent le même
  asset ; `getWindowById` est défini dans `windowsStore` mais absent de l'interface
  `WindowsState`.

---

*Document d'analyse — lecture seule du code. Aucune estimation ne vaut engagement ;
les efforts S/M/L sont des ordres de grandeur destinés à prioriser.*
