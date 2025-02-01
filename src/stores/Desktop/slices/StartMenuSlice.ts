export interface StartMenuState {
    isStartMenuVisible: boolean;
    toggleStartMenu: () => void;
  }
  
  /**
   * Pour "construire" ce slice, Zustand attend une fonction qui reçoit `set` et `get`.
   * Cette fonction doit retourner un objet conforme à `StartMenuState`.
   */
  export const createStartMenuSlice = (
    set: (fn: (prev: StartMenuState) => StartMenuState) => void
  ): StartMenuState => ({
    isStartMenuVisible: false,
    toggleStartMenu: () =>
      set((state) => ({
        ...state,
        isStartMenuVisible: !state.isStartMenuVisible
      }))
  });
  