import type { ComponentProps } from 'react';
import { AppImplementation, AppInstanceControl } from '../../common/types/appTemplate';
import { ExplorerMainWindow } from './components/MainWindow';
import { COMPUTER, folderLocation, locationIcon, locationTitle } from './model';
import type { ExplorerLaunchArgs } from './locations';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { useTaskbarStore } from '@/common/stores/taskbarStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

/**
 * Explorateur (`explorer.exe`). Sa fiche (nom, icônes, raccourcis du bureau et
 * du menu Démarrer) est dans le registre `src/apps/registry.ts`.
 *
 * Pour ouvrir une fenêtre sur un emplacement précis :
 * `useAppsStore.getState().launchApp('explorer.exe', { location })`.
 */
export const ExplorerApp: AppImplementation<ComponentProps<typeof ExplorerMainWindow>, ExplorerLaunchArgs> = {
  MainWindow: ExplorerMainWindow,
  init: function (pid: string, args?: ExplorerLaunchArgs): AppInstanceControl {
    const { name, defaultWindowSize } = this;
    const windowId = getWindowIdForInstance(pid, 'main');

    // Les chemins de dossier sont normalisés ici : les raccourcis du registre
    // et les autres applications passent un chemin brut.
    const requested = args?.location ?? COMPUTER;
    const initialLocation = requested.kind === 'folder' ? folderLocation(requested.path) : requested;

    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      initialLocation.kind === 'computer' ? name : locationTitle(initialLocation),
      <ExplorerMainWindow windowId={windowId} initialLocation={initialLocation} />,
      <img src={locationIcon(initialLocation)} alt="" />,
      { size: defaultWindowSize },
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
