import React, { useEffect, useRef } from 'react';
import './WindowsXPSplashScreen.css';
import WindowsXPStartupSound from '../../../assets/sounds/windows-xp-startup.mp3';
import { BootStage } from '../../../App';

export const WindowsXPSplashScreen: React.FC<{ onComplete: (bootStage?: BootStage) => void }> = ({ onComplete }) => {
  const xpStartupSoundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    xpStartupSoundAudioRef.current = new Audio(WindowsXPStartupSound);
      
    // Exemple : on joue le beep au montage ou à un moment précis
    xpStartupSoundAudioRef.current.play().catch((err) => {
      console.log('Erreur lors de la lecture audio:', err);
    });

    const timer = setTimeout(() => onComplete('desktop'), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div id="splash-screen-container" className="min-h-screen relative overflow-hidden">
        <div id="splash-screen-top-separator"></div>
        <div id="splash-screen-content">
            <div id="splash-screen-welcome">Bienvenue</div>
        </div>
        <div id="splash-screen-bottom-separator"></div>
    </div>
  );
};