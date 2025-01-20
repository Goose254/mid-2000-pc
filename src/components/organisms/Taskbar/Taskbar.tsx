import React from 'react';
import TaskbarBackgroundGradient from '../../../assets/taskbar-gradient.png';
import StartButtonDefaultBackground from '../../../assets/start-button-default-background.png';
import StartButtonHoverBackground from '../../../assets/start-button-hover-background.png';
import StartButtonActiveBackground from '../../../assets/start-button-active-background.png';

const startButtonStyles = {
  width: '130px',
  color: 'white',
  fontFamily: 'Franklin Gothic',
  fontSize: '19px',
  fontStyle: 'italic',
  textShadow: '2px 2px 5px rgba(0, 0, 0, 0.5)',
  background: `url(${StartButtonDefaultBackground})`,
}

const taskbarStyles = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  width: '100vw',
  height: '30px',
  background: `url(${TaskbarBackgroundGradient}) repeat-x`,
}

export const Taskbar: React.FC = () => {
  return (
    <div style={taskbarStyles}>
      <button style={startButtonStyles}>
        démarrer
      </button>
      <div className="flex-1 border-l border-[#1042B8] ml-2"></div>
      <div className="text-white text-sm">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};