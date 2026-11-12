/**
 * Registre central des applications.
 *
 * Chaque application y est décrite UNE seule fois : identifiant, nom(s)
 * d'exécutable reconnus par « Exécuter », nom affiché, icônes, taille de
 * fenêtre par défaut et emplacements où elle apparaît (bureau, menu Démarrer).
 * Le bureau, le menu Démarrer et la boîte de dialogue Exécuter lisent ce
 * registre ; aucun d'eux n'importe une application directement.
 *
 * Le code de chaque application est chargé À LA DEMANDE : `load` est un
 * `import()` dynamique, dont Vite fait un fichier séparé. Ce module-ci, lui,
 * fait partie du bundle initial : il ne doit importer statiquement que des
 * données légères (icônes, types, constantes), jamais un composant d'app.
 * Il reste ainsi testable sans DOM. Le lancement passe par
 * `useAppsStore.getState().launchApp(id, args)`.
 */
import type { AppImplementation, AppManifest } from '@/common/types/appTemplate';
import { COMPUTER, SPECIAL_PATHS, TRASH } from './Explorer/locations';
import type { ExplorerLaunchArgs } from './Explorer/locations';
import type { NotepadLaunchArgs } from './Notepad/main';

// Explorateur : icône « Poste de travail » multi-tailles (16/24/32/48), pour
// éviter le débordement dans la barre des tâches et le Gestionnaire (16px).
import ExplorerIcon48 from '@/assets/windows-icons/mycomputer-48.png';
import ExplorerIcon32 from '@/assets/windows-icons/mycomputer-32.png';
import ExplorerIcon24 from '@/assets/windows-icons/mycomputer-24.png';
import ExplorerIcon16 from '@/assets/windows-icons/mycomputer-16.png';
import DesktopMyComputerIcon from '@/assets/windows-icons/explorer.exe_14_100-9.png';
import DesktopMyDocumentsIcon from '@/assets/windows-icons/shell32.dll_14_235-9.png';
import DesktopRecycleBinIcon from '@/assets/windows-icons/shell32.dll_14_254-7.png';
import StartMyDocumentsIcon from '@/assets/windows-icons/mydocs.dll_14_100-10.png';
import StartMyPicturesIcon from '@/assets/windows-icons/mydocs.dll_14_101-10.png';
import StartMyMusicIcon from '@/assets/windows-icons/shell32.dll_14_237-10.png';
import StartMyComputerIcon from '@/assets/windows-icons/explorer.exe_14_100-10.png';

import NotepadIcon32 from '@/assets/windows-icons/file-text-32.png';
import NotepadIcon16 from '@/assets/windows-icons/file-text-16.png';

import TaskManagerIcon32 from '@/assets/windows-icons/taskmgr-icon-32.png';
import TaskManagerIcon16 from '@/assets/windows-icons/taskmgr-icon-16.png';

// Icône authentique « Comptes d'utilisateurs » (nusrmgr.cpl) aux bonnes tailles :
// -6 = 48×48, -7 = 32×32, -8 = 16×16. Le xsmall DOIT être un vrai 16×16, sans quoi
// la taskbar / barre de titre / gestionnaire des tâches l'affichent sur-dimensionné.
import UserAccountsIcon48 from '@/assets/windows-icons/nusrmgr.cpl_14_200-6.png';
import UserAccountsIcon32 from '@/assets/windows-icons/nusrmgr.cpl_14_200-7.png';
import UserAccountsIcon16 from '@/assets/windows-icons/nusrmgr.cpl_14_200-8.png';
import StartControlPanelIcon from '@/assets/windows-icons/shell32.dll_14_137-10.png';

import MinesweeperIcon32 from '@/assets/windows-icons/winmine.exe_14_100-6.png';
import MinesweeperIcon16 from '@/assets/windows-icons/winmine.exe_14_100-7.png';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Un point d'entrée vers une application (icône du bureau, entrée de menu). */
export interface AppShortcut<Args = unknown> {
  /**
   * Identifiant stable du raccourci. Sur le bureau, c'est la clé sous laquelle
   * la position de l'icône est conservée dans le `localStorage`.
   */
  id: string;
  /** Libellé affiché ; le nom de l'application par défaut. */
  label?: string;
  /** Icône affichée ; l'icône 32×32 de l'application par défaut. */
  icon?: string;
  /** Arguments transmis à l'application au lancement. */
  args?: Args;
}

/**
 * Emplacements du menu Démarrer tenus par une application. La mise en page du
 * menu (ordre, séparateurs, entrées inertes) reste dans `StartMenu.tsx` ; le
 * registre dit quelle application occupe chaque emplacement.
 */
