import { AppImplementation, AppInstanceControl } from '../../common/types/appTemplate';
import { TaskManagerMainWindow } from './components/MainWindow';
import { TaskManagerTaskbarIcon } from './components/TaskbarIcon';

// Importe tes stores correspondants
import { useWindowsStore } from '@/common/stores/windowsStore';
import { useTaskbarStore } from '@/common/stores/taskbarStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

/**
 * Gestionnaire des tâches (`taskmgr.exe`). Sa fiche (nom, icônes, taille,
 * icône du bureau) est dans le registre `src/apps/registry.ts`.
 */
export const TaskManagerApp: AppImplementation<{ taskManagerWindowId: string }> = {
  MainWindow: TaskManagerMainWindow,
  TaskbarIcon: TaskManagerTaskbarIcon,
  init: function (pid: string): AppInstanceControl {
    const { name, icons, defaultWindowSize, MainWindow, TaskbarIcon } = this

    // Génère un ID de fenêtre stable pour cette instance
    const windowId = getWindowIdForInstance(pid, 'main');

    // Ouvre la fenêtre principale via le store windows
    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      name,
      <MainWindow taskManagerWindowId={windowId} />,
      <img src={icons.xsmall} />,
      { size: defaultWindowSize },
    );

    // Si une TaskbarIcon est définie, on l'ajoute dans le store dédié
    if (TaskbarIcon) {
      useTaskbarStore.getState().addToolIcon(pid, <TaskbarIcon key={pid} taskManagerWindowId={windowId} />);
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
