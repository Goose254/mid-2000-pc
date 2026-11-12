/**
 * Contexte par-instance de l'Explorateur : agrège l'état de navigation
 * (`useReducer`), la lecture RÉACTIVE du système de fichiers, la sélection, le
 * presse-papiers, les boîtes de dialogue/messages et le menu contextuel.
 *
 * Toute la logique « métier » de l'Explorateur vit ici ; les composants de vue
 * ne font que consommer ce contexte via `useExplorer()` (défini, avec les types
 * du contexte, dans `useExplorer.ts`).
 */
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FsError, childPath, getBaseName, getParentPath, isValidName, useFsStore } from '@/common/fs';
import type { FsFolderNode, TrashItem } from '@/common/fs';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { useAppsStore } from '@/common/stores/appsStore';
import type { NotepadLaunchArgs } from '@/apps/Notepad/main';

import {
  COMPUTER,
  Location,
  SortDir,
  SortKey,
  TRASH,
  VIRTUAL_DRIVES,
  ViewMode,
  compareEntries,
  computerGroups,
  defaultViewMode,
  folderLocation,
  locationIcon,
  locationTitle,
  parentLocation,
} from './model';
import { ExplorerItem, driveToItem, entryToItem, trashToItem } from './items';
import { isTrashItem, restoreTrashItems } from './trash';
import {
  canGoBack,
  canGoForward,
  canGoUp,
  explorerReducer,
  initialExplorerState,
} from './state';
import {
  Clipboard,
  ContextMenuState,
  DialogState,
  ExplorerContext,
  ExplorerContextValue,
  ExplorerGroup,
  MessageState,
} from './useExplorer';

