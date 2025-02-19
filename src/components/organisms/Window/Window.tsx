import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from '../../molecules/TitleBar/TitleBar';
import styles from './Window.module.scss';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { WindowInfo } from '@/common/types/window';

export interface TitleBarButtonOptions {
  visible: boolean;
  enabled: boolean;
  action?: (e?: MouseEvent) => void;
}

interface WindowProps {
  id: string;
  children: React.ReactNode;
}

type ResizePole = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'none';

export const Window: React.FC<WindowProps> = ({
  id,
  children,
}) => {
  // État local pour la position et la taille
  const {
    title,
    icon,
    zIndex,
    fixedSize,
    size,
    position,
    buttons,
    isActive,
    isMaximized,
  } = useWindowsStore((state) => state.windows.find((w) => id === w.id) || {} as WindowInfo)

  // État pour le déplacement / redimensionnement
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizePole>('none');

  const setWindowPosition = useWindowsStore((state) => state.setWindowPosition);
  const setWindowSize = useWindowsStore((state) => state.setWindowSize);

  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const setWindowActive = () => {
    useWindowsStore.getState().bringToFront(id);
  };

  if (
    buttons?.maximize?.visible &&
    buttons?.maximize?.enabled &&
    !buttons?.maximize?.action
  ) {
    buttons.maximize.action = () => {
      // Empêche la maximisation si la fenêtre est de taille fixe
      if (fixedSize) return;

      useWindowsStore.getState().toggleMaximizeWindow(id);
    }
  }

  if (
    buttons?.minimize?.visible &&
    buttons?.minimize?.enabled &&
    !buttons?.minimize?.action
  ) {
    buttons.minimize.action = () => {
      useWindowsStore.getState().toggleMinimizeWindow(id);
    }
  }

  if (
    buttons?.close?.visible &&
    buttons?.close?.enabled &&
    !buttons?.close?.action
  ) {
    buttons.close.action = () => {
      useWindowsStore.getState().closeWindow(id);
    }
  }

  // Gestion du déplacement
  const handleDragging = (e: React.MouseEvent) => {
    // Si la fenêtre est maximisée ou fixe, on ne bouge pas
    if (isMaximized) return;

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  // Gestion du redimensionnement
  const handleResizing = (e: React.MouseEvent, pole: ResizePole) => {
    // Empêche le redimensionnement si la fenêtre est fixe ou déjà maximisée
    if (fixedSize || isMaximized) return;

    e.stopPropagation();
    setWindowActive();
    setIsResizing(pole);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  // Suivi des mouvements souris quand on est en train de bouger/redimensionner
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setWindowPosition(id, {
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }

    if (isResizing !== 'none') {
      let newWidth = size.width;
      let newHeight = size.height;
      let newXPosition = position.x;
      let newYPosition = position.y;

      switch (isResizing) {
        case 'n':
          newHeight -= e.clientY - resizeStart.current.y;
          newYPosition += e.clientY - resizeStart.current.y;
          break;
        case 'ne':
          newWidth += e.clientX - resizeStart.current.x;
          newHeight -= e.clientY - resizeStart.current.y;
          newYPosition += e.clientY - resizeStart.current.y;
          break;
        case 'e':
          newWidth += e.clientX - resizeStart.current.x;
          break;
        case 'se':
          newWidth += e.clientX - resizeStart.current.x;
          newHeight += e.clientY - resizeStart.current.y;
          break;
        case 's':
          newHeight += e.clientY - resizeStart.current.y;
          break;
        case 'sw':
          newWidth -= e.clientX - resizeStart.current.x;
          newXPosition = position.x + (e.clientX - resizeStart.current.x);
          newHeight += e.clientY - resizeStart.current.y;
          break;
        case 'w':
          newWidth -= e.clientX - resizeStart.current.x;
          newXPosition = position.x + (e.clientX - resizeStart.current.x);
          break;
        case 'nw':
          newWidth -= e.clientX - resizeStart.current.x;
          newXPosition += e.clientX - resizeStart.current.x;
          newHeight -= e.clientY - resizeStart.current.y;
          newYPosition += e.clientY - resizeStart.current.y;
          break;
        default:
          break;
      }

      setWindowSize(id, { width: newWidth, height: newHeight });
      setWindowPosition(id, { x: newXPosition, y: newYPosition });
    }
  };

  // Libération du clic souris (fin déplacement/redimensionnement)
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing('none');
  };

  // Attache/détache les events globaux pour suivre le déplacement/redimensionnement
  useEffect(() => {
    if (isDragging || isResizing !== 'none') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  // Gestion du clic en dehors de la fenêtre pour la rendre inactive
  useEffect(() => {
    const handleClickOutsideWindow = (e: MouseEvent) => {
      const targetWindowId = (e.target as HTMLDivElement)?.getAttribute("data-window-id") || null;
      if (
        windowRef.current &&
        !windowRef.current.contains(e.target as Node) &&
        targetWindowId !== id
      ) {
        useWindowsStore.getState().setWindowInactive(id);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideWindow);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideWindow);
    };
  }, [windowRef]);

  // Style inline pour positionner la fenêtre
  const style = {
    top: `${isMaximized ? 0 : position.y}px`,
    left: `${isMaximized ? 0 : position.x}px`,
    width: `${isMaximized ? window.innerWidth : size.width}px`,
    height: `${isMaximized ? window.innerHeight - 30 : size.height}px`,
    zIndex: zIndex,
  };

  // Affiche-t-on les poignées de redimensionnement ?
  const showResizeHandles = !fixedSize && !isMaximized;

  return (
    <div
      ref={windowRef}
      className={`
        ${styles.window}
        ${isMaximized ? styles.maximized : ''}
        ${!isActive ? styles.inactive + " inactive" : ''}
      `}
      style={style}
      onMouseDown={setWindowActive}
      data-window-id={id} // pour distinguer le clic "outside"
    >
      {showResizeHandles && (
        <>
          <div className={styles["window-top-resize"]} onMouseDown={(e) => handleResizing(e, 'n')} />
          <div className={`${styles["window-corner-resize"]} ${styles.nw}`} onMouseDown={(e) => handleResizing(e, 'nw')} />
          <div className={`${styles["window-corner-resize"]} ${styles.ne}`} onMouseDown={(e) => handleResizing(e, 'ne')} />
        </>
      )}

      {/* Barre de titre */}
      <div onMouseDown={handleDragging}>
        <TitleBar
          // On passe toutes les informations nécessaires via un objet `options`
          options={{
            title,
            icon,
            isMaximized,
            isActive,
            buttons,
          }}
        />
      </div>

      {/* Contenu principal */}
      <div className={styles["window-content-wrapper"]}>
        {!isMaximized && (
          <div
            className={`${styles["window-left-border"]} ${!showResizeHandles ? styles["no-resize-cursor"] : ""}`}
            onMouseDown={(e) => handleResizing(e, 'w')}
          ></div>
        )}

        <div className={styles["window-content"]}>
          {children}
        </div>

        {!isMaximized && (
          <div
            className={`${styles["window-right-border"]} ${!showResizeHandles ? styles["no-resize-cursor"] : ""}`}
            onMouseDown={(e) => handleResizing(e, 'e')}
          ></div>
        )}
      </div>

      {!isMaximized && (
        <div
          className={`${styles["window-bottom-border"]} ${!showResizeHandles ? styles["no-resize-cursor"] : ""}`}
          onMouseDown={(e) => handleResizing(e, 's')}
        />
      )}

      {showResizeHandles && (
        <>
          <div
            className={`${styles["window-corner-resize"]} ${styles.sw}`}
            onMouseDown={(e) => handleResizing(e, 'sw')}
          />
          <div
            className={`${styles["window-corner-resize"]} ${styles.se}`}
            onMouseDown={(e) => handleResizing(e, 'se')}
          />
        </>
      )}
    </div>
  );
};
