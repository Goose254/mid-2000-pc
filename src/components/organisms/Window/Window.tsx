import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    isMinimized,
    animationState,
    taskbarButtonRect,
    preMaximizePosition,
    preMaximizeSize,
  } = useWindowsStore((state) => state.windows.find((w) => id === w.id) || {} as WindowInfo)

  // État pour le déplacement / redimensionnement
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizePole>('none');

  const setWindowPosition = useWindowsStore((state) => state.setWindowPosition);
  const setWindowSize = useWindowsStore((state) => state.setWindowSize);

  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0 });
  // Géométrie de la fenêtre au moment où le redimensionnement démarre :
  // le calcul se fait en delta absolu depuis le début du geste, il doit donc
  // toujours partir de la taille/position initiales et non des valeurs courantes.
  const resizeStartGeometry = useRef({ x: 0, y: 0, width: 0, height: 0 });
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
    resizeStartGeometry.current = {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    };
  };

  // Suivi des mouvements souris quand on est en train de bouger/redimensionner.
  // Le redimensionnement est calculé à partir de la géométrie capturée au début
  // du geste (resizeStartGeometry) : le handler reste ainsi stable pendant tout
  // le drag/resize et peut être une vraie dépendance du useEffect ci-dessous.
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setWindowPosition(id, {
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }

    if (isResizing !== 'none') {
      const startGeometry = resizeStartGeometry.current;
      let newWidth = startGeometry.width;
      let newHeight = startGeometry.height;
      let newXPosition = startGeometry.x;
      let newYPosition = startGeometry.y;

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
          newXPosition = startGeometry.x + (e.clientX - resizeStart.current.x);
          newHeight += e.clientY - resizeStart.current.y;
          break;
        case 'w':
          newWidth -= e.clientX - resizeStart.current.x;
          newXPosition = startGeometry.x + (e.clientX - resizeStart.current.x);
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
  }, [id, isDragging, isResizing, setWindowPosition, setWindowSize]);

  // Libération du clic souris (fin déplacement/redimensionnement)
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing('none');
  }, []);

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
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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
  }, [id]);

  // Update taskbar button position for animations
  useEffect(() => {
    // Find the taskbar button by looking for elements with both data-window-id and data-taskbar-button
    const taskbarButton = document.querySelector(`[data-window-id="${id}"][data-taskbar-button="true"]`);

    if (taskbarButton) {
      const rect = taskbarButton.getBoundingClientRect();
      useWindowsStore.getState().updateWindow(id, { taskbarButtonRect: rect });
    }
  }, [id, isMinimized, animationState]); // Re-run when animation state changes

  // State to track if we need to start restore from taskbar position
  const [startRestoreFromTaskbar, setStartRestoreFromTaskbar] = useState(false);

  // Effect to handle animation start from taskbar button for restore
  useEffect(() => {
    if (animationState === 'restoring' && taskbarButtonRect) {
      // Set flag to start from taskbar position
      setStartRestoreFromTaskbar(true);

      // Use requestAnimationFrame to ensure React has time to render the initial state
      requestAnimationFrame(() => {
        setStartRestoreFromTaskbar(false);
      });
    }
  }, [animationState, taskbarButtonRect]);

  // Handle transitionend events to complete animations
  useEffect(() => {
    const windowElement = windowRef.current;
    if (!windowElement || !animationState || animationState === 'none') return;

    let transitionCompleted = false;

    const handleTransitionEnd = (e: TransitionEvent) => {
      // Only handle transitions on the window element itself, not children
      if (e.target !== windowElement) return;

      // Only handle opacity, width, height, top, or left transitions
      if (!['opacity', 'width', 'height', 'top', 'left'].includes(e.propertyName)) return;

      // Prevent multiple calls (transitionend fires for each CSS property)
      if (transitionCompleted) return;
      transitionCompleted = true;

      const store = useWindowsStore.getState();

      switch (animationState) {
        case 'minimizing':
          store.completeMinimizeAnimation(id);
          break;
        case 'restoring':
          store.completeRestoreAnimation(id);
          break;
        case 'maximizing':
          store.completeMaximizeAnimation(id);
          break;
        case 'unmaximizing':
          store.completeUnmaximizeAnimation(id);
          break;
      }
    };

    windowElement.addEventListener('transitionend', handleTransitionEnd);

    return () => {
      windowElement.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [id, animationState]);

  // Calculate position and size for animations
  const getAnimatedPositionAndSize = () => {
    let animatedPosition = { ...position };
    let animatedSize = { ...size };
    let animatedOpacity = 1;

    // For maximized windows when not animating, use full screen dimensions
    if (isMaximized && animationState === 'none') {
      animatedPosition = { x: 0, y: 0 };
      animatedSize = {
        width: window.innerWidth,
        height: window.innerHeight - 30,
      };
    }

    if (animationState === 'minimizing' && taskbarButtonRect) {
      // Animate to taskbar button position
      animatedPosition = {
        x: taskbarButtonRect.left,
        y: taskbarButtonRect.top,
      };
      animatedSize = {
        width: taskbarButtonRect.width,
        height: taskbarButtonRect.height,
      };
      animatedOpacity = 0;
    } else if (animationState === 'restoring') {
      // If we need to start from taskbar, use taskbar position
      if (startRestoreFromTaskbar && taskbarButtonRect) {
        animatedPosition = {
          x: taskbarButtonRect.left,
          y: taskbarButtonRect.top,
        };
        animatedSize = {
          width: taskbarButtonRect.width,
          height: taskbarButtonRect.height,
        };
        animatedOpacity = 0;
      } else {
        // Otherwise animate to normal position
        animatedOpacity = 1;
      }
    } else if (animationState === 'maximizing') {
      // Will animate to maximized state
      animatedPosition = { x: 0, y: 0 };
      animatedSize = {
        width: window.innerWidth,
        height: window.innerHeight - 30,
      };
    } else if (animationState === 'unmaximizing' && preMaximizePosition && preMaximizeSize) {
      // Will animate to previous position and size
      animatedPosition = preMaximizePosition;
      animatedSize = preMaximizeSize;
    }

    return { animatedPosition, animatedSize, animatedOpacity };
  };

  // Get animation class based on state
  const getAnimationClass = () => {
    if (!animationState || animationState === 'none') return '';

    switch (animationState) {
      case 'minimizing':
        return styles['animating-minimize'];
      case 'restoring':
        return styles['animating-restore'];
      case 'maximizing':
        return styles['animating-maximize'];
      case 'unmaximizing':
        return styles['animating-unmaximize'];
      default:
        return '';
    }
  };

  // Calculate animated position and size
  const { animatedPosition, animatedSize, animatedOpacity } = getAnimatedPositionAndSize();

  // Style inline pour positionner la fenêtre
  const style = {
    top: `${animatedPosition.y}px`,
    left: `${animatedPosition.x}px`,
    width: `${animatedSize.width}px`,
    height: `${animatedSize.height}px`,
    zIndex: zIndex,
    opacity: animatedOpacity,
    // Hide completely if minimized and not animating (instead of return null)
    display: (isMinimized && animationState !== 'restoring' && animationState !== 'minimizing') ? 'none' : 'flex',
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
        ${getAnimationClass()}
        ${(isDragging || isResizing !== 'none' || startRestoreFromTaskbar) ? styles['no-transition'] : ''}
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
