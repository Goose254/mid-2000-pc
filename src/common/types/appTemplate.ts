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

export interface AppTemplate {
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
  MainWindow: React.FC<any>;
  /**
   * (Optionnel) Composant React affiché dans la taskbar.
   * S’il est défini, l’application ne se ferme pas automatiquement quand
   * toutes ses fenêtres sont fermées.
   */
  TaskbarIcon?: React.FC<any>;
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
