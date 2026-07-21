import React from 'react';
import styles from './WindowToolbarMenuButton.module.scss';

interface WindowToolbarMenuButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const WindowToolbarMenuButton: React.FC<WindowToolbarMenuButtonProps> = ({
  label,
  children,
  className,
  ...props
}) => {
  const baseClass = styles.xpWindowToolbarMenuButton;
  const combinedClasses = [baseClass, className].filter(Boolean).join(" ");

  return (
    <button className={combinedClasses} {...props}>
      {label}
      {children}
    </button>
  );
};
