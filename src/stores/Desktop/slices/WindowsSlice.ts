import { ReactNode, ReactElement } from 'react';

export interface WindowInfo {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isActive: boolean;
  zIndex: number;
  icon: ReactElement;
  content: ReactNode;
}

export interface WindowsState {
  windows: WindowInfo[];
  maxZIndex: number;

  openWindow: (id: string, title: string, icon: ReactElement, content: ReactNode) => void;
  closeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  setWindowInactive: (id: string) => void;
  toggleMinimizeWindow: (id: string) => void;

  // Méthode générique de mise à jour
  updateWindow: (id: string, newConfig: Partial<WindowInfo>) => void;
}

export const createWindowsSlice = (
  set: (fn: (prev: WindowsState) => WindowsState) => void,
  get: () => WindowsState
): WindowsState => ({
  windows: [],
  maxZIndex: 1,

  /**
   * Ouvre ou restaure une fenêtre, en reprenant la logique
   * que tu utilisais localement dans Desktop.
   */
  openWindow: (id, title, icon, content) => {
    const state = get();
    const existingWindow = state.windows.find((w) => w.id === id);

    if (existingWindow) {
      // Si la fenêtre existe déjà
      if (existingWindow.isMinimized) {
        // On la restaure
        set((prev) => ({
          ...prev,
          maxZIndex: prev.maxZIndex + 1,
          windows: prev.windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  isMinimized: false,
                  isActive: true,
                  zIndex: prev.maxZIndex + 1,
                }
              : w
          ),
        }));
      } else {
        // Sinon, on la met simplement au premier plan
        set((prev) => ({
          ...prev,
          maxZIndex: prev.maxZIndex + 1,
          windows: prev.windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  isActive: true,
                  zIndex: prev.maxZIndex + 1,
                }
              : w
          ),
        }));
      }
    } else {
      // Création d'une nouvelle fenêtre
      set((prev) => ({
        ...prev,
        maxZIndex: prev.maxZIndex + 1,
        windows: [
          ...prev.windows,
          {
            id,
            title,
            icon,
            content,
            isMinimized: false,
            isActive: true,
            zIndex: prev.maxZIndex + 1,
            // Position et taille par défaut (ou aléatoire)
            position: { x: 100, y: 100 },
            size: { width: 600, height: 400 },
          },
        ],
      }));
    }
  },

  /**
   * Ferme la fenêtre (on la retire de la liste).
   */
  closeWindow: (id) => {
    set((prev) => ({
      ...prev,
      windows: prev.windows.filter((w) => w.id !== id),
    }));
  },

  /**
   * Met la fenêtre `id` au premier plan (active, zIndex max).
   */
  bringToFront: (id) => {
    set((prev) => ({
      ...prev,
      maxZIndex: prev.maxZIndex + 1,
      windows: prev.windows.map((w) =>
        w.id === id
          ? { ...w, zIndex: prev.maxZIndex + 1, isActive: true }
          : w
      ),
    }));
  },

  /**
   * Rend la fenêtre `id` inactive.
   */
  setWindowInactive: (id) => {
    set((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === id
          ? { ...w, isActive: false }
          : w
      ),
    }));
  },

  /**
   * Minimise ou restaure une fenêtre (via la Taskbar).
   */
  toggleMinimizeWindow: (id) => {
    set((prev) => {
      const windowToMinimize = prev.windows.find((w) => w.id === id);
      if (!windowToMinimize) return prev; // fenêtre non trouvée, on ne fait rien

      const isActive = windowToMinimize.isActive;
      const isMinimized = windowToMinimize.isMinimized;

      // 2 cas :
      // - si elle est active => on la minimise
      // - si elle est minimisée => on la restaure
      // - sinon => on la met au premier plan
      let updatedWindows = prev.windows.map((w) => {
        if (w.id === id) {
          if (isMinimized || !isActive) {
            // Restaure
            return {
              ...w,
              isMinimized: false,
              isActive: true,
              zIndex: prev.maxZIndex + 1,
            };
          } else {
            // Minimise
            return {
              ...w,
              isMinimized: true,
              isActive: false,
            };
          }
        }
        // On peut rendre les autres inactives
        return { ...w, isActive: false };
      });

      return {
        ...prev,
        maxZIndex: isMinimized ? prev.maxZIndex + 1 : prev.maxZIndex,
        windows: updatedWindows,
      };
    });
  },

  /**
   * Méthode générique pour mettre à jour une fenêtre en particulier.
   */
  updateWindow: (id, newConfig) => {
    set((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === id ? { ...w, ...newConfig } : w
      ),
    }));
  },
});
