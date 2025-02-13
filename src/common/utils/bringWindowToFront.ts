import { WindowInfo } from "../types/window";

export function bringToFrontPreservingZOrder(
  windows: WindowInfo[],
  topId: string
): WindowInfo[] {
  const targetWindow = windows.find((w) => w.id === topId);
  if (!targetWindow) return windows;

  const oldZ = targetWindow.zIndex;
  const maxZ = windows.reduce((acc, w) => Math.max(acc, w.zIndex), 0);

  if (oldZ === maxZ) {
    // Rien à décaler, juste activer la fenêtre
    return windows.map((w) =>
      w.id === topId
        ? { ...w, isActive: true }
        : { ...w, isActive: false }
    );
  }

  return windows.map((w) => {
    if (w.id === topId) {
      return { ...w, zIndex: maxZ, isActive: true };
    } else if (w.zIndex > oldZ) {
      return { ...w, zIndex: w.zIndex - 1, isActive: false };
    } else {
      return { ...w, isActive: false };
    }
  });
}