import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'xp';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'xp', size = 'medium', children, className, ...props }) => {
  const variantClasses = {
    xp: "xp-button",
  };
  const sizeClasses = {
    small: "small",
    medium: "medium",
    large: "large",
  }

  return (
    <button 
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};