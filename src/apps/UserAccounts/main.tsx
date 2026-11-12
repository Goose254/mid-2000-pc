import { AppImplementation, AppInstanceControl } from '../../common/types/appTemplate';
import { UserAccountsMainWindow } from './components/MainWindow';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

/**
 * Applet « Comptes d'utilisateurs » du Panneau de configuration.
 * Réutilise le shell de fenêtre existant (windowsStore.openWindow), à l'image
 * des autres apps (Explorer, TaskManager). Sa fiche (nom, icônes, taille,
 * entrée du menu Démarrer) est dans le registre `src/apps/registry.ts`.
 */
export const UserAccountsApp: AppImplementation<object> = {
  MainWindow: UserAccountsMainWindow,
  init: function (pid: string): AppInstanceControl {
    const { name, icons, defaultWindowSize, MainWindow } = this;

    const windowId = getWindowIdForInstance(pid, 'main');

    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      name,
      <MainWindow />,
      <img src={icons.xsmall} alt="" />,
      { size: defaultWindowSize }
    );

    return {
      // On ferme via le pid (et non le windowId) : `closeWindow` est déjà en train
      // de retirer la fenêtre quand il déclenche `killInstance`, donc rappeler
      // `closeWindow(windowId)` ici ré-entrerait sur la même fenêtre et bouclerait
      // à l'infini (le X restait alors sans effet). Passer le pid — qui ne
      // correspond à aucun id de fenêtre (suffixe `_main`) — est un no-op sûr,
      // exactement comme les autres apps (Minesweeper, Explorer, TaskManager).
      killInstance: () => {
        useWindowsStore.getState().closeWindow(pid);
      },
    };
  },
};
