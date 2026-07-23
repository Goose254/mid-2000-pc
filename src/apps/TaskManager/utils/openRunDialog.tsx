import { useWindowsStore } from '@/common/stores/windowsStore';
import { RunDialog } from '@/components/organisms/RunDialog/RunDialog';

import RunDialogTitleIcon from '@/assets/windows-icons/shell32.dll_14_160-10.png';

/**
 * Ouvre la boîte de dialogue « Exécuter » (Nouvelle tâche).
 *
 * On reproduit exactement la configuration de fenêtre utilisée par le menu
 * Démarrer (`StartMenu`) afin de conserver un comportement identique quel que
 * soit le point d'entrée.
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
