import React from 'react';
import styles from './Button.module.scss';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'xp';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'xp',
  size = 'medium',
  children,
  className,
  ...props
}) => {
  // Pour la variante "xp", on utilise la classe "xp-button" du module SCSS.
  // On ajoute également la classe "small" si la taille est "small".
  const buttonClasses = `${styles.xpButton} ${size === 'small' ? styles.small : ''} ${className || ''}`.trim();

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};
