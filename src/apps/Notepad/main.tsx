import { AppTemplate, AppInstanceControl } from '../../common/types/appTemplate';
import { NotepadMainWindow } from './components/MainWindow';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { useTaskbarStore } from '@/common/stores/taskbarStore';
import { useAppsStore } from '@/common/stores/appsStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

import icon16 from '@/assets/windows-icons/file-text-16.png';
import icon32 from '@/assets/windows-icons/file-text-32.png';

interface PendingFile {
  path: string | null;
  name: string;
}

/** Fichier à charger à la PROCHAINE ouverture du Bloc-notes (lu par `init`). */
let pendingFile: PendingFile | null = null;

/** Ouvre le Bloc-notes, éventuellement sur un fichier existant. */
export const openNotepad = (path: string | null = null, name = 'Sans titre'): void => {
  pendingFile = { path, name };
  useAppsStore.getState().startApp(NotepadApp);
};

export const NotepadApp: AppTemplate<object> = {
  id: 'notepad.exe',
  name: 'Bloc-notes',
  icons: {
    large: icon32,
    medium: icon32,
    small: icon16,
    xsmall: icon16,
  },
  multiInstance: true,
  MainWindow: NotepadMainWindow as unknown as AppTemplate<object>['MainWindow'],
  init: function (pid: string): AppInstanceControl {
    const windowId = getWindowIdForInstance(pid, 'main');
    const file: PendingFile = pendingFile ?? { path: null, name: 'Sans titre' };
    pendingFile = null;

    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      `${file.name} - Bloc-notes`,
      <NotepadMainWindow windowId={windowId} initialPath={file.path} initialName={file.name} />,
      <img src={icon16} alt="" />,
      { size: { width: 600, height: 440 } },
    );

    return {
      killInstance: () => {
        useWindowsStore.getState().closeWindow(pid);
        useTaskbarStore.getState().removeToolIcon(pid);
      },
    };
  },
};
