import React from 'react';
import './StartMenu.css';
import CloseSessionIcon from '../../../assets/windows-icons/shell32.dll_14_45-10.png';
import ShutdownComputerIcon from '../../../assets/windows-icons/shell32.dll_14_28-10.png';
import { useDesktopStore } from '../../../stores/Desktop/useDesktopStore';

interface StartMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
}

export const StartMenu = React.forwardRef<HTMLDivElement, StartMenuProps>(
  ({ isVisible, ...divProps }, ref) => {
    const toggleStartMenu = useDesktopStore(
      (state) => state.toggleStartMenu
    );

    const toggleShutdownOverlay = useDesktopStore(
      (state) => state.toggleShutdownOverlay
    );

    const handleShutdownOverlayShow = () => {
      toggleShutdownOverlay();
      toggleStartMenu();
    }

    return (
      <>
        {isVisible && (
          <div id="start-menu" ref={ref} {...divProps}>
            <div id="start-menu-account">
              <div id="start-menu-avatar"></div>
              <div id="start-menu-account-name">Utilisateur</div>
            </div>
            <div id="start-menu-lists">
              <div id="start-menu-left-list"></div>
              <div id="start-menu-right-list"></div>
            </div>
            <div id="start-menu-actions">
              <button><img src={CloseSessionIcon} /> Fermer la session</button>
              <button onClick={() => handleShutdownOverlayShow()}><img src={ShutdownComputerIcon} /> Arrêter l'ordinateur</button>
            </div>
          </div>
        )}
      </>
    );
  }
);
