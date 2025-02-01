import React from 'react';
import './FloatingMenu.css';

interface FloatingMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'xp';
  children: React.ReactNode;
  className?: string;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({ variant = 'xp', children, className, ...props }) => {
  const variantClasses = {
    xp: "xp-floating-menu",
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