/**
 * État par-instance de l'Explorateur (navigation, sélection, affichage).
 *
 * Chaque fenêtre d'Explorateur possède SON état (l'app est multi-instances) :
 * on utilise donc un `useReducer` local (via un Context), et surtout PAS un
 * store Zustand global qui serait partagé entre toutes les fenêtres.
 *
 * Ce module est pur : il ne touche ni au FS, ni aux stores de fenêtres. Les
 * effets (lecture FS, ouverture de fichiers, mise à jour du titre de fenêtre)
 * sont déclenchés par les composants à partir de cet état.
 */
import { COMPUTER, Location, SortDir, SortKey, ViewMode, sameLocation } from './model';

export interface ExplorerState {
  /** Emplacement courant. */
  location: Location;
  /** Pile « Précédente » (le plus récent en fin). */
  back: Location[];
  /** Pile « Suivante ». */
  forward: Location[];
  /** Mode d'affichage courant. */
  viewMode: ViewMode;
  /** Volet gauche : arborescence (`true`) vs volet des tâches (`false`). */
  showTree: boolean;
  /** Barre d'état visible. */
  showStatusBar: boolean;
  /** Clés des éléments sélectionnés (chemin FS, ou `drive:<id>`). */
  selection: string[];
  /** Ancre de sélection pour Maj+clic (sélection par plage). */
  selectionAnchor: string | null;
  /** Colonne de tri (mode Détails). */
  sortKey: SortKey;
  sortDir: SortDir;
  /** Clé de l'élément en cours de renommage inline, ou null. */
  renaming: string | null;
  /** Compteur d'actualisation forcée (relit le FS même sans changement d'état). */
  refreshToken: number;
}

export const initialExplorerState = (location: Location, viewMode: ViewMode): ExplorerState => ({
  location,
  back: [],
  forward: [],
  viewMode,
  showTree: false,
  showStatusBar: true,
  selection: [],
  selectionAnchor: null,
  sortKey: 'name',
  sortDir: 'asc',
  renaming: null,
  refreshToken: 0,
});

export type ExplorerAction =
  | { type: 'navigate'; location: Location }
  | { type: 'back' }
  | { type: 'forward' }
  | { type: 'setView'; mode: ViewMode }
  | { type: 'toggleTree' }
  | { type: 'setTree'; value: boolean }
  | { type: 'toggleStatusBar' }
  | { type: 'select'; keys: string[]; anchor?: string | null }
  | { type: 'selectAll'; keys: string[] }
  | { type: 'clearSelection' }
  | { type: 'setSort'; key: SortKey }
  | { type: 'beginRename'; key: string }
  | { type: 'endRename' }
  | { type: 'refresh' };

/** Empile l'emplacement courant dans l'historique si différent de la cible. */
export const explorerReducer = (state: ExplorerState, action: ExplorerAction): ExplorerState => {
  switch (action.type) {
    case 'navigate': {
      if (sameLocation(state.location, action.location)) {
        // Même emplacement : simple ré-actualisation, on garde l'historique.
        return { ...state, selection: [], renaming: null, refreshToken: state.refreshToken + 1 };
      }
      return {
        ...state,
        location: action.location,
        back: [...state.back, state.location],
        forward: [],
        selection: [],
        selectionAnchor: null,
        renaming: null,
      };
    }
    case 'back': {
      if (state.back.length === 0) return state;
      const prev = state.back[state.back.length - 1];
      return {
        ...state,
        location: prev,
        back: state.back.slice(0, -1),
        forward: [state.location, ...state.forward],
        selection: [],
        selectionAnchor: null,
        renaming: null,
      };
    }
    case 'forward': {
      if (state.forward.length === 0) return state;
      const next = state.forward[0];
      return {
        ...state,
        location: next,
        forward: state.forward.slice(1),
        back: [...state.back, state.location],
        selection: [],
        selectionAnchor: null,
        renaming: null,
      };
    }
    case 'setView':
      return { ...state, viewMode: action.mode };
    case 'toggleTree':
      return { ...state, showTree: !state.showTree };
    case 'setTree':
      return { ...state, showTree: action.value };
    case 'toggleStatusBar':
      return { ...state, showStatusBar: !state.showStatusBar };
    case 'select':
      return {
        ...state,
        selection: action.keys,
        selectionAnchor: action.anchor !== undefined ? action.anchor : action.keys[action.keys.length - 1] ?? null,
      };
    case 'selectAll':
      return { ...state, selection: action.keys, selectionAnchor: state.selectionAnchor };
    case 'clearSelection':
      return { ...state, selection: [], selectionAnchor: null };
    case 'setSort': {
      // Même colonne → inverse la direction ; sinon tri ascendant sur la nouvelle.
      if (state.sortKey === action.key) {
        return { ...state, sortDir: state.sortDir === 'asc' ? 'desc' : 'asc' };
      }
      return { ...state, sortKey: action.key, sortDir: 'asc' };
    }
    case 'beginRename':
      return { ...state, renaming: action.key, selection: [action.key] };
    case 'endRename':
      return { ...state, renaming: null };
    case 'refresh':
      return { ...state, refreshToken: state.refreshToken + 1 };
    default:
      return state;
  }
};

export const canGoBack = (s: ExplorerState): boolean => s.back.length > 0;
export const canGoForward = (s: ExplorerState): boolean => s.forward.length > 0;
export const canGoUp = (s: ExplorerState): boolean => s.location.kind !== 'computer';

export { COMPUTER };
