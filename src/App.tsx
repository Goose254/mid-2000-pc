import { useEffect, useState } from 'react';

import { Desktop } from './components/templates/Desktop/Desktop';
import DisplayProvider from './contexts/Display/DisplayProvider';
import Display from './components/wrapper/Display';
import WindowsXPBootScreenCanvas from './components/templates/WindowsXPBootScreen/WindowsXPBootScreenCanvas';
import BiosScreenCanvas from './components/templates/BiosScreen/BiosScreenCanvas';
import BiosSetupCanvas from './components/templates/BiosSetup/BiosSetupCanvas';
import { WindowsXPSplashScreen } from './components/templates/WindowsXPSplashScreen/WindowsXPSplashScreen';
import { WindowsXPLogonScreen } from './components/templates/WindowsXPLogonScreen/WindowsXPLogonScreen';
import { WindowsXPLogoffScreen } from './components/templates/WindowsXPLogoffScreen/WindowsXPLogoffScreen';
import { WindowsXPShutdownScreen } from './components/templates/WindowsXPShutdownScreen/WindowsXPShutdownScreen';
import { WindowsBSODCanvas } from './components/templates/WindowsBSOD/WindowsBSODCanvas';
import { useSystemStore } from './common/stores/systemStore';
import { useUsersStore } from './common/stores/usersStore';
import 'overlayscrollbars/overlayscrollbars.css'
import { ClickScrollPlugin, OverlayScrollbars } from 'overlayscrollbars';
import { WindowsXpArrowsPlugin } from '@/plugins/OverlayScrollbars/WindowsXpArrowsPlugin';
import '@/plugins/OverlayScrollbars/WindowsXpArrowsPlugin.css';

OverlayScrollbars.plugin(ClickScrollPlugin);
OverlayScrollbars.plugin(WindowsXpArrowsPlugin);

export type BootStage =
  | 'bios'
  | 'bios-setup'
  | 'windows-boot'
  | 'logon'
  | 'windows-splash-screen'
  | 'desktop'
  | 'logoff'
  | 'shutting-down'
  | 'bsod'
  | 'poweroff';

function App() {
  const [bootStage, setBootStage] = useState<BootStage>('bios');

  const sessionRequest = useSystemStore((state) => state.sessionRequest);
  const clearSessionRequest = useSystemStore((state) => state.clearSessionRequest);
  const bsodProcessName = useSystemStore((state) => state.bsodProcessName);
  const clearBsod = useSystemStore((state) => state.clearBsod);
  const logout = useUsersStore((state) => state.logout);

  // Pont store -> machine à états : l'overlay d'arrêt et le menu Démarrer
  // publient une demande de session ; on la traduit ici en transition d'écran.
  useEffect(() => {
    if (!sessionRequest) return;

    if (sessionRequest === 'logoff') {
      setBootStage('logoff');
    } else {
      // 'shutdown' comme 'restart' passent par l'écran « Windows va s'arrêter… ».
      setBootStage('shutting-down');
    }
  }, [sessionRequest]);

  // Pont BSOD : la terminaison d'un processus système critique (Gestionnaire des
  // tâches) déclenche l'écran bleu, quel que soit l'écran courant.
  useEffect(() => {
    if (bsodProcessName) {
      setBootStage('bsod');
    }
  }, [bsodProcessName]);

  const renderStage = () => {
    switch (bootStage) {
      case 'bios':
        return <Display width={800} height={600}><BiosScreenCanvas onComplete={(bootStage = 'bios') => setBootStage(bootStage)} /></Display>;
      case 'bios-setup':
        return <Display width={640} height={400}><BiosSetupCanvas onExit={() => setBootStage('bios')} /></Display>;
      case 'windows-boot':
        // Après le boot Windows, on arrive sur l'écran de logon (et non plus
        // directement sur le splash + bureau).
        return <Display><WindowsXPBootScreenCanvas onComplete={() => setBootStage('logon')} /></Display>;
      case 'logon':
        return (
          <WindowsXPLogonScreen
            onLogin={() => setBootStage('windows-splash-screen')}
            onPowerOff={() => setBootStage('poweroff')}
          />
        );
      case 'windows-splash-screen':
        return <WindowsXPSplashScreen onComplete={(bootStage = 'bios') => setBootStage(bootStage)} />;
      case 'desktop':
        return <Desktop />;
      case 'logoff':
        // « Fermer la session » : fermeture puis retour au logon.
        return (
          <WindowsXPLogoffScreen
            variant="logoff"
            onComplete={() => {
              logout();
              clearSessionRequest();
              setBootStage('logon');
            }}
          />
        );
      case 'shutting-down': {
        // Arrêt -> écran d'extinction ; redémarrage -> retour au BIOS (reboot
        // in-app, sans location.reload, ce qui préserve le localStorage).
        const isRestart = sessionRequest === 'restart';
        return (
          <WindowsXPLogoffScreen
            variant="shutdown"
            onComplete={() => {
              logout();
              clearSessionRequest();
              setBootStage(isRestart ? 'bios' : 'poweroff');
            }}
          />
        );
      }
      case 'bsod':
        // Écran bleu rendu au canvas et enveloppé dans Display (comme le BIOS)
        // pour obtenir le ratio 4:3 et le flou CRT ; puis redémarrage vers le
        // BIOS (reboot in-app).
        return (
          <Display width={640} height={480}>
            <WindowsBSODCanvas
              processName={bsodProcessName ?? 'csrss.exe'}
              onComplete={() => {
                logout();
                clearBsod();
                clearSessionRequest();
                setBootStage('bios');
              }}
            />
          </Display>
        );
      case 'poweroff':
        return <WindowsXPShutdownScreen onPowerOn={() => setBootStage('bios')} />;
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
