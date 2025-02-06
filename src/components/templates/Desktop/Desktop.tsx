import React, { useEffect, useRef, useState } from 'react';
import { useDesktopStore } from '@/stores/Desktop/useDesktopStore';

import { WindowsShutdownOverlay } from '@/components/templates/WindowsShutdownOverlay/WindowsShutdownOverlay';
import { DesktopIcon } from '@/components/atoms/DesktopIcon/DesktopIcon';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarButton } from '@/components/atoms/WindowToolbarButton/WindowToolbarButton';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { Window } from '@/components/organisms/Window/Window';
import { Taskbar } from '@/components/organisms/Taskbar/Taskbar';

import XPWallpaper from '@/assets/xp-wallpaper.jpg';
import MyComputerIcon from '@/assets/windows-icons/explorer.exe_14_100-9.png';
import MyComputerSmallIcon from '@/assets/windows-icons/explorer.exe_14_100-11.png';
import MyDocumentsIcon from '@/assets/windows-icons/shell32.dll_14_235-9.png';
import FolderSmallIcon from '@/assets/windows-icons/shell32.dll_14_5-8.png';
import TashbinIcon from '@/assets/windows-icons/shell32.dll_14_254-7.png';
import AboutIcon from '@/assets/windows-icons/hnetwiz.dll_14_10001-9.png';
import AboutSmallIcon from '@/assets/windows-icons/hnetwiz.dll_14_10001-11.png';
import WindowToolbarWindowsIcon from '@/assets/explorer-toolbar-windows-icon.png';
import BackwardIcon from '@/assets/explorer-icons/back.png';
import FoldersIcon from '@/assets/explorer-icons/folders.png';
import ForwardIcon from '@/assets/explorer-icons/forward.png';
import SearchIcon from '@/assets/explorer-icons/search.png';
import UpIcon from '@/assets/explorer-icons/up.png';
import ViewsIcon from '@/assets/explorer-icons/views.png';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars';
import { WindowsXpArrowsPlugin } from '@/plugins/OverlayScrollbars/WindowsXpArrowsPlugin';
import '@/plugins/OverlayScrollbars/WindowsXpArrowsPlugin.css';

OverlayScrollbars.plugin(ClickScrollPlugin);
OverlayScrollbars.plugin(WindowsXpArrowsPlugin);

