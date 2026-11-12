import { useWindowsStore } from '@/common/stores/windowsStore';
import { TASKBAR_HEIGHT } from '@/common/constants/layout';
import { RunDialog } from './RunDialog';

import RunDialogTitleIcon from '@/assets/windows-icons/shell32.dll_14_160-10.png';

const RUN_DIALOG_SIZE = { width: 363, height: 186 };
/** Espace laissé entre la boîte de dialogue et la barre des tâches. */
const RUN_DIALOG_BOTTOM_GAP = 4;

/**
 * Ouvre la boîte de dialogue « Exécuter ».
 *
 * Point d'entrée unique, partagé par le menu Démarrer et par le Gestionnaire
 * des tâches (« Nouvelle tâche... ») : la fenêtre a la même configuration quel
 * que soit l'endroit d'où on l'ouvre.
 */
export function openRunDialog(): void {
  useWindowsStore.getState().openWindow(
    'run',
    'run.exe',
    'Exécuter',
    <RunDialog windowId="run" />,
    <img src={RunDialogTitleIcon} alt="Run icon" />,
    {
      // En bas à gauche, juste au-dessus de la barre des tâches.
      position: {
        x: 3,
        y: window.innerHeight - TASKBAR_HEIGHT - RUN_DIALOG_SIZE.height - RUN_DIALOG_BOTTOM_GAP,
      },
      size: RUN_DIALOG_SIZE,
      fixedSize: true,
      buttons: {
        help: { visible: true, enabled: true },
        minimize: { visible: false, enabled: false },
        maximize: { visible: false, enabled: false },
      },
    }
  );
}
