import React from 'react';
import styles from './Textarea.module.scss';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ className, ...props }) => {
  const textareaClasses = [styles.xpTextarea, className || ''].join(' ').trim();

  return <textarea className={textareaClasses} {...props} />;
};
