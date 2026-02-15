import React from 'react';
import styles from './WindowToolbar.module.scss';

interface WindowToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'gradient' | 'plain';
  lastToolbar?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const WindowToolbar: React.FC<WindowToolbarProps> = ({
  variant = 'plain',
  lastToolbar = false,
  children,
  className,
  ...props
}) => {
  const rootClasses = [
    styles.xpWindowToolbar,
    styles[variant],
    lastToolbar ? styles.lastToolbar : '',
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClasses} {...props}>
      <div className={styles.innerContainer}>
        {children}
      </div>
    </div>
  );
};
