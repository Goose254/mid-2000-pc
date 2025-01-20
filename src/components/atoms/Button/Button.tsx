import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'xp' | 'bios';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'xp', children, ...props }) => {
  const baseClasses = "px-4 py-2 cursor-pointer";
  const variantClasses = {
    xp: "bg-gradient-to-b from-[#2584ff] to-[#0252cb] text-white border-[#003c96] hover:from-[#3d93ff] hover:to-[#0363ec] active:from-[#0363ec] active:to-[#0252cb] border rounded-lg shadow-sm",
    bios: "bg-black text-white font-mono hover:bg-gray-800 active:bg-gray-900"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};