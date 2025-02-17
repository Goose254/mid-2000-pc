import React, { useEffect, useRef, useState } from 'react';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { useOverlaysStore } from '@/common/stores/overlaysStore';

import { WindowsShutdownOverlay } from '@/components/templates/WindowsShutdownOverlay/WindowsShutdownOverlay';
import { DesktopIcon } from '@/components/atoms/DesktopIcon/DesktopIcon';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { Window } from '@/components/organisms/Window/Window';
import { Taskbar } from '@/components/organisms/Taskbar/Taskbar';

import XPWallpaper from '@/assets/xp-wallpaper.jpg';
import MyComputerIcon from '@/assets/windows-icons/explorer.exe_14_100-9.png';
import MyDocumentsIcon from '@/assets/windows-icons/shell32.dll_14_235-9.png';
import TashbinIcon from '@/assets/windows-icons/shell32.dll_14_254-7.png';
import AboutIcon from '@/assets/windows-icons/hnetwiz.dll_14_10001-9.png';
import AboutSmallIcon from '@/assets/windows-icons/hnetwiz.dll_14_10001-11.png';

import { useAppsStore } from '@/common/stores/appsStore';
import { TaskManagerApp } from '@/apps/TaskManager/main';
import { ExplorerApp } from '@/apps/Explorer/main';
import { MinesweeperApp } from '@/apps/Minesweeper/main';

export const Desktop: React.FC = () => {
  // --- On récupère "chaque propriété" séparément pour éviter la recréation d'objets ---
  const windows = useWindowsStore((state) => state.windows);
  const openWindow = useWindowsStore((state) => state.openWindow);
  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const bringToFront = useWindowsStore((state) => state.bringToFront);
  const setWindowInactive = useWindowsStore((state) => state.setWindowInactive);
  const toggleMinimizeWindow = useWindowsStore((state) => state.toggleMinimizeWindow);

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

  const openAbout = () => {
    openWindow(
      'about',
      'about.exe',
      'À propos de cette expérience',
      <div>Cette expérience de simulation d'un ordinateur du milieu des années 2000 est basée sur ReactJS.</div>,
      <img src={AboutSmallIcon} alt="About" />,
      {
        fixedSize: true,
        showHelpButton: true,
        showMinimizeButton: false,
        showMaximizeButton: false,
      }
    );
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
          icon={<img src={AboutIcon} alt="About Icon" />}
          label="À propos"
          onDoubleClick={openAbout}
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
      </div>

      {/* Fenêtres (non minimisées) */}
      {windows
        .filter((w) => !w.isMinimized)
        .map((window) => (
          <Window
            key={window.id}
            id={window.id}
            zPosition={window.zIndex}
            isActive={window.isActive}
            onClose={() => closeWindow(window.id)}
            onActive={() => bringToFront(window.id)}
            onInactive={() => setWindowInactive(window.id)}
            onMinimize={() => toggleMinimizeWindow(window.id)}
            options={{
              title: window.title,
              icon: window.icon,
              initialPosition: window.position,
              initialSize: window.size,
              fixedSize: window.fixedSize,
              showHelpButton: window.showHelpButton,
              showMinimizeButton: window.showMinimizeButton,
              showMaximizeButton: window.showMaximizeButton,
              showCloseButton: window.showCloseButton,
              onHelp: () => console.log('help')
            }}
          >
            {window.content}
          </Window>
        ))}

      {/* Barre des tâches */}
      <Taskbar />

      {contextMenu.visible && (
        <div ref={contextMenuRef}>
          <FloatingMenu
            style={{ top: contextMenu.y, left: contextMenu.x, zIndex: 10000 }}
          >
            <MenuItem label="Réorganiser les icônes par">
              <FloatingMenu>
                <MenuItem label="Nom"/>
                <MenuItem label="Taille"/>
                <MenuItem label="Type"/>
                <MenuItem label="Modifié le"/>
                <MenuSeparator />
                <MenuItem label="Afficher par groupe" aria-disabled/>
                <MenuItem label="Réorganisation automatique"/>
                <MenuItem label="Aligner sur la grille"/>
                <MenuSeparator />
                <MenuItem label="Afficher les icônes du Bureau"/>
                <MenuItem label="Verrouiller les éléments Web sur le Bureau"/>
                <MenuItem label="Exécuter l'Assistant Nettoyage du Bureau"/>
              </FloatingMenu>
            </MenuItem>
            <MenuItem label="Actualiser"/>
            <MenuSeparator />
            <MenuItem label="Coller" aria-disabled/>
            <MenuItem label="Coller le raccourci" aria-disabled/>
            <MenuItem label="Annuler Déplacer" info="Ctrl+Z"/>
            <MenuSeparator />
            <MenuItem label="Nouveau">
              <FloatingMenu>
                <MenuItem label="Dossier"/>
                <MenuItem label="Raccourci"/>
                <MenuSeparator />
                <MenuItem label="Porte-documents"/>
                <MenuItem label="Image bitmap"/>
                <MenuItem label="Document WordPad"/>
                <MenuItem label="Document au format RTF"/>
                <MenuItem label="Document texte"/>
                <MenuItem label="Son Wave"/>
                <MenuItem label="Dossier compressé"/>
              </FloatingMenu>
            </MenuItem>
            <MenuSeparator />
            <MenuItem label="Propriétés"/>
          </FloatingMenu>
        </div>
      )}

      {isShutdownOverlayVisible && <WindowsShutdownOverlay />}
    </div>
  );
};
