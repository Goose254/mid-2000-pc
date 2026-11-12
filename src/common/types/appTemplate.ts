import React from 'react';

export interface AppIcons {
  large: string;   // Chemin ou composant pour l’icône 64x64
  medium: string;  // 32x32
  small: string;   // 24x24
  xsmall: string;  // 16x16
}

export interface AppInstanceControl {
  /** Ferme l’instance (ferme la fenêtre, retire l’icône, etc.) */
  killInstance: () => void;
  // D'autres fonctions spécifiques à l'instance pourront être ajoutées ici
}

/**
 * Composant de fenêtre d'application.
 * Type fonction "nu" (sans les statics de React.FC comme propTypes) afin que
 * la contravariance des props permette d'assigner tout composant concret au
 * template générique `AppTemplate` (= `AppTemplate<never>`).
 */
export type AppWindowComponent<Props extends object> = (props: Props) => React.ReactNode;

/** Taille (en pixels) d'une fenêtre d'application. */
export interface AppWindowSize {
  width: number;
  height: number;
}

/**
 * Fiche descriptive d'une application : tout ce que le shell (bureau, menu
 * Démarrer, Exécuter, Gestionnaire des tâches) a besoin de connaître SANS
 * charger le code de l'application. Ces fiches sont listées une seule fois,
 * dans le registre `src/apps/registry.ts`.
 */
export interface AppManifest {
  /** Identifiant unique de l’app (ex: taskmgr.exe) */
  id: string;
  /** Nom affiché de l’application */
  name: string;
  /** Icônes aux différentes résolutions */
  icons: AppIcons;
  /** True si l’app peut être lancée plusieurs fois */
  multiInstance: boolean;
  /**
   * Taille de la fenêtre principale à l'ouverture. Absente quand
   * l'application la calcule elle-même (le Démineur la déduit de sa grille).
   */
  defaultWindowSize?: AppWindowSize;
}

/**
 * Code d'une application : ses composants et sa fonction d'initialisation.
 * C'est ce qu'exporte le `main.tsx` de chaque app ; le registre l'associe à la
 * fiche (`AppManifest`) pour former un `AppTemplate` complet. Dans `init`,
 * `this` désigne donc ce template complet (nom, icônes, taille par défaut...).
 *
 * `WindowProps` décrit les props des composants de l'app (fenêtre principale
 * et icône de taskbar) : chaque app fournit son propre type de props
 * (ex: `AppImplementation<{ taskManagerWindowId: string }>`).
 * `LaunchArgs` décrit les arguments de lancement acceptés par `init`
 * (ex: l'emplacement à ouvrir pour l'Explorateur).
 * La valeur par défaut `never` correspond à la forme "générique" manipulée par
 * les stores et le registre : ils ne rendent jamais ces composants eux-mêmes,
 * et `never` permet d'accepter n'importe quelle implémentation concrète.
 */
export type AppImplementation<WindowProps extends object = never, LaunchArgs = never> = {
  /**
   * Composant React représentant la fenêtre principale de l’app.
   * Ce composant sera utilisé dans la fonction d'initialisation.
   */
  MainWindow: AppWindowComponent<WindowProps>;
  /**
   * (Optionnel) Composant React affiché dans la taskbar.
   * S’il est défini, l’application ne se ferme pas automatiquement quand
   * toutes ses fenêtres sont fermées.
   */
  TaskbarIcon?: AppWindowComponent<WindowProps>;
  /**
   * Fonction d'initialisation de l'app.
   * Elle est appelée lors du lancement et doit ouvrir la fenêtre principale,
   * afficher la taskbar icon (si définie) et retourner un objet de contrôle
   * pour l'instance. `args` porte les arguments de lancement éventuels.
   */
  init: (pid: string, args?: LaunchArgs) => AppInstanceControl;
} & ThisType<AppTemplate<WindowProps, LaunchArgs>>;

/**
 * Modèle d'application complet : la fiche du registre et le code de l'app.
 * C'est l'objet que `appsStore.startApp` sait démarrer.
 */
export type AppTemplate<WindowProps extends object = never, LaunchArgs = never> =
  AppManifest & AppImplementation<WindowProps, LaunchArgs>;

export interface AppInstance {
  /** pid généré pour l’instance, ex: "monapp.exe-3" */
  pid: string;
  /** id de l’app (défini dans AppTemplate) */
  appId: string;
  /** Contrôleur de l’instance pour exécuter ses fonctions (kill, etc.) */
  control: AppInstanceControl;
}
