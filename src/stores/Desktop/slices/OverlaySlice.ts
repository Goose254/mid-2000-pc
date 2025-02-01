export interface OverlayState {
  isShutdownOverlayVisible: boolean;
  toggleShutdownOverlay: () => void;
}

/**
 * Pour "construire" ce slice, Zustand attend une fonction qui reçoit `set` et `get`.
 * Cette fonction doit retourner un objet conforme à `OverlayState`.
 */
export const createOverlaySlice = (
  set: (fn: (prev: OverlayState) => OverlayState) => void
): OverlayState => ({
  isShutdownOverlayVisible: false,
  toggleShutdownOverlay: () =>
    set((state) => ({
      ...state,
      isShutdownOverlayVisible: !state.isShutdownOverlayVisible
    }))
});
