import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { selectDesktopWindows, useWindowsStore } from '@/common/stores/windowsStore';
import { useOverlaysStore } from '@/common/stores/overlaysStore';

import { WindowsShutdownOverlay } from '@/components/templates/WindowsShutdownOverlay/WindowsShutdownOverlay';
import { DesktopIcon } from '@/components/atoms/DesktopIcon/DesktopIcon';
import { Window } from '@/components/organisms/Window/Window';
import { Taskbar } from '@/components/organisms/Taskbar/Taskbar';

import XPWallpaper from '@/assets/xp-wallpaper.jpg';
import TeamsIcon from '@/assets/program-icons/teams.exe.svg';

import { useAppsStore } from '@/common/stores/appsStore';
import { getDesktopShortcuts } from '@/apps/registry';
import { TASKBAR_HEIGHT, TASKBAR_HEIGHT_CSS_VAR } from '@/common/constants/layout';
import { DesktopContextMenu } from './DesktopContextMenu';
import styles from './Desktop.module.scss';

const ICON_GRID_CELL_WIDTH = 94;
const ICON_GRID_CELL_HEIGHT = 80;
const ICON_DRAG_THRESHOLD = 4;
const DESKTOP_ICON_POSITIONS_STORAGE_KEY = 'desktop-icon-positions-v1';

interface IconGridPosition {
  col: number;
  row: number;
}

interface DesktopIconConfig {
  id: string;
  icon: React.ReactElement;
  label: string;
  shortcut?: boolean;
  onDoubleClick: () => void;
}

interface GridBounds {
  cols: number;
  rows: number;
}

interface DragState {
  iconId: string;
  origin: IconGridPosition;
  startClientX: number;
  startClientY: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  isDragging: boolean;
}

type IconPositions = Record<string, IconGridPosition>;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const getCellKey = (col: number, row: number): string => `${col}:${row}`;

const getGridBounds = (width: number, height: number): GridBounds => ({
  cols: Math.max(1, Math.floor(width / ICON_GRID_CELL_WIDTH)),
  rows: Math.max(1, Math.floor(height / ICON_GRID_CELL_HEIGHT)),
});

const findFirstFreeCell = (occupied: Set<string>, bounds: GridBounds): IconGridPosition => {
  for (let col = 0; col < bounds.cols; col++) {
    for (let row = 0; row < bounds.rows; row++) {
      if (!occupied.has(getCellKey(col, row))) {
        return { col, row };
      }
    }
  }

  return {
    col: bounds.cols - 1,
    row: bounds.rows - 1,
  };
};

const readStoredIconPositions = (): IconPositions => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DESKTOP_ICON_POSITIONS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const positions: IconPositions = {};
    for (const [iconId, value] of Object.entries(parsed)) {
      if (
        value &&
        typeof value === 'object' &&
        typeof (value as IconGridPosition).col === 'number' &&
        typeof (value as IconGridPosition).row === 'number'
      ) {
        positions[iconId] = {
          col: (value as IconGridPosition).col,
          row: (value as IconGridPosition).row,
        };
      }
    }

    return positions;
  } catch {
    return {};
  }
};

const writeStoredIconPositions = (positions: IconPositions): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      DESKTOP_ICON_POSITIONS_STORAGE_KEY,
      JSON.stringify(positions)
    );
  } catch {
    // Silently ignore storage errors (private mode / quota exceeded).
  }
};