export const Desktop: React.FC = () => {
  // --- On récupère "chaque propriété" séparément pour éviter la recréation d'objets ---
  const windows = useDesktopStore((state) => state.windows);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const closeWindow = useDesktopStore((state) => state.closeWindow);
  const bringToFront = useDesktopStore((state) => state.bringToFront);
  const setWindowInactive = useDesktopStore((state) => state.setWindowInactive);
  const toggleMinimizeWindow = useDesktopStore((state) => state.toggleMinimizeWindow);

  const isShutdownOverlayVisible = useDesktopStore(
    (state) => state.isShutdownOverlayVisible
  );

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

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

  // Méthodes d'ouverture de fenêtre
  const openMyComputer = () => {
    openWindow(
      'my-computer',
      'Poste de travail',
      <img src={MyComputerSmallIcon} alt="MyComputer" />,
      <div>Contenu Poste de travail</div>
    );
  };

  const openMyDocuments = () => {
    openWindow(
      'my-documents',
      'Mes Documents',
      <img src={FolderSmallIcon} alt="MyDocuments" />,
      <>
        {/* Barre d'outils / menus */}
        <WindowToolbar>
          <WindowToolbarMenuButton label="Fichier">
            <FloatingMenu>
              <MenuItem label="Créer un raccourci" aria-disabled />
              <MenuItem label="Supprimer" aria-disabled />
              <MenuItem label="Renommer" aria-disabled />
              <MenuItem label="Propriétés" aria-disabled />
              <MenuSeparator />
              <MenuItem label="Fermer" />
            </FloatingMenu>
          </WindowToolbarMenuButton>
          <WindowToolbarMenuButton label="Edition">
            <FloatingMenu>
              <MenuItem label="Annuler Déplacer" info="Ctrl+Z"/>
              <MenuSeparator />
              <MenuItem label="Couper" info="Ctrl+X" aria-disabled/>
              <MenuItem label="Copier" info="Ctrl+C" aria-disabled/>
              <MenuItem label="Coller" info="Ctrl+V" aria-disabled/>
              <MenuItem label="Coller le raccourci" aria-disabled/>
              <MenuSeparator />
              <MenuItem label="Copier dans un dossier..." aria-disabled/>
              <MenuItem label="Déplacer vers un dossier..." aria-disabled/>
              <MenuSeparator />
              <MenuItem label="Sélectionner tout" info="Ctrl+A"/>
              <MenuItem label="Inverser la sélection"/>
            </FloatingMenu>
          </WindowToolbarMenuButton>
          <WindowToolbarMenuButton label="Affichage">
            <FloatingMenu>
              <MenuItem label="Barre d'outils">
                <FloatingMenu>
                  <MenuItem label="Boutons standard"/>
                  <MenuItem label="Barre d'adresses"/>
                  <MenuItem label="Liens"/>
                  <MenuSeparator />
                  <MenuItem label="Verouiller les barres d'outils"/>
                  <MenuItem label="Personnaliser..."/>
                </FloatingMenu>
              </MenuItem>
              <MenuItem label="Barre d'état"/>
              <MenuItem label="Volet d'exploration">
                <FloatingMenu>
                  <MenuItem label="Rechercher" info="Ctrl+E"/>
                  <MenuItem label="Favoris" info="Ctrl+I"/>
                  <MenuItem label="Historique" info="Ctrl+H"/>
                  <MenuItem label="Dossiers"/>
                  <MenuSeparator />
                  <MenuItem label="Astuce du jour"/>
                </FloatingMenu>
              </MenuItem>
              <MenuSeparator />
              <MenuItem label="Miniatures"/>
              <MenuItem label="Mosaïques"/>
              <MenuItem label="Icônes"/>
              <MenuItem label="Liste"/>
              <MenuItem label="Détails"/>
              <MenuSeparator />
              <MenuItem label="Réorganiser les icônes par">
                <FloatingMenu>
                  <MenuItem label="Nom"/>
                  <MenuItem label="Type"/>
                  <MenuItem label="Taille totale"/>
                  <MenuItem label="Espace libre"/>
                  <MenuItem label="Commentaires"/>
                  <MenuSeparator />
                  <MenuItem label="Afficher par groupe"/>
                  <MenuItem label="Réorganisation automatique"/>
                  <MenuItem label="Aligner sur la grille"/>
                </FloatingMenu>
              </MenuItem>
              <MenuSeparator />
              <MenuItem label="Choisir les détails..."/>
              <MenuItem label="Atteindre">
                <FloatingMenu>
                  <MenuItem label="Précédente" info="Alt+Flèche gauche" aria-disabled/>
                  <MenuItem label="Suivante" info="Alt+Flèche droite" aria-disabled/>
                  <MenuItem label="Dossier parent"/>
                  <MenuSeparator />
                  <MenuItem label="Page de démarrage" info="Alt+Origine"/>
                  <MenuSeparator />
                  <MenuItem label="Poste de travail"/>
                </FloatingMenu>
              </MenuItem>
              <MenuItem label="Actualiser"/>
            </FloatingMenu>
          </WindowToolbarMenuButton>
          <WindowToolbarMenuButton label="Favoris">
            <FloatingMenu>
              <MenuItem label="Ajouter aux Favoris..."/>
              <MenuItem label="Organiser les Favoris..."/>
              <MenuSeparator />
              <MenuItem label="Liens">
                <FloatingMenu>
                  <MenuItem label="Hotmail"/>
                  <MenuItem label="Personnaliser les liens"/>
                  <MenuItem label="Windows"/>
                  <MenuItem label="Windows Media"/>
                </FloatingMenu>
              </MenuItem>
              <MenuItem label="Guide des stations de radio"/>
              <MenuItem label="MSN.com"/>
            </FloatingMenu>
          </WindowToolbarMenuButton>
          <WindowToolbarMenuButton label="Outils">
            <FloatingMenu>
              <MenuItem label="Connecter un lecteur réseau..."/>
              <MenuItem label="Déconnecter un lecteur réseau..."/>
              <MenuItem label="Synchroniser..."/>
              <MenuSeparator />
              <MenuItem label="Options des dossiers..."/>
            </FloatingMenu>
          </WindowToolbarMenuButton>
          <WindowToolbarMenuButton label="?">
            <FloatingMenu>
              <MenuItem label="Centre d'aide et de support"/>
              <MenuSeparator />
              <MenuItem label="Cette copie de Windows est-elle légale ?"/>
              <MenuItem label="À propos de Windows"/>
            </FloatingMenu>
          </WindowToolbarMenuButton>
          <img
            src={WindowToolbarWindowsIcon}
            style={{ marginLeft: 'auto', borderLeft: '1px solid #aca899' }}
            alt="Windows icon"
          />
        </WindowToolbar>

        <WindowToolbar>
          <WindowToolbarButton icon={BackwardIcon} label="Précédente">
            <FloatingMenu>
              <MenuItem label="Poste de travail"/>
            </FloatingMenu>
          </WindowToolbarButton>
          <WindowToolbarButton icon={ForwardIcon}>
            <FloatingMenu>
              <MenuItem label="Mes documents"/>
            </FloatingMenu>
          </WindowToolbarButton>
          <WindowToolbarButton icon={UpIcon}></WindowToolbarButton>
          <MenuSeparator direction="vertical"/>
          <WindowToolbarButton icon={SearchIcon} label="Rechercher"></WindowToolbarButton>
          <WindowToolbarButton icon={FoldersIcon} label="Dossiers"></WindowToolbarButton>
          <MenuSeparator direction="vertical"/>
          <WindowToolbarButton icon={ViewsIcon}>
            <FloatingMenu>
              <MenuItem label="Miniatures"/>
              <MenuItem label="Mosaïques"/>
              <MenuItem label="Icônes"/>
              <MenuItem label="Liste"/>
              <MenuItem label="Détails"/>
            </FloatingMenu>
          </WindowToolbarButton>
        </WindowToolbar>
        <WindowToolbar><></></WindowToolbar>

        <OverlayScrollbarsComponent
          className="overlayscrollbars-react"
          ref={osRef}
          options={{ scrollbars: { theme: "os-theme-dark", autoHide: "never", clickScroll: true } }}
          defer
        >
          {/* Du contenu répétitif pour la démo */}
          Du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          Encore du contenu<br/>
          ...
        </OverlayScrollbarsComponent>
      </>
    );
  };

  const openAbout = () => {
    openWindow(
      'about',
      'À propos de cette expérience',
      <img src={AboutSmallIcon} alt="About" />,
      <div>Cette expérience de simulation d'un ordinateur du milieu des années 2000 est basée sur ReactJS.</div>
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
          onDoubleClick={openMyComputer}
        />
        <DesktopIcon
          icon={<img src={MyDocumentsIcon} alt="MyDocuments Icon" />}
          label="Mes Documents"
          onDoubleClick={openMyDocuments}
        />
        <DesktopIcon
          icon={<img src={TashbinIcon} alt="Trash bin Icon" />}
          label="Corbeille"
          onDoubleClick={() => {
            openMyDocuments();
          }}
        />
        <DesktopIcon
          icon={<img src={AboutIcon} alt="About Icon" />}
          label="À propos"
          onDoubleClick={openAbout}
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
            }}
          >
            {window.content}
          </Window>
        ))}

      {/* Barre des tâches */}
      <Taskbar
        windows={windows}
        onClickWindowIcon={toggleMinimizeWindow}
      />

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
