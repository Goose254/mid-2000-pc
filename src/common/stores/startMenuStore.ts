import { create } from 'zustand';

export interface StartMenuState {
  isStartMenuVisible: boolean;
  toggleStartMenu: () => void;
}

export const useStartMenuStore = create<StartMenuState>((set) => ({
  isStartMenuVisible: false,
  toggleStartMenu: () =>
    set((state) => ({
      ...state,
      isStartMenuVisible: !state.isStartMenuVisible
    }))
}));
  