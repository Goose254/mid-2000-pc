import { create } from 'zustand';

import { useAppsStore } from '@/common/stores/appsStore';
import { useUsersStore } from '@/common/stores/usersStore';
import { useWindowsStore } from '@/common/stores/windowsStore';

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

/** Index des onglets (react-tabs) — permet le basculement inter-onglets. */
export const TAB_APPLICATIONS = 0;
export const TAB_PROCESSES = 1;
export const TAB_PERFORMANCE = 2;

interface TaskManagerState {
  tickCount: number;
  refreshRate: RefreshRate;
  metrics: SystemMetrics;
  cpuHistory: number[];
  pfHistory: number[];
  netHistory: number[];
  commitPeakKo: number;
  /** pids des processus système synthétiques terminés par l'utilisateur. */
  terminatedPids: Set<string>;
  /** Priorité affichée par pid (cosmétique, style XP). */
  priorities: Record<string, string>;
  /** Onglet actif (contrôlé pour permettre « Aller au processus »). */
  activeTabIndex: number;
  /** pid à sélectionner dans l'onglet Processus (consommé une fois). */
  processToSelect: string | null;
  setRefreshRate: (rate: RefreshRate) => void;
  setActiveTabIndex: (index: number) => void;
  /** Bascule sur l'onglet Processus en pré-sélectionnant le pid indiqué. */
  goToProcess: (pid: string) => void;
  clearProcessToSelect: () => void;
  /** Termine un processus système synthétique (le retire de la liste). */
  terminateProcess: (pid: string) => void;
  /** Réinitialise les processus terminés (après un redémarrage). */
  resetTerminatedProcesses: () => void;
  /** Mémorise la priorité (cosmétique) d'un processus. */
  setPriority: (pid: string, priority: string) => void;
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

/**
 * Instances d'applications réellement en cours d'exécution : celles qui
 * possèdent au moins une fenêtre. On écarte ainsi les instances « fantômes »
 * du socle (svchost, etc.) : la liste authentique des processus système est
 * désormais fournie par `processMetrics`.
 */
function runningUserInstances() {
  const windows = useWindowsStore.getState().windows;
  return useAppsStore
    .getState()
    .instances.filter((instance) => windows.some((window) => window.appPid === instance.pid));
}

export const useTaskManagerStore = create<TaskManagerState>((set, get) => ({
  tickCount: 0,
  refreshRate: 'normal',
  metrics: emptyMetrics(),
  cpuHistory: [],
  pfHistory: [],
  netHistory: [],
  commitPeakKo: 0,
  terminatedPids: new Set<string>(),
  priorities: {},
  activeTabIndex: 0,
  processToSelect: null,

  setRefreshRate: (rate) => set({ refreshRate: rate }),

  setActiveTabIndex: (index) => set({ activeTabIndex: index }),

  goToProcess: (pid) => set({ activeTabIndex: TAB_PROCESSES, processToSelect: pid }),

  clearProcessToSelect: () => set({ processToSelect: null }),

  terminateProcess: (pid) => {
    const terminatedPids = new Set(get().terminatedPids);
    terminatedPids.add(pid);
    set({ terminatedPids });
    get().tick();
  },

  resetTerminatedProcesses: () => set({ terminatedPids: new Set<string>() }),

  setPriority: (pid, priority) =>
    set((state) => ({ priorities: { ...state.priorities, [pid]: priority } })),

  tick: () => {
    const state = get();
    const nextTick = state.tickCount + 1;

    const metrics = computeSystemMetrics(
      runningUserInstances(),
      currentUserName(),
      nextTick,
      state.terminatedPids
    );
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
