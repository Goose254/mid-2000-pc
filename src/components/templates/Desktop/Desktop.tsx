import React, { useEffect, useRef, useState } from 'react';
import { Window } from '../../organisms/Window/Window';
import { Taskbar } from '../../organisms/Taskbar/Taskbar';
import XPWallpaper from '../../../assets/xp-wallpaper.jpg';
import MyComputerIcon from '../../../assets/windows-icons/explorer.exe_14_100-9.png';
import MyComputerSmallIcon from '../../../assets/windows-icons/explorer.exe_14_100-11.png';
import MyDocumentsIcon from '../../../assets/windows-icons/shell32.dll_14_235-9.png';
import FolderSmallIcon from '../../../assets/windows-icons/shell32.dll_14_5-8.png';
import TashbinIcon from '../../../assets/windows-icons/shell32.dll_14_254-7.png';
import AboutIcon from '../../../assets/windows-icons/hnetwiz.dll_14_10001-9.png';
import AboutSmallIcon from '../../../assets/windows-icons/hnetwiz.dll_14_10001-11.png';
import WindowToolbarWindowsIcon from '../../../assets/explorer-toolbar-windows-icon.png';
import { DesktopIcon } from '../../atoms/DesktopIcon/DesktopIcon';
import { WindowsShutdownOverlay } from '../WindowsShutdownOverlay/WindowsShutdownOverlay';
import { useDesktopStore } from '../../../stores/Desktop/useDesktopStore';
import { WindowToolbar } from '../../atoms/WindowToolbar/WindowToolbar';
import { MenuItem } from '../../atoms/MenuItem/MenuItem';
import { FloatingMenu } from '../../molecules/FloatingMenu/FloatingMenu';
import { MenuSeparator } from '../../atoms/MenuSeparator/MenuSeparator';
import { WindowToolbarMenuButton } from '../../atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';

type DesktopWindow = {
  id: string;
  title: string;
  icon: React.ReactElement;    // Icone version "petite"
  content: React.ReactNode;    // Contenu à afficher
  isMinimized: boolean;        // Permet de masquer/restaurer
  isActive: boolean;           // Permet de gérer le statut
  zIndex: number;              // Gère l'ordre d'empilement
};

