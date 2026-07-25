import { AppTemplate, AppInstanceControl } from '../../common/types/appTemplate';
import { ExplorerMainWindow } from './components/MainWindow';
import { COMPUTER, Location, locationIcon, locationTitle } from './model';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { useTaskbarStore } from '@/common/stores/taskbarStore';
import { useAppsStore } from '@/common/stores/appsStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

// Icône « Poste de travail » (l'ancienne icône scanner était un placeholder).
import iconLarge from '@/assets/windows-icons/explorer.exe_14_100-9.png';
import iconSmall from '@/assets/windows-icons/explorer.exe_14_100-10.png';

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
    large: iconLarge,
    medium: iconLarge,
    small: iconSmall,
    xsmall: iconSmall,
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
        useWindowsStore.getState().closeWindow(windowId);
        useTaskbarStore.getState().removeToolIcon(pid);
      },
    };
  },
};
