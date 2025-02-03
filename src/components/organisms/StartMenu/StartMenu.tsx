import React from 'react';
import styles from './StartMenu.module.scss';
import CloseSessionIcon from '../../../assets/windows-icons/shell32.dll_14_45-10.png';
import ShutdownComputerIcon from '../../../assets/windows-icons/shell32.dll_14_28-10.png';
import { useDesktopStore } from '../../../stores/Desktop/useDesktopStore';

interface StartMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
}

export const StartMenu = React.forwardRef<HTMLDivElement, StartMenuProps>(
  ({ isVisible, ...divProps }, ref) => {
    const toggleStartMenu = useDesktopStore((state) => state.toggleStartMenu);
    const toggleShutdownOverlay = useDesktopStore((state) => state.toggleShutdownOverlay);

    const handleShutdownOverlayShow = () => {
      toggleShutdownOverlay();
      toggleStartMenu();
    };

    return (
      <>
        {isVisible && (
          <div className={styles.startMenu} ref={ref} {...divProps}>
            <div className={styles.startMenuAccount}>
              <div className={styles.startMenuAvatar}></div>
              <div className={styles.startMenuAccountName}>Utilisateur</div>
            </div>
            <div className={styles.startMenuLists}>
              <div className={styles.startMenuLeftList}></div>
              <div className={styles.startMenuRightList}></div>
            </div>
            <div className={styles.startMenuActions}>
              <button>
                <img src={CloseSessionIcon} alt="Close session" /> Fermer la session
              </button>
              <button onClick={handleShutdownOverlayShow}>
                <img src={ShutdownComputerIcon} alt="Shutdown computer" /> Arrêter l'ordinateur
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
);
