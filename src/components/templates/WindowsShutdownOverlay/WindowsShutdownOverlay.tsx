import React, { useEffect } from 'react';
import styles from './WindowsShutdownOverlay.module.scss';
import StandbyComputerIcon from '../../../assets/windows-icons/shell32.dll_14_26-9.png';
import ShutdownComputerIcon from '../../../assets/windows-icons/shell32.dll_14_28-9.png';
import RestartComputerIcon from '../../../assets/windows-icons/shell32.dll_14_27-9.png';
import { Button } from '../../atoms/Button/Button';
import { useOverlaysStore } from '@/common/stores/overlaysStore';
import { useSystemStore } from '@/common/stores/systemStore';

export const WindowsShutdownOverlay: React.FC = () => {
  const toggleShutdownOverlay = useOverlaysStore(
    (state) => state.toggleShutdownOverlay
  );
  const requestShutdown = useSystemStore((state) => state.requestShutdown);
  const requestRestart = useSystemStore((state) => state.requestRestart);

  const handleShutdown = () => {
    toggleShutdownOverlay();
    requestShutdown();
  };

  const handleRestart = () => {
    toggleShutdownOverlay();
    requestRestart();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const overlayContainer = document.getElementById("shutdown-overlay-container");
      if (overlayContainer) {
        overlayContainer.style.backdropFilter = 'grayscale(100%) brightness(90%)';
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="shutdown-overlay-container" className={styles["shutdown-overlay-container"]}>
      <div className={styles["shutdown-overlay-window"]}>
        <div className={styles["shutdown-overlay-window-title"]}>
          Arrêter l'ordinateur
        </div>
        <div className={styles["shutdown-overlay-window-content"]}>
          <div className={styles["shutdown-overlay-top-separator"]}></div>
          <div className={styles["shutdown-overlay-element"]} aria-disabled="true">
            <div className={styles["shutdown-overlay-icon"]}>
              <img src={StandbyComputerIcon} alt="Mettre en veille" />
              <div
                className={styles["shutdown-overlay-icon-overlay"]}
                style={{ "--icon-image": `url(${ShutdownComputerIcon})` } as React.CSSProperties}
              />
            </div>
            <div className={styles["shutdown-overlay-icon-label"]}>Mettre en veille</div>
          </div>
          <div className={styles["shutdown-overlay-element"]}>
            <div className={styles["shutdown-overlay-icon"]} onClick={handleShutdown}>
              <img src={ShutdownComputerIcon} alt="Arrêter" />
              <div
                className={styles["shutdown-overlay-icon-overlay"]}
                style={{ "--icon-image": `url(${ShutdownComputerIcon})` } as React.CSSProperties}
              />
            </div>
            <div className={styles["shutdown-overlay-icon-label"]}>Arrêter</div>
          </div>
          <div className={styles["shutdown-overlay-element"]}>
            <div className={styles["shutdown-overlay-icon"]} onClick={handleRestart}>
              <img src={RestartComputerIcon} alt="Redémarrer" />
              <div
                className={styles["shutdown-overlay-icon-overlay"]}
                style={{ "--icon-image": `url(${RestartComputerIcon})` } as React.CSSProperties}
              />
            </div>
            <div className={styles["shutdown-overlay-icon-label"]}>Redémarrer</div>
          </div>
        </div>
        <Button className={styles["shutdown-overlay-cancel-button"]} size="small" onClick={toggleShutdownOverlay}>
          Annuler
        </Button>
      </div>
    </div>
  );
};
