import React from 'react';
import styles from './Checkbox.module.scss';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  className,
  disabled,
  ...props
}) => {
  const rootClasses = [styles.checkboxRoot, className || ''].join(' ').trim();

  return (
    <label className={rootClasses}>
      <input type="checkbox" className={styles.checkboxInput} disabled={disabled} {...props} />
      <span className={styles.checkboxIndicator} aria-hidden="true" />
      {label && <span className={styles.checkboxLabel}>{label}</span>}
    </label>
  );
};
