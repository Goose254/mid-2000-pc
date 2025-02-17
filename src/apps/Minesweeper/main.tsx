import { AppTemplate, AppInstanceControl } from '../../common/types/appTemplate';
import { MinesweeperMainWindow } from './components/MainWindow';

import iconLarge from '@/assets/windows-icons/winmine.exe_14_100-6.png'
import iconMedium from '@/assets/windows-icons/winmine.exe_14_100-6.png'
import iconSmall from '@/assets/windows-icons/winmine.exe_14_100-6.png'
import iconXsmall from '@/assets/windows-icons/winmine.exe_14_100-7.png'

// Importe tes stores correspondants
import { useWindowsStore } from '@/common/stores/windowsStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

export const MinesweeperApp: AppTemplate = {
  id: 'winmine.exe',
  name: 'Démineur',
  icons: {
    large: iconLarge,
    medium: iconMedium,
    small: iconSmall,
    xsmall: iconXsmall,
  },
  multiInstance: false,
  MainWindow: MinesweeperMainWindow,
  init: function (pid: string): AppInstanceControl {
    const { name, icons, MainWindow } = this

    // Génère un ID de fenêtre stable pour cette instance
    const windowId = getWindowIdForInstance(pid, 'main');

    // Ouvre la fenêtre principale via le store windows
    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      name,
      <MainWindow />,
      <img src={icons.xsmall} />,
      {
            showMaximizeButton: false,
            fixedSize: true,
            size: {
            width: 503,
            height: 493,
            },
      },
    );

    // On retourne l'objet de contrôle pour cette instance
    return {
      killInstance: () => {
        // Ferme la fenêtre via le store windows
        useWindowsStore.getState().closeWindow(pid);
        // Ici, d'autres actions de nettoyage spécifiques peuvent être effectuées.
      }
      // D'autres fonctions de contrôle (bringToFront, minimize, etc.) peuvent être ajoutées ici.
    };
  }
};
