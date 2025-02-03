import React from 'react';
import styles from './MenuItem.module.scss';

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  shortcut?: string;
  variant?: 'xp';
  children?: React.ReactNode;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  shortcut,
  variant = 'xp',
  children,
  className,
  ...props
}) => {
  // Pour la variante "xp", on utilise la classe "xp-menu-item" du module SCSS.
  // Si un sous-menu est présent, on ajoute également la classe "has-submenu".
  const rootClasses = [
    styles.xpMenuItem,
    children ? styles.hasSubmenu : "",
    className || ""
  ].join(" ").trim();

  return (
    <div className={rootClasses} {...props}>
      <span className={styles.leftElement}></span>
      <span className={styles.label}>{label}</span>
      <span className={styles.shortcut}>{shortcut || ''}</span>
      <span className={styles.rightElement}></span>
      {children}
    </div>
  );
};
