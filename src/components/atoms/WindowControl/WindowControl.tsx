import React from 'react';

interface WindowControlProps {
  type: 'minimize' | 'maximize' | 'close';
  onClick: () => void;
}

export const WindowControl: React.FC<WindowControlProps> = ({ type, onClick }) => {
  const baseClasses = "p-1 hover:bg-opacity-20 rounded-sm";
  const variants = {
    minimize: "hover:bg-gray-200",
    maximize: "hover:bg-gray-200",
    close: "hover:bg-red-500 hover:text-white"
  };

  const icons = {
    minimize: "-",
    maximize: "[]",
    close: "X"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[type]}`}
      onClick={onClick}
    >
      {icons[type]}
    </button>
  );
};