import React, { useEffect, useRef } from 'react';
import styles from './WindowsXPSplashScreen.module.scss';
import WindowsXPStartupSound from '../../../assets/sounds/windows-xp-startup.mp3';
import { BootStage } from '../../../App';
import { useTranslation } from 'react-i18next';

export const WindowsXPSplashScreen: React.FC<{ onComplete: (bootStage?: BootStage) => void }> = ({ onComplete }) => {
  const { t } = useTranslation('common', { keyPrefix : 'splashScreen' });
  const xpStartupSoundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    xpStartupSoundAudioRef.current = new Audio(WindowsXPStartupSound);
    xpStartupSoundAudioRef.current.play().catch(() => {
      // Autoplay may be blocked by the browser until the user interacts with
      // the page: silently skip the startup sound in that case.
    });

    const timer = setTimeout(() => onComplete('desktop'), 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`${styles.splashScreenContainer} min-h-screen relative overflow-hidden`}>
      <div className={styles.splashScreenTopSeparator}></div>
      <div className={styles.splashScreenContent}>
        <div className={styles.splashScreenWelcome}>{t('welcome')}</div>
      </div>
      <div className={styles.splashScreenBottomSeparator}></div>
    </div>
  );
};
