import React from 'react';
import './MenuSeparator.css';

interface MenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'xp';
  direction?: 'vertical' | 'horizontal'
  className?: string;
}

export const MenuSeparator: React.FC<MenuSeparatorProps> = ({ variant = 'xp', direction = 'horizontal', className, ...props }) => {
  const variantClasses = {
    xp: "xp-menu-separator",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${direction} ${className ? className : ""}`}
      {...props}
    />
  );
};