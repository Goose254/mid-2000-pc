import React from 'react';
import styles from './MenuSeparator.module.scss';

interface MenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'contextual' | 'startPrimary' | 'startSecondary' | 'startPrimaryContextual';
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export const MenuSeparator: React.FC<MenuSeparatorProps> = ({
  variant = 'contextual',
  direction = 'horizontal',
  className,
  ...props
}) => {
  // Pour la variante "xp", on utilise la classe "xp-menu-separator" du module SCSS
  // et on ajoute la classe correspondant à la direction ("horizontal" ou "vertical").
  const rootClasses = [
    styles[variant],
    styles[direction],
    className || ""
  ].join(" ").trim();

  return <div className={rootClasses} {...props} />;
};
