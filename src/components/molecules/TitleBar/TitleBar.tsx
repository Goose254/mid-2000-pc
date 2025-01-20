import React from 'react';
import { WindowControl } from '../../atoms/WindowControl/WindowControl';

interface TitleBarProps {
  title: string;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  onMinimize,
  onMaximize,
  onClose,
}) => {
  return (
    <div className="h-8 bg-gradient-to-r from-[#0a246a] via-[#3a6af0] to-[#0a246a] flex items-center justify-between px-2 select-none cursor-move">
      <span className="text-white text-sm">{title}</span>
      <div className="flex space-x-1">
        <WindowControl type="minimize" onClick={onMinimize} />
        <WindowControl type="maximize" onClick={onMaximize} />
        <WindowControl type="close" onClick={onClose} />
      </div>
    </div>
  );
};