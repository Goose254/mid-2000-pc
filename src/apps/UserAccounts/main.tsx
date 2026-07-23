import { AppTemplate, AppInstanceControl } from '../../common/types/appTemplate';
import { UserAccountsMainWindow } from './components/MainWindow';

// Icône authentique « Comptes d'utilisateurs » (nusrmgr.cpl) aux bonnes tailles :
// -6 = 48×48, -7 = 32×32, -8 = 16×16. Le xsmall DOIT être un vrai 16×16, sans quoi
// la taskbar / barre de titre / gestionnaire des tâches l'affichent sur-dimensionné.
import iconLarge from '@/assets/windows-icons/nusrmgr.cpl_14_200-6.png';
import iconMedium from '@/assets/windows-icons/nusrmgr.cpl_14_200-7.png';
import iconSmall from '@/assets/windows-icons/nusrmgr.cpl_14_200-7.png';
import iconXsmall from '@/assets/windows-icons/nusrmgr.cpl_14_200-8.png';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

/**
 * Applet « Comptes d'utilisateurs » du Panneau de configuration.
 * Réutilise le shell de fenêtre existant (windowsStore.openWindow), à l'image
 * des autres apps (Explorer, TaskManager).
 */
export const UserAccountsApp: AppTemplate<object> = {
  id: 'nusrmgr.cpl',
  name: "Comptes d'utilisateurs",
  icons: {
    large: iconLarge,
    medium: iconMedium,
    small: iconSmall,
    xsmall: iconXsmall,
  },
  multiInstance: false,
  MainWindow: UserAccountsMainWindow,
  init: function (pid: string): AppInstanceControl {
    const { name, icons, MainWindow } = this;

    const windowId = getWindowIdForInstance(pid, 'main');

    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      name,
      <MainWindow />,
      <img src={icons.xsmall} alt="" />,
      {
        size: {
          width: 640,
          height: 480,
        },
      }
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
