import React from 'react';
import styles from './FloatingMenu.module.scss';

interface FloatingMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'xp';
  children: React.ReactNode;
  className?: string;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
  variant = 'xp',
  children,
  className,
  ...props
}) => {
  // Pour l'instant, seule la variante 'xp' est gérée
  const baseClass = styles.xpFloatingMenu;
  const combinedClasses = [baseClass, className].filter(Boolean).join(" ");

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};
