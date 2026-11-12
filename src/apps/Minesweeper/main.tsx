import { AppImplementation, AppInstanceControl } from '../../common/types/appTemplate';
import { MinesweeperMainWindow } from './components/MainWindow';
import { getWindowSize } from './components/useMinesweeper';

// Importe tes stores correspondants
import { useWindowsStore } from '@/common/stores/windowsStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

// La fiche du Démineur (identifiant, nom, icônes, icône du bureau) est dans le
// registre `src/apps/registry.ts`.
export const MinesweeperApp: AppImplementation<{ windowId: string }> = {
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
      <MainWindow windowId={windowId} />,
      <img src={icons.xsmall} />,
      {
        buttons: {
          maximize: {
            visible: true,
            enabled: false,
          }
        },
        fixedSize: true,
        // Taille dérivée de la géométrie de la grille débutant (9 × 9)
        size: getWindowSize(9, 9),
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
