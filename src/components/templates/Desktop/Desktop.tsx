import React, { useEffect, useRef, useState } from 'react';
import { Window } from '../../organisms/Window/Window';
import { Taskbar } from '../../organisms/Taskbar/Taskbar';
import XPWallpaper from '../../../assets/xp-wallpaper.jpg'
import MyComputerIcon from '../../../assets/windows-icons/explorer.exe_14_100-9.png';
import MyDocumentsIcon from '../../../assets/windows-icons/shell32.dll_14_235-9.png';
import WindowsXPStartupSound from '../../../assets/sounds/windows-xp-startup.mp3';
import { DesktopIcon } from '../../atoms/DesktopIcon/DesktopIcon';

export const Desktop: React.FC = () => {
  const [windows, setWindows] = useState<Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    isOpen: boolean;
  }>>([
    {
      id: 'my-computer',
      title: 'My Computer',
      content: (
        <div className="p-4">
          <h2 className="text-lg mb-4">My Computer</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="text-white">{"[]"}</div>
              <span>Local Disk (C:)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-white">{"[]"}</div>
              <span>CD Drive (D:)</span>
            </div>
          </div>
        </div>
      ),
      isOpen: false
    },
    {
      id: 'my-documents',
      title: 'My Documents',
      content: (
        <div className="p-4">
          <h2 className="text-lg mb-4">My Documents</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="text-white">{"[]"}</div>
              <span>Document1.doc</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-white">{"[]"}</div>
              <span>Resume.pdf</span>
            </div>
          </div>
        </div>
      ),
      isOpen: false
    }
  ]);
  const xpStartupSoundAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    xpStartupSoundAudioRef.current = new Audio(WindowsXPStartupSound);
      
    // Exemple : on joue le beep au montage ou à un moment précis
    xpStartupSoundAudioRef.current.play().catch((err) => {
      console.log('Erreur lors de la lecture audio:', err);
    });
  }, [])

  const toggleWindow = (id: string) => {
    setWindows(windows.map(window => 
      window.id === id ? { ...window, isOpen: !window.isOpen } : window
    ));
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${XPWallpaper})`
      }}
    >
      <div className="">
        <DesktopIcon
          icon={<img src={MyComputerIcon} />}
          label="Poste de travail"
          onDoubleClick={() => toggleWindow('my-computer')}
        />
        <DesktopIcon
          icon={<img src={MyDocumentsIcon} />}
          label="Mes Documents"
          onDoubleClick={() => toggleWindow('my-documents')}
        />
        <DesktopIcon
          icon={<div className="text-white">{"[]"}</div>}
          label="Reboot Reboot Reboot Reboot Reboot"
          onDoubleClick={() => window.location.reload()}
        />
      </div>

      {windows.map(window => window.isOpen && (
        <Window
          key={window.id}
          title={window.title}
          onClose={() => toggleWindow(window.id)}
          initialPosition={{ x: 100 + Math.random() * 100, y: 100 + Math.random() * 100 }}
        >
          {window.content}
        </Window>
      ))}

      <Taskbar />
    </div>
  );
};