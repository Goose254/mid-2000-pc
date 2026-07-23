import { create } from 'zustand';

/**
 * Store du cycle de session / alimentation.
 *
 * Les déclencheurs (overlay d'arrêt, menu Démarrer) sont profondément imbriqués
 * dans l'arbre du Bureau. Plutôt que de remonter des callbacks jusqu'à `App`,
 * ils publient ici une « demande » de session. `App.tsx` observe `sessionRequest`
 * et pilote les transitions de `BootStage` en conséquence, puis appelle
 * `clearSessionRequest()` une fois la transition consommée.
 */
export type SessionRequest = 'logoff' | 'shutdown' | 'restart' | null;

export interface SystemState {
  sessionRequest: SessionRequest;
  /** Ferme la session courante et revient à l'écran de logon. */
  requestLogoff: () => void;
  /** Éteint l'ordinateur (écran d'extinction). */
  requestShutdown: () => void;
  /** Redémarre l'ordinateur (retour au BIOS, sans recharger la page). */
  requestRestart: () => void;
  /** Réinitialise la demande une fois la transition prise en compte. */
  clearSessionRequest: () => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  sessionRequest: null,
  requestLogoff: () => set({ sessionRequest: 'logoff' }),
  requestShutdown: () => set({ sessionRequest: 'shutdown' }),
  requestRestart: () => set({ sessionRequest: 'restart' }),
  clearSessionRequest: () => set({ sessionRequest: null }),
}));
