import React, { useRef, useState } from 'react';
import { Window } from '../../organisms/Window/Window';
import { Taskbar } from '../../organisms/Taskbar/Taskbar';
import XPWallpaper from '../../../assets/xp-wallpaper.jpg'
import WindowsXPStartupSound from '../../../assets/sounds/windows-xp-startup.mp3';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onClick }) => (
  <div 
    className="w-20 flex flex-col items-center p-2 cursor-pointer text-white hover:bg-white/10"
    onClick={onClick}
  >
    <div className="text-4xl mb-1">{icon}</div>
    <div className="text-xs text-center">{label}</div>
  </div>
);

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

  // Une référence vers l'objet Audio (si vous voulez un beep à un moment précis)
  const xpStartupSoundAudioRef = useRef<HTMLAudioElement | null>(null);

  xpStartupSoundAudioRef.current = new Audio(WindowsXPStartupSound);
    
  // Exemple : on joue le beep au montage ou à un moment précis
  xpStartupSoundAudioRef.current.play().catch((err) => {
    console.log('Erreur lors de la lecture audio:', err);
  });

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
      <div className="p-4 grid grid-cols-4 gap-4">
        <DesktopIcon
          icon={<div className="text-white">{"[]"}</div>}
          label="My Computer"
          onClick={() => toggleWindow('my-computer')}
        />
        <DesktopIcon
          icon={<div className="text-white">{"[]"}</div>}
          label="My Documents"
          onClick={() => toggleWindow('my-documents')}
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