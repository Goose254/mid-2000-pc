import React from 'react';
import { WindowControl } from '../../atoms/WindowControl/WindowControl';
import './TitleBar.css';

interface TitleBarProps {
  title: string;
  icon?: React.ReactElement;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  isMaximized: boolean;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title,
  icon,
  onMinimize,
  onMaximize,
  onClose,
  isMaximized,
}) => {
  return (
    <div className={`title-bar-container ${isMaximized && "maximized"}`} onDoubleClick={onMaximize}>
      <div className="title-bar-title-wrapper">
        <div className="title-bar-title-icon">{icon ? icon : ''}</div>
        <div className="title-bar-title-label">{title}</div>
      </div>
      <div className="title-bar-window-controls-wrapper">
        <WindowControl type="minimize" onClick={onMinimize} />
        {isMaximized ?
          <WindowControl type="restore" onClick={onMaximize} /> :
          <WindowControl type="maximize" onClick={onMaximize} />
        }
        <WindowControl type="close" onClick={onClose} />
      </div>
    </div>
  );
};