import React from 'react';
import styles from './StatusBarItem.module.scss';

interface StatusBarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'plain';
  children: React.ReactNode;
  className?: string;
}

export const StatusBarItem: React.FC<StatusBarItemProps> = ({
  variant = 'plain',
  children,
  className,
  ...props
}) => {
  const rootClasses = [styles.statusBarItem, className, styles[variant]].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} {...props}>
      {children}
    </div>
  );
};