/** Ouvre un fichier texte dans le Bloc-notes, lancé par le registre des applications. */
const openInNotepad = (path: string, name: string): void => {
  useAppsStore.getState().launchApp('notepad.exe', { path, name } satisfies NotepadLaunchArgs);
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Construit la liste (triée) des éléments d'un emplacement. */
const buildItems = (
  location: Location,
  root: FsFolderNode,
  trash: TrashItem[],
  sortKey: SortKey,
  sortDir: SortDir,
): ExplorerItem[] => {
  void root; // dépendance de réactivité (le store lit get().root en interne)
  const fs = useFsStore.getState();
  switch (location.kind) {
    case 'computer':
      return VIRTUAL_DRIVES.map(driveToItem);
    case 'trash':
      return trash.map(trashToItem);
    case 'folder': {
      try {
        const entries = fs.readDir(location.path);
        return [...entries].sort((a, b) => compareEntries(a, b, sortKey, sortDir)).map(entryToItem);
      } catch {
        return [];
      }
    }
  }
};

/** Trouve un nom libre dans `dir` à partir d'une base (« Nouveau dossier (2) »). */
const freeName = (dir: string, base: string, ext: string): string => {
  const fs = useFsStore.getState();
  const first = `${base}${ext}`;
  if (!fs.exists(childPath(dir, first))) return first;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base} (${i})${ext}`;
    if (!fs.exists(childPath(dir, candidate))) return candidate;
  }
  return `${base} (${Date.now()})${ext}`;
};

/** Nom de copie façon XP : « Copie de X », « Copie (2) de X »… */
const copyName = (dir: string, name: string): string => {
  const fs = useFsStore.getState();
  const first = `Copie de ${name}`;
  if (!fs.exists(childPath(dir, first))) return first;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `Copie (${i}) de ${name}`;
    if (!fs.exists(childPath(dir, candidate))) return candidate;
  }
  return `Copie (${Date.now()}) de ${name}`;
};

/** Message d'erreur lisible à partir d'une FsError. */
const fsErrorMessage = (err: unknown): string => {
  if (err instanceof FsError) {
    switch (err.code) {
      case 'EEXIST':
        return 'Un fichier ou dossier portant ce nom existe déjà.';
      case 'EINVAL':
        return "Le nom saisi n'est pas valide. Vérifiez qu'il ne contient pas de caractères interdits : \\ / : * ? \" < > |";
      case 'EPERM':
        return "Cette opération n'est pas autorisée.";
      default:
        return "L'opération a échoué.";
    }
  }
  return "L'opération a échoué.";
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface ExplorerProviderProps {
  windowId: string;
  initialLocation: Location;
  children: React.ReactNode;
}

export const ExplorerProvider: React.FC<ExplorerProviderProps> = ({ windowId, initialLocation, children }) => {
  const [state, dispatch] = useReducer(
    explorerReducer,
    undefined,
    () => initialExplorerState(initialLocation, defaultViewMode(initialLocation)),
  );

  // Réactivité FS : on s'abonne à `root` et `trash` du store.
  const fsRoot = useFsStore((s) => s.root);
  const fsTrash = useFsStore((s) => s.trash);

  const [clipboard, setClipboard] = useState<Clipboard | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Éléments affichés + regroupement éventuel (vue Poste de travail).
  // `refreshToken` force la relecture du FS sur « Actualiser » (dépendance voulue).
  const items = useMemo(
    () => buildItems(state.location, fsRoot, fsTrash, state.sortKey, state.sortDir),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.location, fsRoot, fsTrash, state.sortKey, state.sortDir, state.refreshToken],
  );

  const groups = useMemo<ExplorerGroup[] | null>(() => {
    if (state.location.kind !== 'computer') return null;
    return computerGroups().map((g) => ({
      title: g.title,
      items: g.drives.map(driveToItem),
    }));
  }, [state.location]);

  const currentFolderPath = state.location.kind === 'folder' ? state.location.path : null;

  const selectedItems = useMemo(
    () => items.filter((it) => state.selection.includes(it.key)),
    [items, state.selection],
  );

  // Met à jour le titre + l'icône de la fenêtre à chaque changement d'emplacement.
  useEffect(() => {
    useWindowsStore.getState().updateWindow(windowId, {
      title: locationTitle(state.location),
      icon: <img src={locationIcon(state.location)} alt="" />,
    });
  }, [windowId, state.location]);

  // --- Navigation ----------------------------------------------------------
  const navigate = useCallback((loc: Location) => dispatch({ type: 'navigate', location: loc }), []);
  const goBack = useCallback(() => dispatch({ type: 'back' }), []);
  const goForward = useCallback(() => dispatch({ type: 'forward' }), []);
  const goUp = useCallback(() => {
    const parent = parentLocation(state.location);
    if (parent) dispatch({ type: 'navigate', location: parent });
  }, [state.location]);
  const refresh = useCallback(() => dispatch({ type: 'refresh' }), []);

  const showMessage = useCallback((m: MessageState) => setMessage(m), []);
  const clearMessage = useCallback(() => setMessage(null), []);
  const openDialog = useCallback((d: DialogState) => setDialog(d), []);
  const closeDialog = useCallback(() => setDialog(null), []);

  const open = useCallback(
    (item: ExplorerItem) => {
      if (item.notReady) {
        showMessage({
          title: locationTitle(COMPUTER),
          icon: 'error',
          message: "Le lecteur n'est pas prêt. Vérifiez qu'un support est correctement inséré, puis réessayez.",
          confirmLabel: 'OK',
        });
        return;
      }
      if (item.navigateTo) {
        navigate(item.navigateTo);
        return;
      }
      if (item.kind === 'file' && item.path) {
        openInNotepad(item.path, item.name);
      }
    },
    [navigate, showMessage],
  );

  const navigatePath = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === '') return;
      // Alias conviviaux façon barre d'adresse XP.
      const lower = trimmed.toLowerCase();
      if (lower === 'poste de travail' || lower === 'mon ordinateur') {
        navigate(COMPUTER);
        return;
      }
      if (lower === 'corbeille') {
        navigate(TRASH);
        return;
      }
      const fs = useFsStore.getState();
      if (fs.exists(trimmed)) {
        const stat = fs.stat(trimmed);
        if (stat?.type === 'folder') {
          navigate(folderLocation(trimmed));
          return;
        }
        if (stat?.type === 'file') {
          openInNotepad(stat.path, stat.name);
          return;
        }
      }
      showMessage({
        title: 'Poste de travail',
        icon: 'error',
        message: (
          <>
            Windows ne trouve pas «&nbsp;{trimmed}&nbsp;». Vérifiez l'orthographe, puis réessayez.
          </>
        ),
        confirmLabel: 'OK',
      });
    },
    [navigate, showMessage],
  );

  // --- Sélection -----------------------------------------------------------
  const isSelected = useCallback((key: string) => state.selection.includes(key), [state.selection]);

  const clickSelect = useCallback(
    (key: string, e: { ctrlKey: boolean; shiftKey: boolean; metaKey: boolean }) => {
      if (e.ctrlKey || e.metaKey) {
        const next = state.selection.includes(key)
          ? state.selection.filter((k) => k !== key)
          : [...state.selection, key];
        dispatch({ type: 'select', keys: next, anchor: key });
        return;
      }
      if (e.shiftKey && state.selectionAnchor) {
        const keys = items.map((it) => it.key);
        const a = keys.indexOf(state.selectionAnchor);
        const b = keys.indexOf(key);
        if (a !== -1 && b !== -1) {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          dispatch({ type: 'select', keys: keys.slice(lo, hi + 1), anchor: state.selectionAnchor });
          return;
        }
      }
      dispatch({ type: 'select', keys: [key], anchor: key });
    },
    [state.selection, state.selectionAnchor, items],
  );

  const selectKeys = useCallback((keys: string[]) => dispatch({ type: 'select', keys }), []);
  const clearSelection = useCallback(() => dispatch({ type: 'clearSelection' }), []);
  const selectAll = useCallback(() => dispatch({ type: 'selectAll', keys: items.map((it) => it.key) }), [items]);

  // --- Affichage -----------------------------------------------------------
  const setView = useCallback((m: ViewMode) => dispatch({ type: 'setView', mode: m }), []);
  const toggleTree = useCallback(() => dispatch({ type: 'toggleTree' }), []);
  const setTree = useCallback((v: boolean) => dispatch({ type: 'setTree', value: v }), []);
  const toggleStatusBar = useCallback(() => dispatch({ type: 'toggleStatusBar' }), []);
  const setSort = useCallback((k: SortKey) => dispatch({ type: 'setSort', key: k }), []);

  // --- Opérations ----------------------------------------------------------
  const createFolder = useCallback(() => {
    if (!currentFolderPath) return;
    const fs = useFsStore.getState();
    const name = freeName(currentFolderPath, 'Nouveau dossier', '');
    try {
      fs.mkdir(childPath(currentFolderPath, name));
      dispatch({ type: 'beginRename', key: childPath(currentFolderPath, name) });
    } catch (err) {
      showMessage({ title: 'Nouveau dossier', icon: 'error', message: fsErrorMessage(err), confirmLabel: 'OK' });
    }
  }, [currentFolderPath, showMessage]);

  const createTextFile = useCallback(() => {
    if (!currentFolderPath) return;
    const fs = useFsStore.getState();
    const name = freeName(currentFolderPath, 'Nouveau document texte', '.txt');
    try {
      fs.writeFile(childPath(currentFolderPath, name), '');
      dispatch({ type: 'beginRename', key: childPath(currentFolderPath, name) });
    } catch (err) {
      showMessage({ title: 'Nouveau', icon: 'error', message: fsErrorMessage(err), confirmLabel: 'OK' });
    }
  }, [currentFolderPath, showMessage]);

  const beginRename = useCallback((key: string) => dispatch({ type: 'beginRename', key }), []);
  const cancelRename = useCallback(() => dispatch({ type: 'endRename' }), []);

  const commitRename = useCallback(
    (key: string, newName: string) => {
      const trimmed = newName.trim();
      dispatch({ type: 'endRename' });
      if (trimmed === '' || trimmed === getBaseName(key)) return;
      if (!isValidName(trimmed)) {
        showMessage({
          title: 'Renommer',
          icon: 'error',
          message: fsErrorMessage(new FsError('EINVAL', '', trimmed)),
          confirmLabel: 'OK',
        });
        return;
      }
      const fs = useFsStore.getState();
      try {
        fs.rename(key, trimmed);
        const parent = getParentPath(key);
        if (parent) dispatch({ type: 'select', keys: [childPath(parent, trimmed)] });
      } catch (err) {
        showMessage({ title: 'Renommer', icon: 'error', message: fsErrorMessage(err), confirmLabel: 'OK' });
      }
    },
    [showMessage],
  );

  const deleteSelection = useCallback(() => {
    const targets = selectedItems.filter((it) => it.editable && it.path);
    if (targets.length === 0) return;
    const fs = useFsStore.getState();
    const doDelete = () => {
      targets.forEach((it) => {
        try {
          fs.remove(it.path as string);
        } catch {
          /* ignore : élément déjà supprimé */
        }
      });
      dispatch({ type: 'clearSelection' });
    };
    const many = targets.length > 1;
    showMessage({
      title: many ? 'Confirmation de la suppression de plusieurs éléments' : "Confirmation de la suppression du fichier",
      icon: 'warning',
      message: many
        ? `Voulez-vous vraiment envoyer ces ${targets.length} éléments dans la Corbeille ?`
        : `Voulez-vous vraiment envoyer « ${targets[0].name} » dans la Corbeille ?`,
      confirmLabel: 'Oui',
      onConfirm: doDelete,
      cancelLabel: 'Non',
    });
  }, [selectedItems, showMessage]);

  // --- Corbeille ---------------------------------------------------------
  const { t: tTrash } = useTranslation('common', { keyPrefix: 'explorer.recycleBin' });

  const restoreFromTrash = useCallback(
    (scope: 'selection' | 'all') => {
      const targets = (scope === 'all' ? items : selectedItems).filter(isTrashItem);
      if (targets.length === 0) return;

      const failures = restoreTrashItems(targets, useFsStore.getState().restore);
      dispatch({ type: 'clearSelection' });

      if (failures.length > 0) {
        showMessage({
          title: tTrash('restoreErrorTitle'),
          icon: 'error',
          message: (
            <>
              {failures.map((failure, index) => (
                <div key={index}>{tTrash(`restoreError.${failure.reason}`, { name: failure.name })}</div>
              ))}
            </>
          ),
          confirmLabel: tTrash('ok'),
        });
      }
    },
    [items, selectedItems, showMessage, tTrash],
  );

  const emptyTrash = useCallback(() => {
    const trashed = useFsStore.getState().listTrash();
    if (trashed.length === 0) return;

    // Même boîte de confirmation que Windows XP : le nom de l'élément s'il est
    // seul, leur nombre sinon.
    const many = trashed.length > 1;
    showMessage({
      title: many ? tTrash('confirmDeleteMultipleTitle') : tTrash('confirmDeleteTitle'),
      icon: 'warning',
      message: many
        ? tTrash('confirmDeleteMany', { total: trashed.length })
        : tTrash('confirmDeleteOne', { name: trashed[0].node.name }),
      confirmLabel: tTrash('yes'),
      onConfirm: () => {
        useFsStore.getState().emptyTrash();
        dispatch({ type: 'clearSelection' });
      },
      cancelLabel: tTrash('no'),
    });
  }, [showMessage, tTrash]);

  const cut = useCallback(() => {
    const paths = selectedItems.filter((it) => it.editable && it.path).map((it) => it.path as string);
    if (paths.length) setClipboard({ paths, op: 'cut' });
  }, [selectedItems]);

  const copy = useCallback(() => {
    const paths = selectedItems.filter((it) => it.editable && it.path).map((it) => it.path as string);
    if (paths.length) setClipboard({ paths, op: 'copy' });
  }, [selectedItems]);

  const paste = useCallback(() => {
    if (!clipboard || !currentFolderPath) return;
    const fs = useFsStore.getState();
    let failed = 0;
    clipboard.paths.forEach((src) => {
      try {
        if (clipboard.op === 'copy') {
          const base = getBaseName(src);
          const collides = fs.exists(childPath(currentFolderPath, base));
          fs.copy(src, currentFolderPath, collides ? copyName(currentFolderPath, base) : undefined);
        } else {
          fs.move(src, currentFolderPath);
        }
      } catch {
        failed += 1;
      }
    });
    if (clipboard.op === 'cut') setClipboard(null);
    if (failed > 0) {
      showMessage({
        title: 'Coller',
        icon: 'error',
        message: `${failed} élément(s) n'ont pas pu être collés (nom en conflit ou emplacement invalide).`,
        confirmLabel: 'OK',
      });
    }
  }, [clipboard, currentFolderPath, showMessage]);

  const canPaste = clipboard !== null && currentFolderPath !== null;

  const openContextMenu = useCallback((x: number, y: number, target: ExplorerItem | null) => {
    setContextMenu({ x, y, target });
  }, []);
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const value: ExplorerContextValue = {
    windowId,
    state,
    items,
    groups,
    selectedItems,
    currentFolderPath,
    canBack: canGoBack(state),
    canForward: canGoForward(state),
    canUp: canGoUp(state),
    navigate,
    goBack,
    goForward,
    goUp,
    refresh,
    open,
    navigatePath,
    isSelected,
    clickSelect,
    selectKeys,
    clearSelection,
    selectAll,
    setView,
    toggleTree,
    setTree,
    toggleStatusBar,
    setSort,
    sortKey: state.sortKey,
    sortDir: state.sortDir,
    createFolder,
    createTextFile,
    beginRename,
    commitRename,
    cancelRename,
    deleteSelection,
    cut,
    copy,
    paste,
    clipboard,
    canPaste,
    trashCount: fsTrash.length,
    restoreFromTrash,
    emptyTrash,
    dialog,
    openDialog,
    closeDialog,
    message,
    showMessage,
    clearMessage,
    contextMenu,
    openContextMenu,
    closeContextMenu,
  };

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
};
