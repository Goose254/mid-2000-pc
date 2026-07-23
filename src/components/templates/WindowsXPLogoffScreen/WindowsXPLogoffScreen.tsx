import React, { useEffect, useRef } from 'react';
import styles from './WindowsXPLogoffScreen.module.scss';
import { useTranslation } from 'react-i18next';

interface WindowsXPLogoffScreenProps {
  /**
   * 'logoff'  → « Fermeture de la session… » (retour au logon)
   * 'shutdown' → « Windows va s'arrêter… » (extinction ou redémarrage)
   */
  variant: 'logoff' | 'shutdown';
  /** Appelé une fois l'animation terminée. */
  onComplete: () => void;
  /** Durée d'affichage avant `onComplete` (ms). */
  duration?: number;
}

/**
 * Écran transitoire de fin de session, visuellement calqué sur l'écran de logon
 * (dégradé bleu XP, séparateurs). Sert au « Fermeture de la session… » comme au
 * « Windows va s'arrêter… ».
 */
export const WindowsXPLogoffScreen: React.FC<WindowsXPLogoffScreenProps> = ({
  variant,
  onComplete,
  duration = 2600,
}) => {
  const { t } = useTranslation('common', { keyPrefix: 'session' });
  const logoffSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Son de fermeture de session.
    //
    // NOTE ASSET : le son de logoff de Windows XP appartient à Microsoft et n'est
    // PAS livré dans le dépôt. On le charge donc à l'exécution depuis le dossier
    // `public/sounds/`. Tant que le fichier est absent, la requête échoue et est
    // silencieusement ignorée (`.catch`), exactement comme le son de démarrage.
    // Pour l'activer : déposer le fichier dans
    //   public/sounds/windows-xp-logoff.mp3
    const logoffSoundUrl = `${import.meta.env.BASE_URL}sounds/windows-xp-logoff.mp3`;
    logoffSoundRef.current = new Audio(logoffSoundUrl);
    logoffSoundRef.current.play().catch(() => {
      // Fichier absent ou autoplay bloqué : on ignore silencieusement.
    });

    const timer = setTimeout(onComplete, duration);
    return () => {
      clearTimeout(timer);
      logoffSoundRef.current?.pause();
    };
  }, [onComplete, duration]);

  const message = variant === 'shutdown' ? t('shuttingDown') : t('loggingOff');

  return (
    <div className={`${styles.logoff} min-h-screen relative overflow-hidden`}>
      <div className={styles.topSeparator} />
      <div className={styles.content}>
        <div className={styles.spinner} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className={styles.message}>{message}</div>
        <div className={styles.subMessage}>{t('savingSettings')}</div>
      </div>
      <div className={styles.bottomSeparator} />
      <div className={styles.footer} />
    </div>
  );
};
