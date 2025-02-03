import React, { useEffect, useRef } from 'react';
import styles from './WindowsXPSplashScreen.module.scss';
import WindowsXPStartupSound from '../../../assets/sounds/windows-xp-startup.mp3';
import { BootStage } from '../../../App';

export const WindowsXPSplashScreen: React.FC<{ onComplete: (bootStage?: BootStage) => void }> = ({ onComplete }) => {
  const xpStartupSoundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    xpStartupSoundAudioRef.current = new Audio(WindowsXPStartupSound);
    xpStartupSoundAudioRef.current.play().catch((err) => {
      console.log('Erreur lors de la lecture audio:', err);
    });

    const timer = setTimeout(() => onComplete('desktop'), 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`${styles.splashScreenContainer} min-h-screen relative overflow-hidden`}>
      <div className={styles.splashScreenTopSeparator}></div>
      <div className={styles.splashScreenContent}>
        <div className={styles.splashScreenWelcome}>Bienvenue</div>
      </div>
      <div className={styles.splashScreenBottomSeparator}></div>
    </div>
  );
};
