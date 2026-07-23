import { AppTemplate, AppInstanceControl } from '../../common/types/appTemplate';
import { UserAccountsMainWindow } from './components/MainWindow';

import iconLarge from '@/assets/windows-icons/shell32.dll_14_137-8.png';
import iconMedium from '@/assets/windows-icons/shell32.dll_14_137-8.png';
import iconSmall from '@/assets/windows-icons/shell32.dll_14_137-10.png';
import iconXsmall from '@/assets/windows-icons/shell32.dll_14_137-10.png';

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
          width: 620,
          height: 470,
        },
      }
    );

    return {
      killInstance: () => {
        useWindowsStore.getState().closeWindow(windowId);
      },
    };
  },
};
