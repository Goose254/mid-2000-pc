import React from 'react';
import styles from './MenuItem.module.scss';

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  icon?: string;
  iconElement?: React.ReactNode;
  info?: string;
  variant?: 'contextual' | 'startPrimary' | 'startSecondary';
  primary?: boolean
  children?: React.ReactNode;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  icon,
  iconElement,
  info,
  variant = 'contextual',
  primary = false,
  children,
  className,
  ...props
}) => {
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
        {iconElement ? iconElement : ''}
      </span>
      <span className={labelClasses}>{label}</span>
      <span className={styles.info}>{info || ''}</span>
      <span className={styles.rightElement}></span>
      {children}
    </div>
  );
};
