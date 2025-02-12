import React from 'react';
import styles from './WindowStatusBar.module.scss';

interface WindowStatusBarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'plain';
  children: React.ReactNode;
  className?: string;
}

export const WindowStatusBar: React.FC<WindowStatusBarProps> = ({
  variant = 'plain',
  children,
  className,
  ...props
}) => {
  const rootClasses = [styles.windowStatusBar, className, styles[variant]].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} {...props}>
      {children}
    </div>
  );
};