export type StartMenuSlot =
  | 'my-documents'
  | 'my-pictures'
  | 'my-music'
  | 'my-computer'
  | 'control-panel';

export interface StartMenuShortcut<Args = unknown> extends AppShortcut<Args> {
  id: StartMenuSlot;
}

/** Entrée du registre : la fiche d'une application et là où elle apparaît. */
export interface AppDefinition<Args = unknown> extends AppManifest {
  /**
   * Noms d'exécutable acceptés par « Exécuter », en minuscules. Le premier est
   * le nom canonique ; les suivants sont des alias.
   */
  executables: readonly [string, ...string[]];
  /** Icônes du bureau qui lancent l'application. */
  desktop?: readonly AppShortcut<Args>[];
  /** Entrées du menu Démarrer qui lancent l'application. */
  startMenu?: readonly StartMenuShortcut<Args>[];
  /**
   * Charge le code de l'application (son `main.tsx`) à la demande. Le
   * navigateur ne télécharge le fichier qu'au premier lancement ; les appels
   * suivants réutilisent le module déjà chargé.
   */
  load: () => Promise<AppImplementation<never, Args>>;
}

/** Raccourci prêt à l'emploi : libellé et icône résolus, application ciblée. */
export interface ResolvedShortcut {
  id: string;
  appId: string;
  label: string;
  icon: string;
  args?: unknown;
}

/**
 * Déclare une application en vérifiant que les arguments de ses raccourcis
 * correspondent bien à ceux que son code accepte (`Args`). Le registre, lui,
 * est une liste homogène : le type des arguments y est effacé, et
 * `launchApp` est le seul endroit où il n'est pas vérifié à la compilation.
 */
const defineApp = <Args = undefined>(definition: AppDefinition<Args>): AppDefinition =>
  definition as unknown as AppDefinition;

// ---------------------------------------------------------------------------
// Les applications
// ---------------------------------------------------------------------------

export const APP_REGISTRY: readonly AppDefinition[] = [
  defineApp<ExplorerLaunchArgs>({
    id: 'explorer.exe',
    executables: ['explorer.exe'],
    name: 'Poste de travail',
    icons: {
      large: ExplorerIcon48,
      medium: ExplorerIcon32,
      small: ExplorerIcon24,
      xsmall: ExplorerIcon16,
    },
    multiInstance: true,
    defaultWindowSize: { width: 760, height: 540 },
    desktop: [
      { id: 'my-computer', label: 'Poste de travail', icon: DesktopMyComputerIcon, args: { location: COMPUTER } },
      {
        id: 'my-documents',
        label: 'Mes Documents',
        icon: DesktopMyDocumentsIcon,
        args: { location: { kind: 'folder', path: SPECIAL_PATHS.myDocuments } },
      },
      { id: 'recycle-bin', label: 'Corbeille', icon: DesktopRecycleBinIcon, args: { location: TRASH } },
    ],
    startMenu: [
      {
        id: 'my-documents',
        label: 'Mes documents',
        icon: StartMyDocumentsIcon,
        args: { location: { kind: 'folder', path: SPECIAL_PATHS.myDocuments } },
      },
      {
        id: 'my-pictures',
        label: 'Mes images',
        icon: StartMyPicturesIcon,
        args: { location: { kind: 'folder', path: SPECIAL_PATHS.myPictures } },
      },
      {
        id: 'my-music',
        label: 'Ma musique',
        icon: StartMyMusicIcon,
        args: { location: { kind: 'folder', path: SPECIAL_PATHS.myMusic } },
      },
      { id: 'my-computer', label: 'Poste de travail', icon: StartMyComputerIcon, args: { location: COMPUTER } },
    ],
    load: () => import('./Explorer/main').then((module) => module.ExplorerApp),
  }),
  defineApp<NotepadLaunchArgs>({
    id: 'notepad.exe',
    executables: ['notepad.exe'],
    name: 'Bloc-notes',
    icons: {
      large: NotepadIcon32,
      medium: NotepadIcon32,
      small: NotepadIcon16,
      xsmall: NotepadIcon16,
    },
    multiInstance: true,
    defaultWindowSize: { width: 600, height: 440 },
    load: () => import('./Notepad/main').then((module) => module.NotepadApp),
  }),
  defineApp({
    id: 'taskmgr.exe',
    executables: ['taskmgr.exe'],
    name: 'Gestionnaire des tâches de Windows',
    icons: {
      large: TaskManagerIcon32,
      medium: TaskManagerIcon32,
      small: TaskManagerIcon32,
      xsmall: TaskManagerIcon16,
    },
    multiInstance: false,
    defaultWindowSize: { width: 503, height: 493 },
    desktop: [{ id: 'task-manager', label: 'Gestionnaire des tâches' }],
    load: () => import('./TaskManager/main').then((module) => module.TaskManagerApp),
  }),
  defineApp({
    // Applet « Comptes d'utilisateurs » du Panneau de configuration. Sous XP,
    // `nusrmgr.cpl` l'ouvre directement ; `control` ouvre le Panneau de
    // configuration, dont cette applet tient lieu ici (comme dans le menu
    // Démarrer).
    id: 'nusrmgr.cpl',
    executables: ['nusrmgr.cpl', 'control.exe'],
    name: "Comptes d'utilisateurs",
    icons: {
      large: UserAccountsIcon48,
      medium: UserAccountsIcon32,
      small: UserAccountsIcon32,
      xsmall: UserAccountsIcon16,
    },
    multiInstance: false,
    defaultWindowSize: { width: 640, height: 480 },
    startMenu: [{ id: 'control-panel', label: 'Panneau de configuration', icon: StartControlPanelIcon }],
    load: () => import('./UserAccounts/main').then((module) => module.UserAccountsApp),
  }),
  defineApp({
    // Pas de `defaultWindowSize` : le Démineur déduit la taille de sa fenêtre
    // de la géométrie de sa grille.
    id: 'winmine.exe',
    executables: ['winmine.exe'],
    name: 'Démineur',
    icons: {
      large: MinesweeperIcon32,
      medium: MinesweeperIcon32,
      small: MinesweeperIcon32,
      xsmall: MinesweeperIcon16,
    },
    multiInstance: false,
    desktop: [{ id: 'minesweeper' }],
    load: () => import('./Minesweeper/main').then((module) => module.MinesweeperApp),
  }),
];

