import React from 'react';
import styles from './WindowToolbarButton.module.scss';

interface WindowToolbarButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

export const WindowToolbarButton: React.FC<WindowToolbarButtonProps> = ({
  icon,
  label,
  children,
  className,
  ...props
}) => {
  // Récupération de la classe de base depuis le module SCSS
  const baseClass = styles.xpWindowToolbarButton;
  const combinedClasses = [baseClass, children ? styles.hasChildren : null, className].filter(Boolean).join(" ");

  return (
    <button className={combinedClasses} {...props}>
      <span className={styles.xpWindowToolbarButtonIcon}>
        <img src={icon} alt="Toolbar icon" />
      </span>
      {label && (
        <span className={styles.xpWindowToolbarButtonLabel}>
          {label}
        </span>
      )}
      {children && (
        <span className={styles.xpWindowToolbarButtonDropdownAddon}>▼</span>
      )}
      {children}
    </button>
  );
};
