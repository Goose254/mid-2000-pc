import { create } from 'zustand';
import { AppTemplate, AppInstance, AppInstanceControl } from '../types/appTemplate';
import { getAppById } from '@/apps/registry';
import { generatePid } from '../utils/pidGenerator';
import { useWindowsStore } from './windowsStore';
import { getWindowIdForInstance } from '../utils/windowId';

const defaultInstances: AppInstance[] = [
  {
    pid: 'ctfmon.exe-0',
    appId: 'ctfmon.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'rundll32.exe-0',
    appId: 'rundll32.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'alg.exe-0',
    appId: 'alg.exe',
    control: {killInstance: () => {}},
  },
]

interface AppsState {
  instances: AppInstance[];
  /**
   * Nombre d'applications en cours de chargement (code demandé au serveur,
   * fenêtre pas encore ouverte). Tant qu'il est positif, le bureau affiche le
   * curseur « flèche + sablier » de Windows XP.
   */
  pendingLaunches: number;
  /**
   * Lance une application du registre (`src/apps/registry.ts`) par son
   * identifiant, avec d'éventuels arguments de lancement. Retourne `false` si
   * l'identifiant est inconnu.
   *
   * Le code de l'application est chargé à la demande : la fenêtre ne s'ouvre
   * qu'une fois ce code (et ses styles) arrivé, donc jamais sur un cadre vide.
   */
  launchApp: (appId: string, args?: unknown) => boolean;
  /** Démarre l’application en appelant sa fonction init */
  startApp: <Args = never>(app: AppTemplate<never, Args>, args?: Args) => void;
  /** Ferme l’instance de l’app correspondant au pid */
  killInstance: (pid: string) => void;
  /** Récupère les instances d’une app à partir de son id */
  getInstancesByAppId: (appId: string) => AppInstance[];
}

export const useAppsStore = create<AppsState>((set, get) => ({
  instances: [...defaultInstances],
  pendingLaunches: 0,
  launchApp: (appId, args) => {
    const definition = getAppById(appId);
    if (!definition) return false;

    set((state) => ({ pendingLaunches: state.pendingLaunches + 1 }));
    definition
      .load()
      .then((implementation) => {
        // Le registre est indexé par des chaînes : c'est le seul endroit où le
        // type des arguments de lancement n'est pas vérifié à la compilation.
        const app = { ...definition, ...implementation } as AppTemplate<never, unknown>;
        get().startApp(app, args);
      })
      .catch((error: unknown) => {
        // Fichier de l'application introuvable (hors ligne, site redéployé
        // pendant la session...) : rien ne s'ouvre, comme un raccourci cassé.
        console.error(`Impossible de lancer ${definition.id}`, error);
      })
      .finally(() => {
        set((state) => ({ pendingLaunches: state.pendingLaunches - 1 }));
      });
    return true;
  },
  startApp: (app, args) => {
    // Si l’app est en instance unique et qu’une instance existe déjà, on peut la ramener au premier plan
    const existing = get().instances.find((inst) => inst.appId === app.id);
    if (existing && !app.multiInstance) {
      const windowId = getWindowIdForInstance(existing.pid, 'main');

      useWindowsStore.getState().bringToFront(windowId);
      return;
    }
    const pid = generatePid(app.id);
    // Appel de la fonction d'initialisation de l'app
    const control: AppInstanceControl = app.init(pid, args);
    const newInstance: AppInstance = {
      pid,
      appId: app.id,
      control,
    };
    set((state) => ({
      instances: [newInstance, ...state.instances]
    }));
  },
  killInstance: (pid: string) => {
    // Appelle la fonction de contrôle pour fermer proprement l'instance
    const instance = get().instances.find(inst => inst.pid === pid);
    if (instance) {
      instance.control.killInstance();
    }
    set((state) => ({
      instances: state.instances.filter((inst) => inst.pid !== pid)
    }));
  },
  getInstancesByAppId: (appId: string) =>
    get().instances.filter((inst) => inst.appId === appId)
}));