// ---------------------------------------------------------------------------
// Recherche
// ---------------------------------------------------------------------------

/** Retrouve une application par son identifiant (ex: `taskmgr.exe`). */
export const getAppById = (id: string): AppDefinition | undefined =>
  APP_REGISTRY.find((app) => app.id === id);

/**
 * Extrait le nom d'exécutable d'une ligne de commande saisie dans « Exécuter » :
 * premier mot (ou chaîne entre guillemets), sans son chemin, en minuscules.
 * Les arguments éventuels sont ignorés.
 */
export const parseExecutableName = (command: string): string | null => {
  const trimmed = command.trim();
  if (!trimmed) return null;

  const quotedMatch = trimmed.match(/^"([^"]+)"/);
  const token = quotedMatch?.[1] || trimmed.split(/\s+/)[0];
  const baseName = token.split(/[\\/]/).pop()?.trim().toLowerCase();

  return baseName || null;
};

/**
 * Retrouve une application par un nom d'exécutable, sans tenir compte de la
 * casse (comme Windows XP). L'extension `.exe` est facultative : `notepad`
 * trouve `notepad.exe`.
 */
export const findAppByExecutable = (executable: string): AppDefinition | undefined => {
  const name = executable.trim().toLowerCase();
  if (!name) return undefined;

  const candidates = [name, `${name}.exe`];
  return APP_REGISTRY.find((app) =>
    app.executables.some((known) => candidates.includes(known.toLowerCase()))
  );
};

/** Retrouve l'application désignée par une ligne de commande de « Exécuter ». */
export const findAppByCommand = (command: string): AppDefinition | undefined => {
  const executable = parseExecutableName(command);
  return executable ? findAppByExecutable(executable) : undefined;
};

// ---------------------------------------------------------------------------
// Raccourcis
// ---------------------------------------------------------------------------

const resolveShortcut = (app: AppDefinition, shortcut: AppShortcut): ResolvedShortcut => ({
  id: shortcut.id,
  appId: app.id,
  label: shortcut.label ?? app.name,
  icon: shortcut.icon ?? app.icons.medium,
  args: shortcut.args,
});

/** Les icônes du bureau, dans l'ordre du registre. */
export const getDesktopShortcuts = (): ResolvedShortcut[] =>
  APP_REGISTRY.flatMap((app) => (app.desktop ?? []).map((shortcut) => resolveShortcut(app, shortcut)));

/** Les entrées du menu Démarrer tenues par une application. */
export const getStartMenuShortcuts = (): ResolvedShortcut[] =>
  APP_REGISTRY.flatMap((app) => (app.startMenu ?? []).map((shortcut) => resolveShortcut(app, shortcut)));

/** L'application qui occupe un emplacement du menu Démarrer. */
export const getStartMenuShortcut = (slot: StartMenuSlot): ResolvedShortcut | undefined =>
  getStartMenuShortcuts().find((shortcut) => shortcut.id === slot);
