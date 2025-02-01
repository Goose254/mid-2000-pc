export interface WindowInfo {
  id: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  // Ajoutez d'autres propriétés au besoin
}

export interface WindowsState {
  windows: WindowInfo[];
  openWindow: (windowConfig: WindowInfo) => void;
  closeWindow: (id: string) => void;
  updateWindow: (id: string, newConfig: Partial<WindowInfo>) => void;
}

export const createWindowsSlice = (
  set: (fn: (prev: WindowsState) => WindowsState) => void,
  get: () => WindowsState
): WindowsState => ({
  windows: [],
  openWindow: (windowConfig) => {
    set((state) => ({
      ...state,
      windows: [...state.windows, windowConfig]
    }));
  },
  closeWindow: (id) => {
    set((state) => ({
      ...state,
      windows: state.windows.filter((w) => w.id !== id)
    }));
  },
  updateWindow: (id, newConfig) => {
    set((state) => ({
      ...state,
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, ...newConfig } : w
      )
    }));
  }
});
