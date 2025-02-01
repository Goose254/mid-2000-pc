import React, { useEffect } from 'react';
import './WindowsShutdownOverlay.css';
import StandbyComputerIcon from '../../../assets/windows-icons/shell32.dll_14_26-9.png';
import ShutdownComputerIcon from '../../../assets/windows-icons/shell32.dll_14_28-9.png';
import RestartComputerIcon from '../../../assets/windows-icons/shell32.dll_14_27-9.png';
import { Button } from '../../atoms/Button/Button';

type WindowsShutdownOverlayProps = {
    onCancel: () => void;
}

export const WindowsShutdownOverlay: React.FC<WindowsShutdownOverlayProps> = ({ onCancel }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
        const overlayContainerStyle = document.getElementById("shutdown-overlay-container")
    
        if (overlayContainerStyle) overlayContainerStyle.style.backdropFilter = 'grayscale(100%)';
    }, 500)

    return () => clearTimeout(timer)
  }, []);

  return (
    <div id="shutdown-overlay-container">
        <div id="shutdown-overlay-window">
            <div id="shutdown-overlay-window-title">
                Arrêter l'ordinateur
            </div>
            <div id="shutdown-overlay-window-content">
                <div id="shutdown-overlay-top-separator"></div>
                <div className="shutdown-overlay-element" aria-disabled>
                    <div className="shutdown-overlay-icon">
                        <img src={StandbyComputerIcon} />
                        <div className="shutdown-overlay-icon-overlay" style={{ "--icon-image": `url(${ShutdownComputerIcon})` } as React.CSSProperties}/>
                    </div>
                    <div className="shutdown-overlay-icon-label">Mettre en veille</div>
                </div>
                <div className="shutdown-overlay-element">
                    <div className="shutdown-overlay-icon">
                        <img src={ShutdownComputerIcon} />
                        <div className="shutdown-overlay-icon-overlay" style={{ "--icon-image": `url(${ShutdownComputerIcon})` } as React.CSSProperties}/>
                    </div>
                    <div className="shutdown-overlay-icon-label">Arrêter</div>
                </div>
                <div className="shutdown-overlay-element">
                    <div className="shutdown-overlay-icon" onClick={() => window.location.reload()}>
                        <img src={RestartComputerIcon} />
                        <div className="shutdown-overlay-icon-overlay" style={{ "--icon-image": `url(${RestartComputerIcon})` } as React.CSSProperties}/>
                    </div>
                    <div className="shutdown-overlay-icon-label">Redémarrer</div>
                </div>
            </div>
            <Button className="shutdown-overlay-cancel-button" size="small" onClick={onCancel}>Annuler</Button>
        </div>
    </div>
  );
};