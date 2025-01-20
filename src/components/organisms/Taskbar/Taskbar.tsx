import React, { useEffect, useState } from 'react';
import StartButtonLogo from '../../../assets/start-button-logo.png';
import './Taskbar.css';
import moment from 'moment';

export const Taskbar: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date())

  useEffect(() => {
    const dateTimer = setInterval(() => setDate(new Date()), 1000)

    return () => clearInterval(dateTimer)
  }, [])

  return (
    <div id="taskbar">
      <button id="start-button">
        <img src={StartButtonLogo} style={{ display: 'inline-block', filter: 'drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.6))' }} />
        démarrer
      </button>
      <div id="taskbar-tools">
        {moment(date).format('HH:mm')}
      </div>
    </div>
  );
};