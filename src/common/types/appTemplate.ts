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

/**
 * Modèle d'application.
 *
 * `WindowProps` décrit les props des composants de l'app (fenêtre principale
 * et icône de taskbar) : chaque app fournit son propre type de props
 * (ex: `AppTemplate<{ taskManagerWindowId: string }>`).
 * La valeur par défaut `never` correspond au template "générique" manipulé par
 * les stores : ils ne rendent jamais ces composants eux-mêmes, et `never`
 * permet d'accepter n'importe quel template concret.
 */
export interface AppTemplate<WindowProps extends object = never> {
  /** Identifiant unique de l’app (ex: taskmgr.exe) */
  id: string;
  /** Nom affiché de l’application */
  name: string;
  /** Icônes aux différentes résolutions */
  icons: AppIcons;
  /** True si l’app peut être lancée plusieurs fois */
  multiInstance: boolean;
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
   * pour l'instance.
   */
  init: (pid: string) => AppInstanceControl;
}

export interface AppInstance {
  /** pid généré pour l’instance, ex: "monapp.exe-3" */
  pid: string;
  /** id de l’app (défini dans AppTemplate) */
  appId: string;
  /** Contrôleur de l’instance pour exécuter ses fonctions (kill, etc.) */
  control: AppInstanceControl;
}
