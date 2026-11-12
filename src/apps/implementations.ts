/**
 * Code de chaque application du registre, indexé par identifiant.
 *
 * Seul `appsStore.launchApp` lit cette table : le reste du shell ne connaît
 * que les fiches du registre (`registry.ts`).
 */
import type { AppImplementation } from '@/common/types/appTemplate';
import { ExplorerApp } from './Explorer/main';
import { MinesweeperApp } from './Minesweeper/main';
import { NotepadApp } from './Notepad/main';
import { TaskManagerApp } from './TaskManager/main';
import { UserAccountsApp } from './UserAccounts/main';

export const APP_IMPLEMENTATIONS: Readonly<Record<string, AppImplementation>> = {
  'explorer.exe': ExplorerApp,
  'notepad.exe': NotepadApp,
  'taskmgr.exe': TaskManagerApp,
  'nusrmgr.cpl': UserAccountsApp,
  'winmine.exe': MinesweeperApp,
};