const normalizeIconPositions = (
  icons: DesktopIconConfig[],
  sourcePositions: IconPositions,
  bounds: GridBounds
): IconPositions => {
  const nextPositions: IconPositions = {};
  const occupied = new Set<string>();

  icons.forEach((icon, index) => {
    const fallbackPosition: IconGridPosition = {
      col: Math.floor(index / bounds.rows),
      row: index % bounds.rows,
    };

    const rawPosition = sourcePositions[icon.id] ?? fallbackPosition;
    const clampedPosition: IconGridPosition = {
      col: clamp(Math.round(rawPosition.col), 0, bounds.cols - 1),
      row: clamp(Math.round(rawPosition.row), 0, bounds.rows - 1),
    };

    let finalPosition = clampedPosition;
    const cellKey = getCellKey(clampedPosition.col, clampedPosition.row);
    const isGridFull = occupied.size >= bounds.cols * bounds.rows;

    if (occupied.has(cellKey) && !isGridFull) {
      finalPosition = findFirstFreeCell(occupied, bounds);
    }

    occupied.add(getCellKey(finalPosition.col, finalPosition.row));
    nextPositions[icon.id] = finalPosition;
  });

  return nextPositions;
};

const areIconPositionsEqual = (
  icons: DesktopIconConfig[],
  a: IconPositions,
  b: IconPositions
): boolean =>
  icons.every((icon) => {
    const aPosition = a[icon.id];
    const bPosition = b[icon.id];

    if (!aPosition || !bPosition) {
      return false;
    }

    return aPosition.col === bPosition.col && aPosition.row === bPosition.row;
  });

