import { useState } from 'react';

import { Desktop } from './components/templates/Desktop/Desktop';
import DisplayProvider from './contexts/Display/DisplayProvider';
import Display from './components/wrapper/Display';
import WindowsXPBootScreenCanvas from './components/templates/WindowsXPBootScreen/WindowsXPBootScreenCanvas';
import BiosScreenCanvas from './components/templates/BiosScreen/BiosScreenCanvas';

type BootStage = 'bios' | 'windows-boot' | 'desktop';

function App() {
  const [bootStage, setBootStage] = useState<BootStage>('bios');

  const renderStage = () => {
    switch (bootStage) {
      case 'bios':
        return <Display width={800} height={600}><BiosScreenCanvas onComplete={() => setBootStage('windows-boot')} /></Display>;
      case 'windows-boot':
        return <Display><WindowsXPBootScreenCanvas onComplete={() => setBootStage('desktop')} /></Display>;
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