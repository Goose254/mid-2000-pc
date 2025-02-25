import { create } from 'zustand';
import { AppTemplate, AppInstance, AppInstanceControl } from '../types/appTemplate';
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
  {
    pid: 'svchost.exe-0',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-1',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-2',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-3',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-4',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-5',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-6',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-7',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-8',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-9',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-10',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-11',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-12',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-13',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-14',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
  {
    pid: 'svchost.exe-15',
    appId: 'svchost.exe',
    control: {killInstance: () => {}},
  },
]

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
  instances: [...defaultInstances],
  startApp: (app) => {
    // Si l’app est en instance unique et qu’une instance existe déjà, on peut la ramener au premier plan
    const existing = get().instances.find((inst) => inst.appId === app.id);
    if (existing && !app.multiInstance) {
      const windowId = getWindowIdForInstance(existing.pid, 'main');

      useWindowsStore.getState().bringToFront(windowId);
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
