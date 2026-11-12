import { useWindowsStore } from '@/common/stores/windowsStore';
import { RunDialog } from './RunDialog';

import RunDialogTitleIcon from '@/assets/windows-icons/shell32.dll_14_160-10.png';

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
      position: { x: 3, y: window.innerHeight - 220 },
      size: { width: 363, height: 186 },
      fixedSize: true,
      buttons: {
        help: { visible: true, enabled: true },
        minimize: { visible: false, enabled: false },
        maximize: { visible: false, enabled: false },
      },
    }
  );
}
