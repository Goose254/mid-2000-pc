import type { ComponentProps } from 'react';
import { AppImplementation, AppInstanceControl } from '../../common/types/appTemplate';
import { NotepadMainWindow } from './components/MainWindow';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { useTaskbarStore } from '@/common/stores/taskbarStore';
import { getWindowIdForInstance } from '@/common/utils/windowId';

/** Arguments de lancement du Bloc-notes (`notepad.exe`). */
export interface NotepadLaunchArgs {
  /** Chemin du fichier à ouvrir, ou `null` pour un document vierge. */
  path: string | null;
  /** Nom affiché dans la barre de titre. */
  name: string;
}

/**
 * Bloc-notes (`notepad.exe`). Sa fiche (nom, icônes, taille) est dans le
 * registre `src/apps/registry.ts`.
 *
 * Pour l'ouvrir sur un fichier existant :
 * `useAppsStore.getState().launchApp('notepad.exe', { path, name })`.
 */
export const NotepadApp: AppImplementation<ComponentProps<typeof NotepadMainWindow>, NotepadLaunchArgs> = {
  MainWindow: NotepadMainWindow,
  init: function (pid: string, args?: NotepadLaunchArgs): AppInstanceControl {
    const { name, icons, defaultWindowSize } = this;
    const windowId = getWindowIdForInstance(pid, 'main');
    const file: NotepadLaunchArgs = args ?? { path: null, name: 'Sans titre' };

    useWindowsStore.getState().openWindow(
      windowId,
      pid,
      `${file.name} - ${name}`,
      <NotepadMainWindow windowId={windowId} initialPath={file.path} initialName={file.name} />,
      <img src={icons.xsmall} alt="" />,
      { size: defaultWindowSize },
    );

    return {
      killInstance: () => {
        useWindowsStore.getState().closeWindow(pid);
        useTaskbarStore.getState().removeToolIcon(pid);
      },
    };
  },
};
