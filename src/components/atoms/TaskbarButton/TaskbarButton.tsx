import React from 'react';
import styles from './TaskbarButton.module.scss';

interface TaskbarButtonProps {
  window: {
    id: string;
    title: string;
    icon?: React.ReactElement;
    isMinimized: boolean;
    isActive: boolean;
  };
  onMouseDown: (id: string) => void;
}

export const TaskbarButton: React.FC<TaskbarButtonProps> = ({ window, onMouseDown }) => {
  const handleMouseDown = (id: string) => {
    onMouseDown(id);
  };

  return (
    <div
      onMouseDown={() => handleMouseDown(window.id)}
      className={`${styles.taskbarButton} ${window.isActive ? styles.active : ""}`}
      data-window-id={window.id}
    >
      <div className={styles.taskbarButtonContent}>
        {window.icon && <div className={styles.taskbarButtonIcon}>{window.icon}</div>}
        <div className={styles.taskbarButtonContentLabel}>{window.title}</div>
      </div>
    </div>
  );
};
