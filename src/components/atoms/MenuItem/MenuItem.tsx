import React from 'react';
import styles from './MenuItem.module.scss';

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon?: string;
  info?: string;
  variant?: 'contextual' | 'startPrimary' | 'startSecondary';
  primary?: boolean
  children?: React.ReactNode;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  icon,
  info,
  variant = 'contextual',
  primary = false,
  children,
  className,
  ...props
}) => {
  // Pour la variante "xp", on utilise la classe "xp-menu-item" du module SCSS.
  // Si un sous-menu est présent, on ajoute également la classe "has-submenu".
  const rootClasses = [
    styles[variant],
    children ? styles.hasSubmenu : "",
    className || ""
  ].join(" ").trim();

  const labelClasses = [
    styles.label,
    primary ? styles.primary : "",
  ].join(" ").trim()

  return (
    <div className={rootClasses} {...props}>
      <span className={styles.leftElement}>
        {icon && <img src={icon} />}
      </span>
      <span className={labelClasses}>{label}</span>
      <span className={styles.info}>{info || ''}</span>
      <span className={styles.rightElement}></span>
      {children}
    </div>
  );
};
