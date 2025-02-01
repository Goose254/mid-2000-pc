import React from 'react';
import './MenuItem.css';

interface MenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'xp';
  children: React.ReactNode;
  className?: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({ variant = 'xp', children, className, ...props }) => {
  const variantClasses = {
    xp: "xp-menu-item",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className ? className : ""}`}
      {...props}
    >
      {children}
    </div>
  );
};