import React from 'react';
import styles from './WindowsXPShutdownScreen.module.scss';
import { useTranslation } from 'react-i18next';

interface WindowsXPShutdownScreenProps {
  /**
   * Rallume la machine. Comme il s'agit d'une VM, on offre un moyen discret de
   * relancer le cycle de boot (retour au BIOS).
   */
  onPowerOn: () => void;
}

/**
 * Écran d'extinction classique de Windows XP :
 * « Vous pouvez maintenant éteindre votre ordinateur en toute sécurité. »
 * Un bouton d'alimentation discret permet de rallumer la VM.
 */
export const WindowsXPShutdownScreen: React.FC<WindowsXPShutdownScreenProps> = ({ onPowerOn }) => {
  const { t } = useTranslation('common', { keyPrefix: 'session' });

  return (
    <div className={`${styles.shutdown} min-h-screen relative overflow-hidden`}>
      <div className={styles.message}>{t('poweroff.message')}</div>

      <button type="button" className={styles.powerButton} onClick={onPowerOn} title={t('poweroff.restart')}>
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path
            d="M12 3v9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M7.6 6.4a7 7 0 1 0 8.8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
        <span>{t('poweroff.restart')}</span>
      </button>
    </div>
  );
};
