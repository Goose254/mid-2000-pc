import React from 'react';
import './WindowControl.css'

interface WindowControlProps {
  type: 'minimize' | 'maximize' | 'restore' | 'help' | 'close';
  onClick: () => void;
}

export const WindowControl: React.FC<WindowControlProps> = ({ type, onClick }) => {
  const baseClasses = "title-bar-button";
  const variants = {
    minimize: "minimize",
    maximize: "maximize",
    restore: "restore",
    help: "help",
    close: "close"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[type]}`}
      onClick={onClick}
    ></button>
  );
};