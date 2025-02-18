import React from 'react';
import { WindowControl } from '../../atoms/WindowControl/WindowControl';
import styles from './TitleBar.module.scss';
import { TitleBarButtonOptions } from '@/components/organisms/Window/Window';

/**
 * Options de configuration pour la TitleBar
 */
export interface TitleBarOptions {
  /**
   * Titre
   */
  title?: string;
  /**
   * Icône
   */
  icon?: React.ReactElement;

  /**
   * État d'activation (fenêtre active ou pas)
   */
  isActive?: boolean;
  /**
   * Fenêtre maximisée ?
   */
  isMaximized?: boolean;

  /**
   * Options des boutons
   */
  buttons?: {
    help?: TitleBarButtonOptions;
    minimize?: TitleBarButtonOptions;
    maximize?: TitleBarButtonOptions;
    close?: TitleBarButtonOptions;
  };
}

interface TitleBarProps {
  /**
   * Objet contenant les paramètres de la TitleBar
   */
  options: TitleBarOptions;
}

export const TitleBar: React.FC<TitleBarProps> = ({ options }) => {
  // Valeurs par défaut de la titleBar
  const {
    title = 'Untitled',
    icon,
    isActive = true,
    isMaximized = false,
    buttons,
  } = options;

  // Application des classes pour le conteneur
  const containerClasses = [
    styles.titleBarContainer,
    isMaximized ? styles.maximized : "",
    isActive ? "" : styles.inactive,
  ].join(" ").trim();

  // Double-clic pour maximiser/restaurer (si la prop onMaximize existe)
  const handleDoubleClick = () => {
    if (buttons?.maximize?.action) {
      buttons.maximize.action();
    }
  };

  return (
    <div className={containerClasses} onDoubleClick={handleDoubleClick}>
      <div className={styles.titleBarTitleWrapper}>
        {icon && (
          <div className={styles.titleBarTitleIcon}>
            {icon}
          </div>
        )}
        <div className={`${styles.titleBarTitleLabel} ${!icon ? styles.titleBarTitleLabelWithoutIcon : ""}`}>{title}</div>
      </div>

      <div className={styles.titleBarWindowControlsWrapper}>
        {/* Bouton Help (facultatif) */}
        {buttons?.help?.visible && (
          <WindowControl
            type="help"
            onClick={() => buttons?.help?.action && buttons.help.action()}
            isActive={isActive}
            enabled={buttons.help.enabled}
          />
        )}

        {/* Bouton Minimize (facultatif) */}
        {buttons?.minimize?.visible && (
          <WindowControl
            type="minimize"
            onClick={() => buttons?.minimize?.action && buttons.minimize.action()}
            isActive={isActive}
            enabled={buttons.minimize.enabled}
          />
        )}

        {/* Bouton Maximize/Restore (facultatif) */}
        {buttons?.maximize?.visible && (
          isMaximized ? (
            <WindowControl
              type="restore"
              onClick={() => buttons?.maximize?.action && buttons.maximize.action()}
              isActive={isActive}
              enabled={buttons.maximize.enabled}
            />
          ) : (
            <WindowControl
              type="maximize"
              onClick={() => buttons?.maximize?.action && buttons.maximize.action()}
              isActive={isActive}
              enabled={buttons.maximize.enabled}
            />
          )
        )}

        {/* Bouton Close (facultatif) */}
        {buttons?.close?.visible && (
          <WindowControl
            type="close"
            onClick={() => buttons?.close?.action && buttons.close.action()}
            isActive={isActive}
            enabled={buttons.close.enabled}
          />
        )}
      </div>
    </div>
  );
};
