import React, { useState } from 'react';
import { Window } from '../../organisms/Window/Window';
import { Taskbar } from '../../organisms/Taskbar/Taskbar';
import XPWallpaper from '../../../assets/xp-wallpaper.jpg';
import MyComputerIcon from '../../../assets/windows-icons/explorer.exe_14_100-9.png';
import MyComputerSmallIcon from '../../../assets/windows-icons/explorer.exe_14_100-11.png';
import MyDocumentsIcon from '../../../assets/windows-icons/shell32.dll_14_235-9.png';
import FolderSmallIcon from '../../../assets/windows-icons/shell32.dll_14_5-8.png';
import ShutdownComputerIcon from '../../../assets/windows-icons/shell32.dll_14_28-9.png';
import TashbinIcon from '../../../assets/windows-icons/explorer.exe_14_108-7.png';
import { DesktopIcon } from '../../atoms/DesktopIcon/DesktopIcon';

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
              ? { ...w, isMinimized: false, zIndex: maxZIndex + 1 }
              : w
          );
        }
        // Sinon, on la met juste au premier plan
        return prev.map((w) =>
          w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w
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
      <div>Contenu Mes Documents</div>
    );
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${XPWallpaper})`,
      }}
    >
      {/*  Bureau : icônes */}
      <div>
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
          icon={<img src={ShutdownComputerIcon} />}
          label="Reboot"
          onDoubleClick={() => window.location.reload()}
        />
        <DesktopIcon
          icon={<img src={TashbinIcon} />}
          label="Corbeille"
          onDoubleClick={() => {
            // Exemple : ouvre "Mes Documents" pour la démonstration
            openMyDocuments();
          }}
        />
      </div>

      {/* Fenêtres à l'écran (non minimisées) */}
      {windows
        .filter((w) => !w.isMinimized)
        .map((window) => (
          <Window
            key={window.id}
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
    </div>
  );
};
