import { create } from 'zustand';
import { AppTemplate, AppInstance, AppInstanceControl } from '../types/appTemplate';
import { generatePid } from '../utils/pidGenerator';

interface AppsState {
  instances: AppInstance[];
  /** Démarre l’application en appelant sa fonction init */
  startApp: (app: AppTemplate) => void;
  /** Ferme l’instance de l’app correspondant au pid */
  killInstance: (pid: string) => void;
  /** Récupère les instances d’une app à partir de son id */
  getInstancesByAppId: (appId: string) => AppInstance[];
}

export const useAppsStore = create<AppsState>((set, get) => ({
  instances: [],
  startApp: (app) => {
    // Si l’app est en instance unique et qu’une instance existe déjà, on peut la ramener au premier plan
    const existing = get().instances.find((inst) => inst.appId === app.id);
    if (existing && !app.multiInstance) {
      // Ici, tu peux déclencher une action pour bringToFront via ton store windows, par exemple.
      return;
    }
    const pid = generatePid(app.id);
    // Appel de la fonction d'initialisation de l'app
    const control: AppInstanceControl = app.init(pid);
    const newInstance: AppInstance = {
      pid,
      appId: app.id,
      control,
    };
    set((state) => ({
      instances: [...state.instances, newInstance]
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
