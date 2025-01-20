import React from 'react';
import TaskbarBackgroundGradient from '../../../assets/taskbar-gradient.png';
import StartButtonDefaultBackgroundLeft from '../../../assets/start-button-default-background-left.png';
import StartButtonHoverBackgroundCenter from '../../../assets/start-button-default-background-center.png';
import StartButtonActiveBackgroundRight from '../../../assets/start-button-default-background-right.png';
import StartButtonLogo from '../../../assets/start-button-logo.png';

const startButtonStyles = {
  height: '30px',
  padding: '0 26px 0 6px',
  color: 'white',
  fontFamily: 'Franklin Gothic',
  fontSize: '19px',
  fontStyle: 'italic',
  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.6)',
  backgroundImage: `url(${StartButtonDefaultBackgroundLeft}), url(${StartButtonActiveBackgroundRight}), url(${StartButtonHoverBackgroundCenter})`,
  backgroundPosition: 'left top, right top, left top',
  backgroundRepeat: 'no-repeat, no-repeat',
  backgroundSize: 'contain, contain, calc(100% - 8px) 100%',
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
        <img src={StartButtonLogo} style={{ display: 'inline-block', filter: 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.6))' }} />
        démarrer
      </button>
      <div className="text-white text-sm">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};