import React from 'react';
import './WindowToolbarButton.css';

interface WindowToolbarButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  icon: string
  label?: string;
  variant?: 'xp';
  children?: React.ReactNode;
  className?: string;
}

export const WindowToolbarButton: React.FC<WindowToolbarButtonProps> = ({ icon, label, variant = 'xp', children, className, ...props }) => {
  const variantClasses = {
    xp: "xp-window-toolbar-button",
  };

  return (
    <button
      className={`${variantClasses[variant]} ${className ? className : ""}`}
      {...props}
    >
      <span className="xp-window-toolbal-button-icon">
        <img src={icon} />
      </span>
      {label && (
        <span className="xp-window-toolbal-button-label">
          {label}
        </span>
      )}
      {children && (
        <span className="xp-window-toolbal-button-dropdown-addon">▼</span>
      )}
      {children}
    </button>
  );
};