import React from 'react';
import './WindowToolbarMenuButton.css';

interface WindowToolbarMenuButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: 'xp';
  children: React.ReactNode;
  className?: string;
}

export const WindowToolbarMenuButton: React.FC<WindowToolbarMenuButtonProps> = ({ label, variant = 'xp', children, className, ...props }) => {
  const variantClasses = {
    xp: "xp-window-toolbar-menu-button",
  };

  return (
    <button
      className={`${variantClasses[variant]} ${className ? className : ""}`}
      {...props}
    >
      {label}
      {children}
    </button>
  );
};