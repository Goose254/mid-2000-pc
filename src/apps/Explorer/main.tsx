import { AppTemplate, AppInstanceControl } from '../../common/types/appTemplate';
import { ExplorerMainWindow } from './components/MainWindow';
import { COMPUTER, Location, locationIcon, locationTitle } from './model';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { useTaskbarStore } from '@/common/stores/taskbarStore';
import { useAppsStore } from '@/common/stores/appsStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

// Icône « Poste de travail » multi-tailles (16/24/32/48) : évite le débordement
// dans la barre des tâches et le Gestionnaire (qui affichent en 16px).
import icon48 from '@/assets/windows-icons/mycomputer-48.png';
import icon32 from '@/assets/windows-icons/mycomputer-32.png';
import icon24 from '@/assets/windows-icons/mycomputer-24.png';
import icon16 from '@/assets/windows-icons/mycomputer-16.png';

/**
 * Emplacement d'ouverture de la PROCHAINE instance d'Explorateur. `startApp`
 * ne transmet pas d'argument à `init` : on dépose donc l'emplacement ici juste
 * avant l'appel (lecture synchrone dans `init`, aucune course possible).
 */
let pendingInitialLocation: Location | null = null;

/** Ouvre une nouvelle fenêtre d'Explorateur sur l'emplacement demandé. */
export const openExplorerAt = (location: Location): void => {
  pendingInitialLocation = location;
  useAppsStore.getState().startApp(ExplorerApp);
};

export const ExplorerApp: AppTemplate<object> = {
  id: 'explorer.exe',
  name: 'Poste de travail',
  icons: {
    large: icon48,
    medium: icon32,
    small: icon24,
    xsmall: icon16,
  },
  multiInstance: true,
  MainWindow: ExplorerMainWindow as unknown as AppTemplate<object>['MainWindow'],
  init: function (pid: string): AppInstanceControl {
    const { name } = this;
    const windowId = getWindowIdForInstance(pid, 'main');

    const initialLocation = pendingInitialLocation ?? COMPUTER;
    pendingInitialLocation = null;

    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      initialLocation.kind === 'computer' ? name : locationTitle(initialLocation),
      <ExplorerMainWindow windowId={windowId} initialLocation={initialLocation} />,
      <img src={locationIcon(initialLocation)} alt="" />,
      { size: { width: 760, height: 540 } },
    );

    return {
      killInstance: () => {
        // IMPORTANT : fermer par `pid` (et non `windowId`). `closeWindow` appelle
        // `killInstance` en cascade DANS son `set()` ; refermer par `windowId`
        // relancerait la cascade (récursion infinie). La fenêtre est déjà retirée
        // par le `closeWindow(windowId)` du bouton de fermeture ; ici on ne fait
        // que le nettoyage (même patron que le Gestionnaire des tâches).
        useWindowsStore.getState().closeWindow(pid);
        useTaskbarStore.getState().removeToolIcon(pid);
      },
    };
  },
};
