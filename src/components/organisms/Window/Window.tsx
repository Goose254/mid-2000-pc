import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from '../../molecules/TitleBar/TitleBar';
import styles from './Window.module.scss';

interface WindowProps {
  id: string;
  title: string;
  icon?: React.ReactElement;
  children: React.ReactNode;
  zPosition: number;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  isActive: boolean;
  onClose: () => void;
  onActive: () => void;
  onInactive: () => void;
  onMinimize: () => void;
}

type ResizePole = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw' | 'none';

export const Window: React.FC<WindowProps> = ({
  id,
  title,
  icon,
  children,
  zPosition,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  isActive,
  onClose,
  onActive,
  onInactive,
  onMinimize
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizePole>('none');
  const [isMaximized, setIsMaximized] = useState(false);
  const [beforeMaximized, setBeforeMaximized] = useState({ position, size });
  
  const dragStart = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const setWindowActive = () => {
    onActive();
  };

  const handleDragging = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleResizing = (e: React.MouseEvent, pole: ResizePole) => {
    e.stopPropagation();
    setWindowActive();

    if (isMaximized) return;

    setIsResizing(pole);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }

    let newWidth = size.width;
    let newHeight = size.height;
    let newXPosition = position.x;
    let newYPosition = position.y;

    switch (isResizing) {
      case 'none':
        break;
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
    if (isResizing !== 'none') {
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newXPosition, y: newYPosition });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing('none');
  };

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

  const handleMaximize = () => {
    if (!isMaximized) {
      setBeforeMaximized({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 30 }); // 30px pour la taskbar
      setIsMaximized(true);
    } else {
      setPosition(beforeMaximized.position);
      setSize(beforeMaximized.size);
      setIsMaximized(false);
    }
  };

  const handleMinimize = () => {
    onMinimize();
  };

  const style = {
    top: `${position.y}px`,
    left: `${position.x}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    zIndex: zPosition,
  };

  return (
    <div
      ref={windowRef}
      className={`${styles.window} ${isMaximized ? styles.maximized : ''} ${!isActive ? styles.inactive + " inactive" : ''}`}
      style={style}
      onMouseDown={() => setWindowActive()}
    >
      {!isMaximized && (
        <>
          <div className={styles["window-top-resize"]} onMouseDown={(e) => handleResizing(e, 'n')} />
          <div className={`${styles["window-corner-resize"]} ${styles.nw}`} onMouseDown={(e) => handleResizing(e, 'nw')} />
          <div className={`${styles["window-corner-resize"]} ${styles.ne}`} onMouseDown={(e) => handleResizing(e, 'ne')} />
        </>
      )}
      <div onMouseDown={handleDragging}>
        <TitleBar
          title={title}
          icon={icon}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onClose={onClose || (() => {})}
          isMaximized={isMaximized}
          isActive={isActive}
        />
      </div>
      <div className={styles["window-content-wrapper"]}>
        {!isMaximized && (
          <div className={styles["window-left-border"]} onMouseDown={(e) => handleResizing(e, 'w')}></div>
        )}
        <div className={styles["window-content"]}>
          {children}
        </div>
        {!isMaximized && (
          <div className={styles["window-right-border"]} onMouseDown={(e) => handleResizing(e, 'e')}></div>
        )}
      </div>
      {!isMaximized && (
        <>
          <div className={styles["window-bottom-border"]} onMouseDown={(e) => handleResizing(e, 's')}></div>
          <div className={`${styles["window-corner-resize"]} ${styles.sw}`} onMouseDown={(e) => handleResizing(e, 'sw')} />
          <div className={`${styles["window-corner-resize"]} ${styles.se}`} onMouseDown={(e) => handleResizing(e, 'se')} />
        </>
      )}
    </div>
  );
};
