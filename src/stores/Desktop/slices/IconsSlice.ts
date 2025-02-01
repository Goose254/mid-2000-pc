export interface DesktopIconInfo {
  id: string;
  label: string;
  position: { x: number; y: number };
  // Ajoutez d'autres propriétés si besoin
}

export interface IconsState {
  icons: DesktopIconInfo[];
  addIcon: (icon: DesktopIconInfo) => void;
  removeIcon: (id: string) => void;
}

export const createIconsSlice = (
  set: (fn: (prev: IconsState) => IconsState) => void,
  get: () => IconsState
): IconsState => ({
  icons: [],
  addIcon: (icon) => {
    set((state) => ({
      ...state,
      icons: [...state.icons, icon]
    }));
  },
  removeIcon: (id) => {
    set((state) => ({
      ...state,
      icons: state.icons.filter((icon) => icon.id !== id)
    }));
  }
});
