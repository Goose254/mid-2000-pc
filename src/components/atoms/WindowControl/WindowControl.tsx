import React from 'react';
import styles from './WindowControl.module.scss';

interface WindowControlProps {
  type: 'minimize' | 'maximize' | 'restore' | 'help' | 'close';
  onClick: () => void;
  isActive: boolean;
}

export const WindowControl: React.FC<WindowControlProps> = ({ type, onClick, isActive }) => {
  const baseClass = [
    styles.titleBarButton,
    styles[type],
    isActive ? "" : styles.inactive,
  ].join(" ").trim();

  return (
    <button 
      className={baseClass}
      onClick={onClick}
    ></button>
  );
};
