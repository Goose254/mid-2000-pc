/**
 * Contexte de l'Explorateur : sa forme (`ExplorerContextValue` et les types
 * auxiliaires), l'objet contexte et le hook `useExplorer()` que consomment les
 * composants de vue.
 *
 * Le composant qui le fournit, `ExplorerProvider`, vit dans
 * `ExplorerContext.tsx` : un fichier de composant ne doit exporter que des
 * composants pour que le rechargement à chaud de React fonctionne.
 */
import { createContext, useContext } from 'react';
import type React from 'react';

import type { Location, SortDir, SortKey, ViewMode } from './model';
import type { ExplorerItem } from './items';
import type { ExplorerState } from './state';

// ---------------------------------------------------------------------------
// Types auxiliaires (presse-papiers, dialogues, messages, menu contextuel)
// ---------------------------------------------------------------------------

export interface Clipboard {
  /** Chemins FS des éléments copiés/coupés. */
  paths: string[];
  op: 'copy' | 'cut';
}

export type DialogState =
  | { kind: 'properties'; item: ExplorerItem | null } // null = propriétés du dossier courant
  | { kind: 'folderOptions' }
  | { kind: 'about' };

export interface MessageState {
  title: string;
  icon: 'warning' | 'error' | 'info';
  message: React.ReactNode;
  confirmLabel: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
}

export interface ContextMenuState {
  x: number;
  y: number;
  /** Élément ciblé, ou null pour un clic dans le vide. */
  target: ExplorerItem | null;
}

export interface ExplorerGroup {
  title: string;
  items: ExplorerItem[];
}

export interface ExplorerContextValue {
  windowId: string;
  state: ExplorerState;
  // Données affichées
  items: ExplorerItem[];
  groups: ExplorerGroup[] | null; // regroupement (vue Poste de travail) ou null
  selectedItems: ExplorerItem[];
  currentFolderPath: string | null;
  // Capacités de navigation
  canBack: boolean;
  canForward: boolean;
  canUp: boolean;
  // Navigation
  navigate: (loc: Location) => void;
  goBack: () => void;
  goForward: () => void;
  goUp: () => void;
  refresh: () => void;
  open: (item: ExplorerItem) => void;
  navigatePath: (path: string) => void;
  // Sélection
  isSelected: (key: string) => boolean;
  clickSelect: (key: string, e: { ctrlKey: boolean; shiftKey: boolean; metaKey: boolean }) => void;
  selectKeys: (keys: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  // Affichage
  setView: (m: ViewMode) => void;
  toggleTree: () => void;
  setTree: (v: boolean) => void;
  toggleStatusBar: () => void;
  setSort: (k: SortKey) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  // Opérations
  createFolder: () => void;
  createTextFile: () => void;
  beginRename: (key: string) => void;
  commitRename: (key: string, newName: string) => void;
  cancelRename: () => void;
  deleteSelection: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  clipboard: Clipboard | null;
  canPaste: boolean;
  // Dialogues / messages / menu contextuel
  dialog: DialogState | null;
  openDialog: (d: DialogState) => void;
  closeDialog: () => void;
  message: MessageState | null;
  showMessage: (m: MessageState) => void;
  clearMessage: () => void;
  contextMenu: ContextMenuState | null;
  openContextMenu: (x: number, y: number, target: ExplorerItem | null) => void;
  closeContextMenu: () => void;
}

/** Le contexte lui-même ; seul `ExplorerProvider` le fournit. */
export const ExplorerContext = createContext<ExplorerContextValue | null>(null);

/** Hook d'accès au contexte de l'Explorateur (lève si hors provider). */
export const useExplorer = (): ExplorerContextValue => {
  const ctx = useContext(ExplorerContext);
  if (!ctx) throw new Error('useExplorer doit être utilisé dans <ExplorerProvider>');
  return ctx;
};
