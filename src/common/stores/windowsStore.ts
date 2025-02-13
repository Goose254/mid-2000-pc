import { create } from 'zustand';
import { WindowInfo } from '../types/window';
import { bringToFrontPreservingZOrder } from '../utils/bringWindowToFront';
import { useAppsStore } from './appsStore';

export interface WindowsState {
  windows: WindowInfo[];

  openWindow: (
    id: string,
    appPid: string,
    title: string,
    content: React.ReactNode,
    icon?: React.ReactElement,
    options?: Partial<Pick<
      WindowInfo,
      | 'position'
      | 'size'
      | 'fixedSize'
      | 'showHelpButton'
      | 'showMinimizeButton'
      | 'showMaximizeButton'
      | 'showCloseButton'
    >>
  ) => void;
  closeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  setWindowInactive: (id: string) => void;
  setWindowPosition: (id: string, position: WindowInfo["position"]) => void;
  setWindowSize: (id: string, size: WindowInfo["size"]) => void;
  toggleMinimizeWindow: (id: string) => void;

  updateWindow: (id: string, newConfig: Partial<WindowInfo>) => void;
}

export const useWindowsStore = create<WindowsState>((set) => ({
  windows: [],

  // --------------------------------------
  // Ouvrir ou restaurer une fenêtre
  // --------------------------------------
  openWindow: (
    id,
    appPid,
    title,
    content,
    icon,
    options = {}
  ) => {
    set((prev) => {
      const existing = prev.windows.find((w) => w.id === id && w.appPid === appPid);
      if (existing) {
        // Si elle existe déjà : si elle est minimisée, on la restaure.
        // Puis on la "bringToFront".
        const updated = prev.windows.map((w) =>
          w.id === id
            ? { ...w, isMinimized: false }
            : w
        );
        return {
          ...prev,
          windows: bringToFrontPreservingZOrder(updated, id),
        };
      } else {
        // Nouvelle fenêtre
        const currentMaxZ = prev.windows.reduce(
          (acc, w) => Math.max(acc, w.zIndex),
          0
        );
  
        const newWindow: WindowInfo = {
          id,
          appPid,
          title,
          icon,
          content,
          position: options.position ?? { x: 100, y: 100 },
          size: options.size ?? { width: 600, height: 400 },
          isMinimized: false,
          isMaximized: false,
          isActive: true,
          zIndex: currentMaxZ + 1,
  
          // Les nouvelles options, avec une valeur par défaut si non fourni
          fixedSize: options.fixedSize ?? false,
          showHelpButton: options.showHelpButton ?? false,
          showMinimizeButton: options.showMinimizeButton ?? true,
          showMaximizeButton: options.showMaximizeButton ?? true,
          showCloseButton: options.showCloseButton ?? true,
        };
  
        return {
          ...prev,
          windows: [...prev.windows, newWindow],
        };
      }
    });
  },

  // --------------------------------------
  // Fermer une fenêtre
  // --------------------------------------
  closeWindow: (id) => {
    set((prev) => {
      // Récupérer la fenêtre à fermer
      const windowToClose = prev.windows.find((w) => w.id === id);
      // Filtrer la liste pour exclure la fenêtre fermée
      const updatedWindows = prev.windows.filter((w) => w.id !== id);

      // Si la fenêtre fermée est liée à un appPid, vérifier si d'autres fenêtres existent pour cette instance
      if (windowToClose && windowToClose.appPid) {
        const remainingWindows = updatedWindows.filter(
          (w) => w.appPid === windowToClose.appPid
        );
        if (remainingWindows.length === 0) {
          // Aucune fenêtre restante pour cette instance : on appelle killInstance du store appsStore
          useAppsStore.getState().killInstance(windowToClose.appPid);
        }
      }

      return {
        ...prev,
        windows: updatedWindows,
      };
    });
  },

  // --------------------------------------
  // Mettre la fenêtre en avant
  // --------------------------------------
  bringToFront: (id) => {
    set((prev) => ({
      ...prev,
      windows: bringToFrontPreservingZOrder(prev.windows, id),
    }));
  },

  // --------------------------------------
  // Rendre une fenêtre inActive
  // --------------------------------------
  setWindowInactive: (id) => {
    set((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === id ? { ...w, isActive: false } : w
      ),
    }));
  },

  // --------------------------------------
  // Déplacer la fenêtre
  // --------------------------------------
  setWindowPosition: (id, position) => {
    set((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === id ? { ...w, position } : w
      ),
    }));
  },

  // --------------------------------------
  // Redimensionner la fenêtre
  // --------------------------------------
  setWindowSize: (id, size) => {
    set((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === id ? { ...w, size } : w
      ),
    }));
  },

  // --------------------------------------
  // Minimize / Restore
  // --------------------------------------
  toggleMinimizeWindow: (id) => {
    set((prev) => {
      const target = prev.windows.find((w) => w.id === id);
      if (!target) return prev;

      const isMinimisable = target.showMinimizeButton;
      const isMinimized = target.isMinimized;
      const isActive = target.isActive;

      // Règles d'exemple :
      // 1. si minimisée => restaurer (et bring to front)
      // 2. si active => minimiser
      // 3. sinon => ramener devant
      let updated = prev.windows.map((w) => {
        if (w.id === id) {
          if (isMinimized) {
            return { ...w, isMinimized: false };
          } else if (isActive && isMinimisable) {
            return { ...w, isMinimized: true, isActive: false };
          } else {
            return { ...w, isMinimized: false };
          }
        }
        // Les autres restent telles qu'elles sont
        return w;
      });

      // Si on restaure (était minimisée) ou si on la ramène devant (n’était pas active),
      // on applique bringToFrontPreservingZOrder
      const needsFront = isMinimized || (!isMinimized && !isActive);

      return {
        ...prev,
        windows: needsFront
          ? bringToFrontPreservingZOrder(updated, id)
          : updated,
      };
    });
  },

  // --------------------------------------
  // Update générique d'une fenêtre
  // --------------------------------------
  updateWindow: (id, newConfig) => {
    set((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === id ? { ...w, ...newConfig } : w
      ),
    }));
  },
}));
