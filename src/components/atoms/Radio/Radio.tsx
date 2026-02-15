import React from 'react';
import styles from './Radio.module.scss';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  className?: string;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  className,
  disabled,
  ...props
}) => {
  const rootClasses = [styles.radioRoot, className || ''].join(' ').trim();

  return (
    <label className={rootClasses}>
      <input type="radio" className={styles.radioInput} disabled={disabled} {...props} />
      <span className={styles.radioIndicator} aria-hidden="true" />
      {label && <span className={styles.radioLabel}>{label}</span>}
    </label>
  );
};
