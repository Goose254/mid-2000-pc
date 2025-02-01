import { create } from 'zustand';
import { createOverlaySlice, OverlayState } from './slices/OverlaySlice';
import { createWindowsSlice, WindowsState } from './slices/WindowsSlice';
import { createIconsSlice, IconsState } from './slices/IconsSlice';
import { createStartMenuSlice, StartMenuState } from './slices/StartMenuSlice';

/**
 * Combinaison de tous les états/slices pour le store global
 */
export type DesktopState = OverlayState & StartMenuState & WindowsState & IconsState;

export const useDesktopStore = create<DesktopState>((set, get) => ({
  // On étend l'état en appelant les factory functions
  ...createOverlaySlice(set),
  ...createStartMenuSlice(set),
  ...createWindowsSlice(set, get),
  ...createIconsSlice(set, get),
}));
