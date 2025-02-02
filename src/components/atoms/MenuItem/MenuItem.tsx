import React from 'react';
import './MenuItem.css';

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  shortcut?: string;
  variant?: 'xp';
  children?: React.ReactNode;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({ label, shortcut, variant = 'xp', children, className, ...props }) => {
  const variantClasses = {
    xp: "xp-menu-item",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${children ? "has-submenu" : ""} ${className ? className : ""}`}
      {...props}
    >
      <span className="left-element"></span>
      <span className="label">{label}</span>
      <span className="shortcut">{shortcut ? shortcut : ''}</span>
      <span className="right-element"></span>
      {children}
    </div>
  );
};