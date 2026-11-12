/**
 * Hauteur de la barre des tâches, en pixels.
 *
 * Source unique de cette valeur. Le code TypeScript l'importe directement ; le
 * bureau (`Desktop.tsx`) la publie aussi dans la propriété CSS
 * `--taskbar-height`, que lisent les feuilles SCSS de la barre des tâches et du
 * menu Démarrer.
 */
export const TASKBAR_HEIGHT = 30;

/** Nom de la propriété CSS qui porte `TASKBAR_HEIGHT` (définie sur le bureau). */
export const TASKBAR_HEIGHT_CSS_VAR = '--taskbar-height';
