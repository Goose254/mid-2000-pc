import React, { useEffect, useRef, useState } from 'react';
import styles from './styles.module.scss';

import TaskManager0Icon from '@/assets/windows-icons/taskmgr.exe_14_127.png'
import TaskManager9Icon from '@/assets/windows-icons/taskmgr.exe_14_128.png'
import TaskManager18Icon from '@/assets/windows-icons/taskmgr.exe_14_129.png'
import TaskManager27Icon from '@/assets/windows-icons/taskmgr.exe_14_130.png'
import TaskManager36Icon from '@/assets/windows-icons/taskmgr.exe_14_131.png'
import TaskManager45Icon from '@/assets/windows-icons/taskmgr.exe_14_132.png'
import TaskManager54Icon from '@/assets/windows-icons/taskmgr.exe_14_133.png'
import TaskManager63Icon from '@/assets/windows-icons/taskmgr.exe_14_134.png'
import TaskManager72Icon from '@/assets/windows-icons/taskmgr.exe_14_135.png'
import TaskManager81Icon from '@/assets/windows-icons/taskmgr.exe_14_136.png'
import TaskManager90Icon from '@/assets/windows-icons/taskmgr.exe_14_137.png'
import TaskManager100Icon from '@/assets/windows-icons/taskmgr.exe_14_138.png'
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { useWindowsStore } from '@/common/stores/windowsStore';

interface TaskManagerTaskbarIconProps {
  windowId: string
}

export const TaskManagerTaskbarIcon: React.FC<TaskManagerTaskbarIconProps> = ({ windowId }) => {
  const [icon, setIcon] = useState<string>(TaskManager0Icon);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const icons = [
    TaskManager0Icon,
    TaskManager9Icon,
    TaskManager18Icon,
    TaskManager27Icon,
    TaskManager36Icon,
    TaskManager45Icon,
    TaskManager54Icon,
    TaskManager63Icon,
    TaskManager72Icon,
    TaskManager81Icon,
    TaskManager90Icon,
    TaskManager100Icon,
  ];
  
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    if (event.target !== event.currentTarget) {
      return;
    }
    setContextMenu({
      visible: true,
      x: window.innerWidth - event.clientX,
      y: window.innerHeight - event.clientY,
    });
  };

  const getRandomIcon = (): string => {
    const randomIndex = Math.floor(Math.random() * icons.length);
    return icons[randomIndex];
  };

  useEffect(() => {
    const updateIcon = setInterval(() => {
      setIcon(getRandomIcon());
    }, 2000);

    const handleClickOutsideContextMenu = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutsideContextMenu);

    return () => {
      clearInterval(updateIcon);
      document.removeEventListener("mousedown", handleClickOutsideContextMenu);
    }
  }, []);

  return (
    <>
      <img src={icon} onContextMenu={handleContextMenu} onDoubleClick={() => useWindowsStore.getState().bringToFront(windowId)} />
      {contextMenu.visible && (
        <div ref={contextMenuRef}>
          <FloatingMenu
            style={{ position: 'absolute', bottom: contextMenu.y, right: contextMenu.x, zIndex: 10000 }}
          >
            <MenuItem label="Fermer" onClick={() => useWindowsStore.getState().closeWindow(windowId)} />
            <MenuSeparator />
            <MenuItem label="Toujours visible"/>
          </FloatingMenu>
        </div>
      )}
    </>
  );
};
