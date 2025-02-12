import React from 'react';
import styles from './WindowToolbar.module.scss';

interface WindowToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'gradient' | 'plain';
  children: React.ReactNode;
  className?: string;
}

export const WindowToolbar: React.FC<WindowToolbarProps> = ({
  variant = 'plain',
  children,
  className,
  ...props
}) => {
  const rootClasses = [styles.xpWindowToolbar, className, styles[variant]].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} {...props}>
      <div className={styles.innerContainer}>
        {children}
      </div>
    </div>
  );
};
