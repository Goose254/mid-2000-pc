import { create } from 'zustand';

import { useAppsStore } from '@/common/stores/appsStore';
import { useUsersStore } from '@/common/stores/usersStore';

import {
  computeNetworkUsage,
  computeSystemMetrics,
  emptyMetrics,
  SystemMetrics,
} from '../utils/processMetrics';

/**
 * Store propre au Gestionnaire des tâches.
 *
 * Il centralise le « temps virtuel » (compteur de tick) et l'échantillonnage
 * des historiques utilisés par l'onglet Performances et l'onglet Mise en
 * réseau. Un seul rythme d'actualisation pilote tout le monde, ce qui garantit
 * que la barre d'état, la liste des processus et les courbes affichent des
 * valeurs cohérentes au même instant.
 *
 * L'application étant en instance unique, ce singleton est sûr.
 */

/** Nombre d'échantillons conservés dans les historiques (fenêtre glissante). */
export const HISTORY_LENGTH = 90;

export type RefreshRate = 'high' | 'normal' | 'low' | 'paused';

const REFRESH_RATE_MS: Record<RefreshRate, number> = {
  high: 500,
  normal: 1000,
  low: 4000,
  paused: 0,
};

/** Intervalle (ms) associé à un rythme d'actualisation ; 0 = en pause. */
export function getRefreshIntervalMs(rate: RefreshRate): number {
  return REFRESH_RATE_MS[rate];
}

interface TaskManagerState {
  tickCount: number;
  refreshRate: RefreshRate;
  metrics: SystemMetrics;
  cpuHistory: number[];
  pfHistory: number[];
  netHistory: number[];
  commitPeakKo: number;
  setRefreshRate: (rate: RefreshRate) => void;
  /** Avance d'un pas la simulation et rafraîchit métriques + historiques. */
  tick: () => void;
}

/** Ajoute une valeur à un historique borné (fenêtre glissante). */
function pushHistory(history: number[], value: number): number[] {
  const next = history.length >= HISTORY_LENGTH ? history.slice(1) : history.slice();
  next.push(value);
  return next;
}

/** Nom du compte actuellement connecté (ou « Utilisateur » par défaut). */
function currentUserName(): string {
  const { users, currentUserId } = useUsersStore.getState();
  return users.find((user) => user.id === currentUserId)?.name ?? 'Utilisateur';
}

export const useTaskManagerStore = create<TaskManagerState>((set, get) => ({
  tickCount: 0,
  refreshRate: 'normal',
  metrics: emptyMetrics(),
  cpuHistory: [],
  pfHistory: [],
  netHistory: [],
  commitPeakKo: 0,

  setRefreshRate: (rate) => set({ refreshRate: rate }),

  tick: () => {
    const state = get();
    const nextTick = state.tickCount + 1;

    const instances = useAppsStore.getState().instances;
    const metrics = computeSystemMetrics(instances, currentUserName(), nextTick);
    const networkUsage = computeNetworkUsage(nextTick);
    const pfUsage = (metrics.commitTotalKo / metrics.commitLimitKo) * 100;

    set({
      tickCount: nextTick,
      metrics,
      commitPeakKo: Math.max(state.commitPeakKo, metrics.commitTotalKo),
      cpuHistory: pushHistory(state.cpuHistory, metrics.cpuUsage),
      pfHistory: pushHistory(state.pfHistory, pfUsage),
      netHistory: pushHistory(state.netHistory, networkUsage),
    });
  },
}));
