import React, { useEffect, useRef, useState } from 'react';
import styles from './TaskbarButton.module.scss';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '../MenuItem/MenuItem';
import { MenuSeparator } from '../MenuSeparator/MenuSeparator';
import { WindowInfo } from '@/common/types/window';
import { WindowControlIcon } from '../WindowControlIcon/WindowControlIcon';
import { useTranslation } from 'react-i18next';

interface TaskbarButtonProps {
  linkedWindow: WindowInfo;
}

export const TaskbarButton: React.FC<TaskbarButtonProps> = ({ linkedWindow }) => {
  const { t } = useTranslation('common', { keyPrefix: 'appContextMenu' })
  const toggleMinimizeWindow = useWindowsStore((state) => state.toggleMinimizeWindow);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (linkedWindow.isMinimized) event.stopPropagation();
    if (!linkedWindow.isMinimized && !linkedWindow.isActive) toggleMinimizeWindow(linkedWindow.id);
    event.preventDefault();

    if (event.target !== event.currentTarget) {
      return;
    }

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: window.innerHeight - event.clientY,
    });
  };
  
  useEffect(() => {
    const handleClickOutsideContextMenu = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutsideContextMenu);

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideContextMenu);
    }
  }, []);

  return (
    <>
    <div
      onContextMenu={handleContextMenu}
      onClick={() => toggleMinimizeWindow(linkedWindow.id)}
      className={`${styles.taskbarButton} ${linkedWindow.isActive || contextMenu.visible ? styles.active : ""}`}
      data-window-id={linkedWindow.id}
      data-taskbar-button="true"
    >
      <div className={styles.taskbarButtonContent}>
        {linkedWindow.icon && <div className={styles.taskbarButtonIcon}>{linkedWindow.icon}</div>}
        <div className={styles.taskbarButtonContentLabel}>{linkedWindow.title}</div>
      </div>
    </div>
    {contextMenu.visible && (
      <div ref={contextMenuRef}>
        <FloatingMenu
          style={{ position: 'absolute', bottom: contextMenu.y, left: contextMenu.x, zIndex: 10000 }}
        >
          <MenuItem
            label={t('restore')}
            aria-disabled={!linkedWindow.isMinimized && !linkedWindow.isMaximized}
            onClick={() => {
              if (linkedWindow.isMinimized) useWindowsStore.getState().toggleMinimizeWindow(linkedWindow.id)
              if (!linkedWindow.isMinimized && linkedWindow.isMaximized) useWindowsStore.getState().toggleMaximizeWindow(linkedWindow.id)
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            iconElement={<WindowControlIcon type="restore" />}
          />
          <MenuItem
            label={t('move')}
            aria-disabled={linkedWindow.fixedSize || linkedWindow.isMinimized || linkedWindow.isMaximized}
          />
          <MenuItem
            label={t('size')}
            aria-disabled={linkedWindow.fixedSize || linkedWindow.isMinimized || linkedWindow.isMaximized}
          />
          <MenuItem
            label={t('minimize')}
            aria-disabled={linkedWindow.isMinimized}
            onClick={() => {
              useWindowsStore.getState().toggleMinimizeWindow(linkedWindow.id, true)
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            iconElement={<WindowControlIcon type="minimize" />}
          />
          <MenuItem
            label={t('maximize')}
            aria-disabled={linkedWindow.fixedSize || linkedWindow.isMaximized}
            onClick={() => {
              useWindowsStore.getState().toggleMaximizeWindow(linkedWindow.id)
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            iconElement={<WindowControlIcon type="maximize" />}
          />
          <MenuSeparator />
          <MenuItem
            label={t('close')}
            info="Alt+F4"
            onClick={() => {
              useWindowsStore.getState().closeWindow(linkedWindow.id)
              setContextMenu((prev) => ({ ...prev, visible: false }));
            }}
            iconElement={<WindowControlIcon type="close" />}
          />
        </FloatingMenu>
      </div>
    )}
    </>
  );
};
