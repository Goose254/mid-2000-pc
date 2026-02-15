import React, { useEffect, useRef, useState } from 'react';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { useOverlaysStore } from '@/common/stores/overlaysStore';

import { WindowsShutdownOverlay } from '@/components/templates/WindowsShutdownOverlay/WindowsShutdownOverlay';
import { DesktopIcon } from '@/components/atoms/DesktopIcon/DesktopIcon';
import { Window } from '@/components/organisms/Window/Window';
import { Taskbar } from '@/components/organisms/Taskbar/Taskbar';

import XPWallpaper from '@/assets/xp-wallpaper.jpg';
import MyComputerIcon from '@/assets/windows-icons/explorer.exe_14_100-9.png';
import MyDocumentsIcon from '@/assets/windows-icons/shell32.dll_14_235-9.png';
import TashbinIcon from '@/assets/windows-icons/shell32.dll_14_254-7.png';
import TeamsIcon from '@/assets/program-icons/teams.exe.svg';

import { useAppsStore } from '@/common/stores/appsStore';
import { TaskManagerApp } from '@/apps/TaskManager/main';
import { ExplorerApp } from '@/apps/Explorer/main';
import { MinesweeperApp } from '@/apps/Minesweeper/main';
import { DesktopContextMenu } from './DesktopContextMenu';

export const Desktop: React.FC = () => {
  const windows = useWindowsStore((state) => state.windows);

  const isShutdownOverlayVisible = useOverlaysStore(
    (state) => state.isShutdownOverlayVisible
  );

  const startApp = useAppsStore((state) => state.startApp);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const openTeams = () => {
    window.open('https://teams-suggest.vercel.app', '_blank', 'noopener,noreferrer');
  };

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

  return (
    <div
      className="min-h-screen bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${XPWallpaper})`,
      }}
    >
      {/* Bureau : icônes */}
      <div onContextMenu={handleContextMenu} style={{ height: 'calc(100vh - 30px)' }}>
        <DesktopIcon
          icon={<img src={MyComputerIcon} alt="MyComputer Icon" />}
          label="Poste de travail"
          onDoubleClick={() => startApp(ExplorerApp)}
        />
        <DesktopIcon
          icon={<img src={MyDocumentsIcon} alt="MyDocuments Icon" />}
          label="Mes Documents"
          onDoubleClick={() => startApp(ExplorerApp)}
        />
        <DesktopIcon
          icon={<img src={TashbinIcon} alt="Trash bin Icon" />}
          label="Corbeille"
          onDoubleClick={() => {}}
        />
        <DesktopIcon
          icon={<img src={TaskManagerApp.icons.medium} alt="Taskmgr Icon" />}
          label="Gestionnaire des tâches"
          onDoubleClick={() => startApp(TaskManagerApp)}
        />
        <DesktopIcon
          icon={<img src={MinesweeperApp.icons.medium} alt="Minesweeper Icon" />}
          label="Démineur"
          onDoubleClick={() => startApp(MinesweeperApp)}
        />
        <DesktopIcon
          icon={<img src={TeamsIcon} alt="Microsoft Teams Icon" />}
          label="Microsoft Teams"
          shortcut
          onDoubleClick={openTeams}
        />
      </div>

      {/* Fenêtres (non minimisées) */}
      {windows
        .filter((w) => !w.isMinimized)
        .map((window) => (
          <Window key={window.id} id={window.id}>
            {window.content}
          </Window>
        ))}

      {/* Barre des tâches */}
      <Taskbar />

      {contextMenu.visible && (
        <div ref={contextMenuRef} style={{ position: 'absolute', top: contextMenu.y, left: contextMenu.x, zIndex: 10000 }}>
          <DesktopContextMenu />
        </div>
      )}

      {isShutdownOverlayVisible && <WindowsShutdownOverlay />}
    </div>
  );
};
