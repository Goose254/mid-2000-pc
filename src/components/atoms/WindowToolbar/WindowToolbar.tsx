import React from 'react';
import styles from './WindowToolbar.module.scss';

interface WindowToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'xp';
  children: React.ReactNode;
  className?: string;
}

export const WindowToolbar: React.FC<WindowToolbarProps> = ({
  variant = 'xp',
  children,
  className,
  ...props
}) => {
  // Pour l'instant, seule la variante 'xp' est gérée
  const rootClasses = [styles.xpWindowToolbar, className].filter(Boolean).join(" ");

  return (
    <div className={rootClasses} {...props}>
      <div className={styles.innerContainer}>
        {children}
      </div>
    </div>
  );
};
