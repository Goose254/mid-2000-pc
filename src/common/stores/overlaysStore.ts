import { create } from 'zustand';

export interface OverlayState {
  isShutdownOverlayVisible: boolean;
  toggleShutdownOverlay: () => void;
}
  
export const useOverlaysStore = create<OverlayState>((set) => ({
  isShutdownOverlayVisible: false,
  toggleShutdownOverlay: () =>
    set((state) => ({
      ...state,
      isShutdownOverlayVisible: !state.isShutdownOverlayVisible
    }))
}));
