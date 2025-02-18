import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from '../../molecules/TitleBar/TitleBar';
import styles from './Window.module.scss';
import { useWindowsStore } from '@/common/stores/windowsStore';

export interface TitleBarButtonOptions {
  visible: boolean;
  enabled: boolean;
  action?: (e?: MouseEvent) => void;
}

/**
 * Options de configuration pour une fenêtre
 */
export interface WindowOptions {
  /**
   * Titre de la fenêtre
   */
  title?: string;
  /**
   * Icône à afficher dans la barre de titre
   */
  icon?: React.ReactElement;
  /**
   * Position initiale de la fenêtre (x,y)
   */
  initialPosition?: { x: number; y: number };
  /**
   * Taille initiale de la fenêtre (width,height)
   */
  initialSize?: { width: number; height: number };
  /**
   * Fenêtre à taille fixe ?
   * - Désactive le redimensionnement et la maximisation.
   */
  fixedSize?: boolean;

  /**
   * Option des boutons
   */
  buttons?: {
    help?: TitleBarButtonOptions;
    minimize?: TitleBarButtonOptions;
    maximize?: TitleBarButtonOptions;
    close?: TitleBarButtonOptions;
  };
}

interface WindowProps {
  id: string;
  zPosition: number;
  children: React.ReactNode;
  /**
   * Indique si la fenêtre est actuellement active (au premier plan)
   */
  isActive: boolean;

  /**
   * Callbacks de cycle de vie
   */
  onActive: () => void;
  onInactive: () => void;

  /**
   * Objet contenant les options de la fenêtre
   */
  options?: WindowOptions;
}

type ResizePole = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'none';

export const Window: React.FC<WindowProps> = ({
  id,
  zPosition,
  children,
  isActive,
  onActive,
  onInactive,
  options = {}, // options fournies par l'appelant
}) => {
// Valeurs par défaut pour éviter de multiplier les attributs dans l'appel du composant
  const defaultOptions: Required<Pick<
    WindowOptions,
    | 'title'
    | 'fixedSize'
    | 'initialPosition'
    | 'initialSize'
  >> & {
    buttons: {
      help: TitleBarButtonOptions;
      minimize: TitleBarButtonOptions;
      maximize: TitleBarButtonOptions;
      close: TitleBarButtonOptions;
    }
  } = {
    title: 'Untitled',
    fixedSize: false,
    buttons: {
      help: {
        visible: false,
        enabled: false,
      },
      minimize: {
        visible: true,
        enabled: true,
        action: () => {
          useWindowsStore.getState().toggleMinimizeWindow(id);
        },
      },
      maximize: {
        visible: true,
        enabled: true,
        action: () => {
          // Empêche la maximisation si la fenêtre est de taille fixe
          if (fixedSize) return;
      
          if (!isMaximized) {
            setBeforeMaximized({ position, size });
            setPosition({ x: 0, y: 0 });
            setSize({
              width: window.innerWidth,
              height: window.innerHeight - 30, // 30px pour la taskbar (exemple)
            });
            setIsMaximized(true);
          } else {
            setPosition(beforeMaximized.position);
            setSize(beforeMaximized.size);
            setIsMaximized(false);
          }
        },
      },
      close: {
        visible: true,
        enabled: true,
        action: () => {
          useWindowsStore.getState().closeWindow(id);
        },
      },
    },
    initialPosition: { x: 100, y: 100 },
    initialSize: { width: 600, height: 400 },
  };

  // On fusionne les valeurs fournies avec les valeurs par défaut
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    buttons: {
      help: {
        visible: options.buttons?.help?.visible ?? defaultOptions.buttons.help.visible,
        enabled: options.buttons?.help?.enabled ?? defaultOptions.buttons.help.enabled,
        action: options.buttons?.help?.action ?? defaultOptions.buttons.help.action,
      },
      minimize: {
        visible: options.buttons?.minimize?.visible ?? defaultOptions.buttons.minimize.visible,
        enabled: options.buttons?.minimize?.enabled ?? defaultOptions.buttons.minimize.enabled,
        action: options.buttons?.minimize?.action ?? defaultOptions.buttons.minimize.action,
      },
      maximize: {
        visible: options.buttons?.maximize?.visible ?? defaultOptions.buttons.maximize.visible,
        enabled: options.buttons?.maximize?.enabled ?? defaultOptions.buttons.maximize.enabled,
        action: options.buttons?.maximize?.action ?? defaultOptions.buttons.maximize.action,
      },
      close: {
        visible: options.buttons?.close?.visible ?? defaultOptions.buttons.close.visible,
        enabled: options.buttons?.close?.enabled ?? defaultOptions.buttons.close.enabled,
        action: options.buttons?.close?.action ?? defaultOptions.buttons.close.action,
      },
    },
    // Pour être sûr que l'utilisateur ne casse pas la structure
    initialPosition: {
      ...defaultOptions.initialPosition,
      ...options.initialPosition,
    },
    initialSize: {
      ...defaultOptions.initialSize,
      ...options.initialSize,
    },
  };

  const {
    title,
    icon,
    initialPosition,
    initialSize,
    fixedSize,
    buttons,
  } = mergedOptions;

  // État local pour la position et la taille
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);

  // État pour le déplacement / redimensionnement
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizePole>('none');

  // État pour la maximisation
  const [isMaximized, setIsMaximized] = useState(false);
  const [beforeMaximized, setBeforeMaximized] = useState({
    position: initialPosition,
    size: initialSize,
  });

  const setWindowPosition = useWindowsStore((state) => state.setWindowPosition);
  const setWindowSize = useWindowsStore((state) => state.setWindowSize);

  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const setWindowActive = () => {
    onActive();
  };

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
      setPosition({
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

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newXPosition, y: newYPosition });
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
    } else {
      setWindowPosition(id, position);
      setWindowSize(id, size);
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
        onInactive();
      }
    };
    document.addEventListener('mousedown', handleClickOutsideWindow);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideWindow);
    };
  }, [windowRef]);

  // Style inline pour positionner la fenêtre
  const style = {
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex: zPosition,
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
