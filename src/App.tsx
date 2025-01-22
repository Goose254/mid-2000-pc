import { useState } from 'react';

import { Desktop } from './components/templates/Desktop/Desktop';
import DisplayProvider from './contexts/Display/DisplayProvider';
import Display from './components/wrapper/Display';
import WindowsXPBootScreenCanvas from './components/templates/WindowsXPBootScreen/WindowsXPBootScreenCanvas';
import BiosScreenCanvas from './components/templates/BiosScreen/BiosScreenCanvas';
import BiosSetupCanvas from './components/templates/BiosSetup/BiosSetupCanvas';
import { WindowsXPSplashScreen } from './components/templates/WindowsXPSplashScreen/WindowsXPSplashScreen';

export type BootStage = 'bios' | 'bios-setup' | 'windows-splash-screen' | 'windows-boot' | 'desktop';

function App() {
  const [bootStage, setBootStage] = useState<BootStage>('bios');

  const renderStage = () => {
    switch (bootStage) {
      case 'bios':
        return <Display width={800} height={600}><BiosScreenCanvas onComplete={(bootStage = 'bios') => setBootStage(bootStage)} /></Display>;
      case 'bios-setup':
        return <Display width={640} height={400}><BiosSetupCanvas onExit={() => setBootStage('bios')} /></Display>;
      case 'windows-boot':
        return <Display><WindowsXPBootScreenCanvas onComplete={(bootStage = 'bios') => setBootStage(bootStage)} /></Display>;
      case 'windows-splash-screen':
        return <WindowsXPSplashScreen onComplete={(bootStage = 'bios') => setBootStage(bootStage)} />;
      case 'desktop':
        return <Desktop />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <DisplayProvider>
        {renderStage()}
      </DisplayProvider>
    </div>
  );
}

export default App;