import React from 'react';
import './MenuSeparator.css';

interface MenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'xp';
  className?: string;
}

export const MenuSeparator: React.FC<MenuSeparatorProps> = ({ variant = 'xp', className, ...props }) => {
  const variantClasses = {
    xp: "xp-menu-separator",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className ? className : ""}`}
      {...props}
    />
  );
};