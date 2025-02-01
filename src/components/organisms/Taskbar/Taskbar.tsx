import React, { useEffect, useRef, useState } from 'react';
import StartButtonLogo from '../../../assets/start-button-logo.png';
import './Taskbar.css';
import moment from 'moment';
import { StartMenu } from '../StartMenu/StartMenu';
import { TaskbarButton } from '../../atoms/TaskbarButton/TaskbarButton';
import { useDesktopStore } from '../../../stores/Desktop/useDesktopStore';

type TaskbarProps = {
  windows: Array<{
    id: string;
    title: string;
    icon?: React.ReactElement;
    isMinimized: boolean;
    isActive: boolean;
  }>;
  onClickWindowIcon: (id: string) => void;
};

export const Taskbar: React.FC<TaskbarProps> = ({ windows, onClickWindowIcon }) => {
  const [date, setDate] = useState<Date>(new Date())
  const startMenuRef = useRef<HTMLDivElement | null>(null)
  const startButtonRef = useRef<HTMLButtonElement | null>(null)

  const toggleStartMenu = useDesktopStore(
    (state) => state.toggleStartMenu
  );

  const isStartMenuVisible = useDesktopStore(
    (state) => state.isStartMenuVisible
  );

  useEffect(() => {
    const dateTimer = setInterval(() => setDate(new Date()), 1000)

    const handleClickOutsideStartMenu = (e: MouseEvent) => {
      if (
        startMenuRef.current && !startMenuRef.current.contains(e.target as Node) &&
        startButtonRef.current && !startButtonRef.current.contains(e.target as Node)
      ) {
        toggleStartMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutsideStartMenu)

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideStartMenu)
      clearInterval(dateTimer)
    }
  }, [startMenuRef, startButtonRef, toggleStartMenu])

  return (
    <div id="taskbar">
      <StartMenu ref={startMenuRef} isVisible={isStartMenuVisible} />

      <button ref={startButtonRef} id="start-button" className={isStartMenuVisible ? 'active' : ''} onClick={() => toggleStartMenu()}>
        <img src={StartButtonLogo} />
        démarrer
      </button>

      <div className="taskbar-window-buttons">
        {windows.map((win) => (
          <TaskbarButton key={win.id} window={win} onMouseDown={onClickWindowIcon} />
        ))}
      </div>

      <div id="taskbar-tools">
        {moment(date).format('HH:mm')}
      </div>
    </div>
  );
};