import { AppTemplate, AppInstanceControl } from '../../common/types/appTemplate';
import { ExplorerMainWindow } from './components/MainWindow';

import iconLarge from '@/assets/windows-icons/wiashext.dll_14_105-6.png'
import iconMedium from '@/assets/windows-icons/wiashext.dll_14_105-7.png'
import iconSmall from '@/assets/windows-icons/wiashext.dll_14_105-7.png'
import iconXsmall from '@/assets/windows-icons/wiashext.dll_14_105-8.png'

// Importe tes stores correspondants
import { useWindowsStore } from '@/common/stores/windowsStore';
import { useTaskbarStore } from '@/common/stores/taskbarStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

export const ExplorerApp: AppTemplate<object> = {
  id: 'explorer.exe',
  name: 'Poste de travail',
  icons: {
    large: iconLarge,
    medium: iconMedium,
    small: iconSmall,
    xsmall: iconXsmall,
  },
  multiInstance: true,
  MainWindow: ExplorerMainWindow,
  init: function (pid: string): AppInstanceControl {
    const { name, icons, MainWindow, TaskbarIcon } = this

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
        size: {
          width: 760,
          height: 540,
        },
      },
    );

    // Si une TaskbarIcon est définie, on l'ajoute dans le store dédié
    if (TaskbarIcon) {
      useTaskbarStore.getState().addToolIcon(pid, <TaskbarIcon />);
    }

    // On retourne l'objet de contrôle pour cette instance
    return {
      killInstance: () => {
        // Ferme la fenêtre via le store windows
        useWindowsStore.getState().closeWindow(pid);
        // Retire l'icône de la taskbar via le store dédié
        useTaskbarStore.getState().removeToolIcon(pid);
        // Ici, d'autres actions de nettoyage spécifiques peuvent être effectuées.
      }
      // D'autres fonctions de contrôle (bringToFront, minimize, etc.) peuvent être ajoutées ici.
    };
  }
};