export const Desktop: React.FC = () => {
  const [windows, setWindows] = useState<DesktopWindow[]>([]);
  const [maxZIndex, setMaxZIndex] = useState<number>(1);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const isShutdownOverlayVisible = useDesktopStore(
    (state) => state.isShutdownOverlayVisible
  );

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault(); // Empêche le menu contextuel natif du navigateur

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
    });
  };

  /**
   * Ouvre ou restaure la fenêtre si elle est déjà ouverte.
   * - Si la fenêtre n'existe pas, on la crée.
   * - Si elle est minimisée, on la restaure.
   */
  const openWindow = (id: string, title: string, icon: React.ReactElement, content: React.ReactNode) => {
    setWindows((prev) => {
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        // Si elle est déjà ouverte mais minimisée, on la restaure
        if (existing.isMinimized) {
          return prev.map((w) =>
            w.id === id
              ? { ...w, isMinimized: false, isActive: true, zIndex: maxZIndex + 1 }
              : w
          );
        }
        // Sinon, on la met juste au premier plan
        return prev.map((w) =>
          w.id === id ? { ...w, isActive: true, zIndex: maxZIndex + 1 } : w
        );
      }

      // Création d'une nouvelle fenêtre
      return [
        ...prev,
        {
          id,
          title,
          icon,
          content,
          isMinimized: false,
          isActive: true,
          zIndex: maxZIndex + 1,
        },
      ];
    });

    // Incrémente le maxZIndex
    setMaxZIndex((prev) => prev + 1);
  };

  /**
   * Ferme la fenêtre (on la retire simplement de la liste).
   */
  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  /**
   * Amène une fenêtre au premier plan
   * (Par exemple en cliquant sur la barre de titre).
   */
  const bringToFront = (id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, zIndex: maxZIndex + 1, isActive: true }
          : w
      )
    );
    setMaxZIndex((prev) => prev + 1);
  };

  const setWindowInactive = (id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, isActive: false }
          : w
      )
    );
  }

  /**
   * Minimise ou restaure la fenêtre via la Taskbar.
   * - Si la fenêtre est minimisée => on la restaure
   * - Sinon => on la minimise
   */
  const toggleMinimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          if (w.isActive) {
            return { ...w, isMinimized: true, isActive: false };
          } else {
            return { ...w, isMinimized: false, isActive: true, zIndex: maxZIndex + 1 };
          }
        }
        else {
          return { ...w, isActive: false };
        }
      })
    );
    setMaxZIndex((prev) => prev + 1);
  };

  // Pour simplifier le code, on va définir le contenu
  // de chaque fenêtre "connu" (Poste de travail, Mes documents, etc.).
  // Dans un vrai projet, on peut organiser ça différemment.
  const openMyComputer = () => {
    openWindow(
      'my-computer',
      'Poste de travail',
      <img src={MyComputerSmallIcon} />,
      <div>Contenu Poste de travail</div>
    );
  };

  const openMyDocuments = () => {
    openWindow(
      'my-documents',
      'Mes Documents',
      <img src={FolderSmallIcon} />,
      <>
        <WindowToolbar>
          <WindowToolbarMenuButton label="Fichier">
            <FloatingMenu>
              <MenuItem label="Créer un raccourci" aria-disabled />
              <MenuItem label="Supprimer" aria-disabled/>
              <MenuItem label="Renommer" aria-disabled/>
              <MenuItem label="Propriétés" aria-disabled/>
              <MenuSeparator />
              <MenuItem label="Fermer"/>
            </FloatingMenu>
          </WindowToolbarMenuButton>
          <WindowToolbarMenuButton label="Edition">
            <FloatingMenu>
              <MenuItem label="Annuler Déplacer" shortcut="Ctrl+Z"/>
              <MenuSeparator />
              <MenuItem label="Couper" shortcut="Ctrl+X" aria-disabled/>
              <MenuItem label="Copier" shortcut="Ctrl+C" aria-disabled/>
              <MenuItem label="Coller" shortcut="Ctrl+V" aria-disabled/>
              <MenuItem label="Coller le raccourci" aria-disabled/>
              <MenuSeparator />
              <MenuItem label="Copier dans un dossier..." aria-disabled/>
              <MenuItem label="Déplacer vers un dossier..." aria-disabled/>
              <MenuSeparator />
              <MenuItem label="Sélectionner tout" shortcut="Ctrl+A"/>
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
                  <MenuItem label="Rechercher" shortcut="Ctrl+E"/>
                  <MenuItem label="Favoris" shortcut="Ctrl+I"/>
                  <MenuItem label="Historique" shortcut="Ctrl+H"/>
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
                  <MenuItem label="Précédente" shortcut="Alt+Flèche gauche" aria-disabled/>
                  <MenuItem label="Suivante" shortcut="Alt+Flèche droite" aria-disabled/>
                  <MenuItem label="Dossier parent"/>
                  <MenuSeparator />
                  <MenuItem label="Page de démarrage" shortcut="Alt+Origine"/>
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
          <img src={WindowToolbarWindowsIcon} style={{ marginLeft: 'auto', borderLeft: '1px solid #aca899' }} />
        </WindowToolbar>
        <WindowToolbar><></></WindowToolbar>
        <WindowToolbar><></></WindowToolbar>
      </>
    );
  };

  const openAbout = () => {
    openWindow(
      'about',
      'À propos de cette expérience',
      <img src={AboutSmallIcon} />,
      <div>Cette expérience de simulation d'un ordinateur du milieu des années 2000 est basée sur ReactJS.</div>
    );
  };

  // Listener global pour masquer le menu si on clique n’importe où
  useEffect(() => {
    const handleClickOutsideContextMenu = (event: MouseEvent) => {
      // Si on clique en dehors du menu
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener("click", handleClickOutsideContextMenu);

    return () => {
      document.removeEventListener("click", handleClickOutsideContextMenu);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${XPWallpaper})`,
      }}
    >
      {/*  Bureau : icônes */}
      <div onContextMenu={handleContextMenu} style={{ height: 'calc(100vh - 30px)' }}>
        <DesktopIcon
          icon={<img src={MyComputerIcon} />}
          label="Poste de travail"
          onDoubleClick={openMyComputer}
        />
        <DesktopIcon
          icon={<img src={MyDocumentsIcon} />}
          label="Mes Documents"
          onDoubleClick={openMyDocuments}
        />
        <DesktopIcon
          icon={<img src={TashbinIcon} />}
          label="Corbeille"
          onDoubleClick={() => {
            // Exemple : ouvre "Mes Documents" pour la démonstration
            openMyDocuments();
          }}
        />
        <DesktopIcon
          icon={<img src={AboutIcon} />}
          label="À propos"
          onDoubleClick={openAbout}
        />
      </div>

      {/* Fenêtres à l'écran (non minimisées) */}
      {windows
        .filter((w) => !w.isMinimized)
        .map((window) => (
          <Window
            key={window.id}
            id={window.id}
            title={window.title}
            icon={window.icon}
            onClose={() => closeWindow(window.id)}
            onActive={() => bringToFront(window.id)}
            onInactive={() => setWindowInactive(window.id)}
            onMinimize={() => toggleMinimizeWindow(window.id)}
            isActive={window.isActive}
            initialPosition={{
              x: 100 + Math.random() * 100,
              y: 100 + Math.random() * 100,
            }}
            zPosition={window.zIndex}
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
          <FloatingMenu style={{ top: contextMenu.y, left: contextMenu.x, zIndex: '10000' }}>
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
            <MenuItem label="Annuler Déplacer" shortcut="Ctrl+Z"/>
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
