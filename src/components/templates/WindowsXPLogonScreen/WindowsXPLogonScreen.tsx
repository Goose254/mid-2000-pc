import React from 'react';
import styles from './WindowsXPLogonScreen.module.scss';
import { useTranslation } from 'react-i18next';
import { useUsersStore } from '@/common/stores/usersStore';
import { Avatar } from '@/components/atoms/Avatar/Avatar';
import ShutdownIcon from '@/assets/windows-icons/shell32.dll_14_28-9.png';
import XPLogo from '@/assets/xp-logon-logo.png';

interface WindowsXPLogonScreenProps {
  /** Appelé après qu'un compte a été sélectionné (session ouverte). */
  onLogin: () => void;
  /** Appelé quand l'utilisateur choisit d'arrêter l'ordinateur. */
  onPowerOff: () => void;
}

/**
 * Écran d'accueil (Welcome screen) de Windows XP : liste des comptes en tuiles.
 * Fidélité : fond dégradé bleu, séparateurs horizontaux, branding à gauche,
 * comptes à droite, bouton d'arrêt en bas.
 */
export const WindowsXPLogonScreen: React.FC<WindowsXPLogonScreenProps> = ({ onLogin, onPowerOff }) => {
  const { t } = useTranslation('common', { keyPrefix: 'session' });
  const users = useUsersStore((state) => state.users);
  const login = useUsersStore((state) => state.login);

  const handleSelectAccount = (id: string) => {
    login(id);
    onLogin();
  };

  return (
    <div className={styles.logon}>
      <div className={styles.topSeparator} />

      <div className={styles.body}>
        <div className={styles.brand}>
          <img
            className={styles.brandLogo}
            src={XPLogo}
            alt={`${t('logon.brandLine1')} ${t('logon.brandLine2')} ${t('logon.edition')}`}
            draggable={false}
          />
          <div className={styles.brandInstruction}>{t('logon.instruction')}</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.accounts}>
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className={styles.accountTile}
              onClick={() => handleSelectAccount(user.id)}
            >
              <Avatar avatar={user.avatar} name={user.name} size={48} framed />
              <span className={styles.accountName}>{user.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.bottomSeparator} />

      <div className={styles.footer}>
        <button type="button" className={styles.powerButton} onClick={onPowerOff}>
          <img src={ShutdownIcon} alt="" />
          <span>{t('logon.turnOff')}</span>
        </button>
        <div className={styles.hint}>{t('logon.hint')}</div>
      </div>
    </div>
  );
};