export const Desktop: React.FC = () => {
  const windows = useWindowsStore((state) => state.windows);

  const isShutdownOverlayVisible = useOverlaysStore(
    (state) => state.isShutdownOverlayVisible
  );

  const launchApp = useAppsStore((state) => state.launchApp);
  // Une application est en cours de chargement : curseur « flèche + sablier ».
  const isLaunchingApp = useAppsStore((state) => state.pendingLaunches > 0);

  const [desktopAreaSize, setDesktopAreaSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? Math.max(0, window.innerHeight - TASKBAR_HEIGHT) : 0,
  }));
  const [iconPositions, setIconPositions] = useState<IconPositions>({});
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hasInitializedIconPositions, setHasInitializedIconPositions] =
    useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  const desktopAreaRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedStoredPositionsRef = useRef<boolean>(false);

  const openTeams = useCallback(() => {
    window.open('https://teams-suggest.douay.me', '_blank', 'noopener,noreferrer');
  }, []);

  // Les icônes d'application viennent du registre (`src/apps/registry.ts`) ;
  // seul le raccourci vers Microsoft Teams, un lien externe, est déclaré ici.
  const desktopIcons = useMemo<DesktopIconConfig[]>(
    () => [
      ...getDesktopShortcuts().map((shortcut) => ({
        id: shortcut.id,
        icon: <img src={shortcut.icon} alt="" />,
        label: shortcut.label,
        onDoubleClick: () => {
          launchApp(shortcut.appId, shortcut.args);
        },
      })),
      {
        id: 'microsoft-teams',
        icon: <img src={TeamsIcon} alt="Microsoft Teams Icon" />,
        label: 'Microsoft Teams',
        shortcut: true,
        onDoubleClick: openTeams,
      },
    ],
    [launchApp, openTeams]
  );

  const gridBounds = useMemo(
    () => getGridBounds(desktopAreaSize.width, desktopAreaSize.height),
    [desktopAreaSize.height, desktopAreaSize.width]
  );
  const hasDesktopMetrics = desktopAreaSize.width > 0 && desktopAreaSize.height > 0;

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleIconMouseDown = (
    iconId: string,
    fallbackPosition: IconGridPosition,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();

    const desktopArea = desktopAreaRef.current;
    const iconElement = event.currentTarget;

    if (!desktopArea || !iconElement) {
      return;
    }

    const currentPosition = iconPositions[iconId] ?? fallbackPosition;
    const iconRect = iconElement.getBoundingClientRect();

    setContextMenu((prev) => ({ ...prev, visible: false }));
    setDragState({
      iconId,
      origin: currentPosition,
      startClientX: event.clientX,
      startClientY: event.clientY,
      offsetX: event.clientX - iconRect.left,
      offsetY: event.clientY - iconRect.top,
      x: currentPosition.col * ICON_GRID_CELL_WIDTH,
      y: currentPosition.row * ICON_GRID_CELL_HEIGHT,
      isDragging: false,
    });
  };

  // Ferme le menu contextuel si on clique n’importe où
  useEffect(() => {
    const handleClickOutsideContextMenu = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutsideContextMenu);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideContextMenu);
    };
  }, []);

  useEffect(() => {
    const desktopArea = desktopAreaRef.current;
    if (!desktopArea) {
      return;
    }

    const updateDesktopAreaSize = () => {
      const nextSize = {
        width: desktopArea.clientWidth,
        height: desktopArea.clientHeight,
      };

      setDesktopAreaSize((currentSize) => {
        if (
          currentSize.width === nextSize.width &&
          currentSize.height === nextSize.height
        ) {
          return currentSize;
        }
        return nextSize;
      });
    };

    updateDesktopAreaSize();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(updateDesktopAreaSize)
        : null;

    if (resizeObserver) {
      resizeObserver.observe(desktopArea);
    }

    window.addEventListener('resize', updateDesktopAreaSize);
    return () => {
      window.removeEventListener('resize', updateDesktopAreaSize);
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!hasDesktopMetrics) {
      return;
    }

    setIconPositions((currentPositions) => {
      const sourcePositions = hasLoadedStoredPositionsRef.current
        ? currentPositions
        : readStoredIconPositions();
      const nextPositions = normalizeIconPositions(
        desktopIcons,
        sourcePositions,
        gridBounds
      );

      hasLoadedStoredPositionsRef.current = true;
      return areIconPositionsEqual(desktopIcons, currentPositions, nextPositions)
        ? currentPositions
        : nextPositions;
    });
    setHasInitializedIconPositions(true);
  }, [desktopIcons, gridBounds, hasDesktopMetrics]);

  useEffect(() => {
    if (!hasInitializedIconPositions) {
      return;
    }

    writeStoredIconPositions(iconPositions);
  }, [hasInitializedIconPositions, iconPositions]);

  // Seul l'identifiant de l'icône déplacée importe pour (ré)attacher les
  // listeners : dépendre de `dragState` entier ré-exécuterait l'effet à chaque
  // mousemove (x/y changent en continu), alors que les handlers lisent déjà
  // l'état courant via les setters fonctionnels.
  const draggedIconId = dragState?.iconId;

  useEffect(() => {
    if (!draggedIconId) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const desktopArea = desktopAreaRef.current;
      if (!desktopArea) {
        return;
      }

      const desktopRect = desktopArea.getBoundingClientRect();
      const maxX = Math.max(0, desktopArea.clientWidth - ICON_GRID_CELL_WIDTH);
      const maxY = Math.max(0, desktopArea.clientHeight - ICON_GRID_CELL_HEIGHT);

      setDragState((currentState) => {
        if (!currentState) {
          return currentState;
        }

        const nextX = clamp(
          event.clientX - desktopRect.left - currentState.offsetX,
          0,
          maxX
        );
        const nextY = clamp(
          event.clientY - desktopRect.top - currentState.offsetY,
          0,
          maxY
        );
        const hasCrossedDragThreshold =
          Math.hypot(
            event.clientX - currentState.startClientX,
            event.clientY - currentState.startClientY
          ) >= ICON_DRAG_THRESHOLD;
        const isDragging = currentState.isDragging || hasCrossedDragThreshold;

        if (
          currentState.x === nextX &&
          currentState.y === nextY &&
          currentState.isDragging === isDragging
        ) {
          return currentState;
        }

        return {
          ...currentState,
          x: nextX,
          y: nextY,
          isDragging,
        };
      });
    };

    const handleMouseUp = () => {
      setDragState((currentState) => {
        if (!currentState) {
          return null;
        }

        if (currentState.isDragging) {
          const targetCol = clamp(
            Math.round(currentState.x / ICON_GRID_CELL_WIDTH),
            0,
            gridBounds.cols - 1
          );
          const targetRow = clamp(
            Math.round(currentState.y / ICON_GRID_CELL_HEIGHT),
            0,
            gridBounds.rows - 1
          );

          setIconPositions((currentPositions) => {
            const nextPositions = { ...currentPositions };
            const sourcePosition =
              currentPositions[currentState.iconId] ?? currentState.origin;

            const iconToSwap = desktopIcons.find((desktopIcon) => {
              if (desktopIcon.id === currentState.iconId) {
                return false;
              }

              const iconPosition = currentPositions[desktopIcon.id];
              return (
                !!iconPosition &&
                iconPosition.col === targetCol &&
                iconPosition.row === targetRow
              );
            });

            if (iconToSwap) {
              nextPositions[iconToSwap.id] = sourcePosition;
            }

            nextPositions[currentState.iconId] = {
              col: targetCol,
              row: targetRow,
            };

            return normalizeIconPositions(desktopIcons, nextPositions, gridBounds);
          });
        }

        return null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [desktopIcons, draggedIconId, gridBounds]);

  useEffect(() => {
    if (!dragState?.isDragging) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.userSelect = previousUserSelect;
    };
  }, [dragState?.isDragging]);

  return (
    <div
      className={`${styles.desktop} ${isLaunchingApp ? styles.launching : ''}`}
      style={{
        backgroundImage: `url(${XPWallpaper})`,
        // Hauteur de la barre des tâches, pour les feuilles SCSS du bureau
        // (barre des tâches, menu Démarrer).
        [TASKBAR_HEIGHT_CSS_VAR]: `${TASKBAR_HEIGHT}px`,
      } as CSSProperties}
    >
      {/* Bureau : icônes (toute la hauteur, moins la barre des tâches) */}
      <div
        ref={desktopAreaRef}
        onContextMenu={handleContextMenu}
        style={{ height: `calc(100vh - ${TASKBAR_HEIGHT}px)`, position: 'relative' }}
      >
        {desktopIcons.map((desktopIcon, index) => {
          const fallbackPosition: IconGridPosition = {
            col: Math.floor(index / gridBounds.rows),
            row: index % gridBounds.rows,
          };
          const iconPosition = iconPositions[desktopIcon.id] ?? fallbackPosition;
          const isDraggingIcon =
            dragState?.iconId === desktopIcon.id && dragState.isDragging;
          const x = isDraggingIcon
            ? dragState.x
            : iconPosition.col * ICON_GRID_CELL_WIDTH;
          const y = isDraggingIcon
            ? dragState.y
            : iconPosition.row * ICON_GRID_CELL_HEIGHT;
          const iconStyle: CSSProperties = {
            position: 'absolute',
            left: x,
            top: y,
            zIndex: isDraggingIcon ? 20 : 1,
            cursor: isDraggingIcon ? 'grabbing' : 'default',
          };

          return (
            <DesktopIcon
              key={desktopIcon.id}
              icon={desktopIcon.icon}
              label={desktopIcon.label}
              shortcut={desktopIcon.shortcut}
              onDoubleClick={desktopIcon.onDoubleClick}
              onMouseDown={(event) =>
                handleIconMouseDown(desktopIcon.id, fallbackPosition, event)
              }
              style={iconStyle}
              isDragging={isDraggingIcon}
            />
          );
        })}
      </div>

      {/* Fenêtres (non minimisées) */}
      {selectDesktopWindows(windows).map((window) => (
        <Window key={window.id} id={window.id}>
          {window.content}
        </Window>
      ))}

      {/* Barre des tâches */}
      <Taskbar />

      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'absolute',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 10000,
          }}
        >
          <DesktopContextMenu />
        </div>
      )}

      {isShutdownOverlayVisible && <WindowsShutdownOverlay />}
    </div>
  );
};
