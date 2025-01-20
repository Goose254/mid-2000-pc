import React, { useEffect } from 'react';
import XPBootLogo from '../../../assets/xp-boot-logo.png'

export const WindowsXPBootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-full bg-black flex flex-col items-center justify-center">
      <div className="w-64 h-48 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={XPBootLogo}
            alt="Windows XP Logo"
            className="w-32"
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-[#315FAC] animate-bounce"></div>
          <div className="w-2 h-2 bg-[#315FAC] animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#315FAC] animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
};