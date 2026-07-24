import { create } from 'zustand';

/**
 * Store du cycle de session / alimentation.
 *
 * Les déclencheurs (overlay d'arrêt, menu Démarrer, Gestionnaire des tâches)
 * sont profondément imbriqués dans l'arbre du Bureau. Plutôt que de remonter des
 * callbacks jusqu'à `App`, ils publient ici une « demande » de session.
 * `App.tsx` observe `sessionRequest` (et `bsodProcessName` pour l'écran bleu) et
 * pilote les transitions de `BootStage` en conséquence, puis appelle
 * `clearSessionRequest()` / `clearBsod()` une fois la transition consommée.
 */
export type SessionRequest = 'logoff' | 'shutdown' | 'restart' | null;

export interface SystemState {
  sessionRequest: SessionRequest;
  /** Nom du processus fatal ayant déclenché l'écran bleu (null si aucun). */
  bsodProcessName: string | null;
  /** Ferme la session courante et revient à l'écran de logon. */
  requestLogoff: () => void;
  /** Éteint l'ordinateur (écran d'extinction). */
  requestShutdown: () => void;
  /** Redémarre l'ordinateur (retour au BIOS, sans recharger la page). */
  requestRestart: () => void;
  /** Réinitialise la demande une fois la transition prise en compte. */
  clearSessionRequest: () => void;
  /**
   * Déclenche un écran bleu (BSOD) provoqué par la terminaison d'un processus
   * système critique, puis un redémarrage. Observé par `App.tsx`.
   */
  triggerBsod: (processName: string) => void;
  /** Réinitialise l'état BSOD une fois l'écran bleu consommé (au redémarrage). */
  clearBsod: () => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  sessionRequest: null,
  bsodProcessName: null,
  requestLogoff: () => set({ sessionRequest: 'logoff' }),
  requestShutdown: () => set({ sessionRequest: 'shutdown' }),
  requestRestart: () => set({ sessionRequest: 'restart' }),
  clearSessionRequest: () => set({ sessionRequest: null }),
  triggerBsod: (processName) => set({ bsodProcessName: processName }),
  clearBsod: () => set({ bsodProcessName: null }),
}));
