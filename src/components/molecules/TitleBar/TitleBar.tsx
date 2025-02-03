import React from 'react';
import { WindowControl } from '../../atoms/WindowControl/WindowControl';
import styles from './TitleBar.module.scss';

interface TitleBarProps {
  title: string;
  icon?: React.ReactElement;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  isMaximized: boolean;
  isActive: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  icon,
  onMinimize,
  onMaximize,
  onClose,
  isMaximized,
  isActive,
}) => {
  // Application des classes du module SCSS pour le conteneur
  const containerClasses = [
    styles.titleBarContainer,
    isMaximized ? styles.maximized : "",
    isActive ? "" : styles.inactive
  ].join(" ").trim();

  return (
    <div className={containerClasses} onDoubleClick={onMaximize}>
      <div className={styles.titleBarTitleWrapper}>
        <div className={styles.titleBarTitleIcon}>
          {icon ? icon : null}
        </div>
        <div className={styles.titleBarTitleLabel}>{title}</div>
      </div>
      <div className={styles.titleBarWindowControlsWrapper}>
        <WindowControl type="minimize" onClick={onMinimize} isActive={isActive} />
        {isMaximized ? (
          <WindowControl type="restore" onClick={onMaximize} isActive={isActive} />
        ) : (
          <WindowControl type="maximize" onClick={onMaximize} isActive={isActive} />
        )}
        <WindowControl type="close" onClick={onClose} isActive={isActive} />
      </div>
    </div>
  );
};
