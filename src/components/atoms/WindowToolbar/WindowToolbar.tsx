import React from 'react';
import './WindowToolbar.css';

interface WindowToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'xp';
  children: React.ReactNode;
  className?: string;
}

export const WindowToolbar: React.FC<WindowToolbarProps> = ({ variant = 'xp', children, className, ...props }) => {
  const variantClasses = {
    xp: "xp-window-toolbar",
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className ? className : ""}`}
      {...props}
    >
      <div className="inner-container">
        {children}
      </div>
    </div>
  );
};