import React from 'react';
import { WindowControl } from '../../atoms/WindowControl/WindowControl';
import styles from './TitleBar.module.scss';

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
   * Callback pour le bouton d'aide (Help).
   * S'il n'est pas défini, on n'affiche pas le bouton.
   */
  onHelp?: () => void;
  /**
   * Callback pour le bouton Minimize.
   * S'il n'est pas défini, on n'affiche pas le bouton.
   */
  onMinimize?: () => void;
  /**
   * Callback pour le bouton Maximize/Restore.
   * S'il n'est pas défini, on n'affiche pas le bouton.
   */
  onMaximize?: () => void;
  /**
   * Callback pour le bouton Close.
   * S'il n'est pas défini, on n'affiche pas le bouton.
   */
  onClose?: () => void;
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
    onHelp,
    onMinimize,
    onMaximize,
    onClose,
  } = options;

  // Application des classes pour le conteneur
  const containerClasses = [
    styles.titleBarContainer,
    isMaximized ? styles.maximized : "",
    isActive ? "" : styles.inactive,
  ].join(" ").trim();

  // Double-clic pour maximiser/restaurer (si la prop onMaximize existe)
  const handleDoubleClick = () => {
    if (onMaximize) {
      onMaximize();
    }
  };

  return (
    <div className={containerClasses} onDoubleClick={handleDoubleClick}>
      <div className={styles.titleBarTitleWrapper}>
        <div className={styles.titleBarTitleIcon}>
          {icon ? icon : null}
        </div>
        <div className={styles.titleBarTitleLabel}>{title}</div>
      </div>

      <div className={styles.titleBarWindowControlsWrapper}>
        {/* Bouton Help (facultatif) */}
        {onHelp && (
          <WindowControl
            type="help"
            onClick={onHelp}
            isActive={isActive}
          />
        )}

        {/* Bouton Minimize (facultatif) */}
        {onMinimize && (
          <WindowControl
            type="minimize"
            onClick={onMinimize}
            isActive={isActive}
          />
        )}

        {/* Bouton Maximize/Restore (facultatif) */}
        {onMaximize && (
          isMaximized ? (
            <WindowControl
              type="restore"
              onClick={onMaximize}
              isActive={isActive}
            />
          ) : (
            <WindowControl
              type="maximize"
              onClick={onMaximize}
              isActive={isActive}
            />
          )
        )}

        {/* Bouton Close (facultatif) */}
        {onClose && (
          <WindowControl
            type="close"
            onClick={onClose}
            isActive={isActive}
          />
        )}
      </div>
    </div>
  );
};
