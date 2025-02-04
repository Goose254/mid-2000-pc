import React from 'react';
import styles from './FloatingMenu.module.scss';

interface FloatingMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'contextual' | 'startMenu';
  children: React.ReactNode;
  className?: string;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
  variant = 'contextual',
  children,
  className,
  ...props
}) => {
  // Pour l'instant, seule la variante 'xp' est gérée
  const baseClass = styles[variant];
  const combinedClasses = [baseClass, className].filter(Boolean).join(" ");

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};
