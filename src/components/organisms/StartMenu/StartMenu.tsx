import React from 'react';
import styles from './StartMenu.module.scss';

import { useOverlaysStore } from '@/common/stores/overlaysStore';
import { useStartMenuStore } from '@/common/stores/startMenuStore';
import { useSystemStore } from '@/common/stores/systemStore';
import { useCurrentUser } from '@/common/stores/usersStore';
import { useAppsStore } from '@/common/stores/appsStore';
import { getStartMenuShortcut, StartMenuSlot } from '@/apps/registry';
import { Avatar } from '@/components/atoms/Avatar/Avatar';

import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';

import CloseSessionIcon from '@/assets/windows-icons/shell32.dll_14_45-10.png';
import ShutdownComputerIcon from '@/assets/windows-icons/shell32.dll_14_28-10.png';
import IEIcon from '@/assets/program-icons/IEXPLORE.EXE_14_32528-7.png';
import OEIcon from '@/assets/program-icons/msoeres.dll_14_52-7.png';
import WMPIcon from '@/assets/program-icons/setup_wm.exe_14_71-7.png';
import TourIcon from '@/assets/windows-icons/tourstrt.exe_14_100-7.png';
import MSNIcon from '@/assets/windows-icons/shell32.dll_14_239-7.png';
import WMMIcon from '@/assets/program-icons/WMM2RES.dll_14_128-7.png';
import CalcIcon from '@/assets/windows-icons/calc.exe_14_SC-6.png';
import WABIcon from '@/assets/program-icons/wab32res.dll_14_1911-6.png';

import MyRecentDocumentsIcon from '@/assets/windows-icons/shell32.dll_14_21-9.png';
import DefaultProgramsIcon from '@/assets/windows-icons/moricons.dll_14_114-10.png';
import PrintersIcon from '@/assets/windows-icons/shell32.dll_14_138-9.png';
import HelpAndSupportIcon from '@/assets/windows-icons/shell32.dll_14_263-10.png';
import SearchIcon from '@/assets/windows-icons/shell32.dll_14_23-10.png';
import RunIcon from '@/assets/windows-icons/shell32.dll_14_160-9.png';

import WindowsActivationSmallIcon from '@/assets/windows-icons/migpwd.exe_14_103-6.png';
import WindowsCatalogSmallIcon from '@/assets/windows-icons/moricons.dll_14_108-8.png';
import DefaultProgramsSmallIcon from '@/assets/windows-icons/moricons.dll_14_114-11.png';
import WindowsUpdateSmallIcon from '@/assets/windows-icons/shell32.dll_14_47-8.png';

import ProgramFolderSmallIcon from '@/assets/windows-icons/shell32.dll_14_20-8.png';
import IESmallIcon from '@/assets/windows-icons/iexplore.exe_14_32528-8.png';
import WMPSmallIcon from '@/assets/windows-icons/wmplayer.exe_14_IDR_MAINFRAME-8.png';
import OESmallIcon from '@/assets/windows-icons/msoeres.dll_14_52-8.png';
import MSNSmallIcon from '@/assets/windows-icons/shell32.dll_14_239-8.png';
import WMMSmallIcon from '@/assets/windows-icons/wmm2res.dll_14_128-8.png';

import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { openRunDialog } from '@/components/organisms/RunDialog/openRunDialog';

interface StartMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  isVisible: boolean;
}

export const StartMenu = React.forwardRef<HTMLDivElement, StartMenuProps>(
  ({ isVisible, ...divProps }, ref) => {
    const toggleStartMenu = useStartMenuStore((state) => state.toggleStartMenu);
    const toggleShutdownOverlay = useOverlaysStore((state) => state.toggleShutdownOverlay);
    const requestLogoff = useSystemStore((state) => state.requestLogoff);
    const launchApp = useAppsStore((state) => state.launchApp);
    const currentUser = useCurrentUser();

    const handleShutdownOverlayShow = () => {
      toggleShutdownOverlay();
      toggleStartMenu();
    };

    const handleLogoff = () => {
      requestLogoff();
      toggleStartMenu();
    };

    const openUserAccounts = () => {
      launchApp('nusrmgr.cpl');
      toggleStartMenu();
    };

    const openRun = () => {
      openRunDialog();
      toggleStartMenu();
    };

    // Entrée de la colonne de droite tenue par une application : le libellé,
    // l'icône et l'application à lancer viennent du registre.
    const renderAppEntry = (slot: StartMenuSlot, primary = false) => {
      const shortcut = getStartMenuShortcut(slot);
      if (!shortcut) return null;

      return (
        <MenuItem
          variant="startSecondary"
          label={shortcut.label}
          icon={shortcut.icon}
          primary={primary}
          onClick={() => {
            launchApp(shortcut.appId, shortcut.args);
            toggleStartMenu();
          }}
        />
      );
    };

    return (
      <>
        {isVisible && (
          <div className={styles.startMenu} ref={ref} {...divProps}>
            <button type="button" className={styles.startMenuAccount} onClick={openUserAccounts}>
              <div className={styles.startMenuAvatar}>
                <Avatar
                  avatar={currentUser?.avatar ?? 'chess'}
                  name={currentUser?.name ?? 'Utilisateur'}
                />
              </div>
              <div className={styles.startMenuAccountName}>{currentUser?.name ?? 'Utilisateur'}</div>
            </button>
            <div className={styles.startMenuLists}>
              <div className={styles.startMenuLeftList}>
                <MenuItem variant="startPrimary" label="Internet" info="Internet Explorer" icon={IEIcon} primary={true} />
                <MenuItem variant="startPrimary" label="Courrier électronique" info="Outlook Express" icon={OEIcon} primary={true} />
                <MenuSeparator variant="startPrimary" />
                <MenuItem variant="startPrimary" label="Lecteur Windows Media" icon={WMPIcon} />
                <MenuItem variant="startPrimary" label="Visite guidée de Windows XP" icon={TourIcon} />
                <MenuItem variant="startPrimary" label="MSN" icon={MSNIcon} />
                <MenuItem variant="startPrimary" label="Windows Movie Maker" icon={WMMIcon} />
                <MenuItem variant="startPrimary" label="Calculatrice" icon={CalcIcon} />
                <MenuItem variant="startPrimary" label="Carnet d'adresses" icon={WABIcon} />
                <MenuSeparator variant="startPrimary" />
                <MenuItem variant="startPrimary" label="Tous les programmes">
                  <FloatingMenu variant="startMenu">
                    <MenuItem label="Activation de Windows" icon={WindowsActivationSmallIcon}></MenuItem>
                    <MenuItem label="Catalogue Windows" icon={WindowsCatalogSmallIcon}></MenuItem>
                    <MenuItem label="Configurer les programmes par défaut" icon={DefaultProgramsSmallIcon}></MenuItem>
                    <MenuItem label="Windows Update" icon={WindowsUpdateSmallIcon}></MenuItem>
                    <MenuSeparator variant="startPrimaryContextual"/>
                    <MenuItem label="Accessoires" icon={ProgramFolderSmallIcon}></MenuItem>
                    <MenuItem label="Démarrage" icon={ProgramFolderSmallIcon}></MenuItem>
                    <MenuItem label="Jeux" icon={ProgramFolderSmallIcon}></MenuItem>
                    <MenuItem label="Internet Explorer" icon={IESmallIcon}></MenuItem>
                    <MenuItem label="Lecteur Windows Media" icon={WMPSmallIcon}></MenuItem>
                    <MenuItem label="Outlook Express" icon={OESmallIcon}></MenuItem>
                    <MenuItem label="MSN" icon={MSNSmallIcon}></MenuItem>
                    <MenuItem label="Windows Movie Maker" icon={WMMSmallIcon}></MenuItem>
                  </FloatingMenu>
                </MenuItem>
              </div>
              <div className={styles.startMenuRightList}>
                {renderAppEntry('my-documents', true)}
                <MenuItem variant="startSecondary" label="Mes documents récents" icon={MyRecentDocumentsIcon} primary={true} />
                {renderAppEntry('my-pictures', true)}
                {renderAppEntry('my-music', true)}
                {renderAppEntry('my-computer', true)}
                <MenuSeparator variant="startSecondary" />
                {renderAppEntry('control-panel')}
                <MenuItem variant="startSecondary" label="Configurer les programmes par défaut" icon={DefaultProgramsIcon} />
                <MenuItem variant="startSecondary" label="Imprimantes et télécopieurs" icon={PrintersIcon} />
                <MenuSeparator variant="startSecondary" />
                <MenuItem variant="startSecondary" label="Aide et support" icon={HelpAndSupportIcon} />
                <MenuItem variant="startSecondary" label="Rechercher" icon={SearchIcon} />
                <MenuItem variant="startSecondary" label="Exécuter..." icon={RunIcon} onClick={() => openRun()} />
              </div>
            </div>
            <div className={styles.startMenuActions}>
              <button onClick={handleLogoff}>
                <img src={CloseSessionIcon} alt="Close session" /> Fermer la session
              </button>
              <button onClick={handleShutdownOverlayShow}>
                <img src={ShutdownComputerIcon} alt="Shutdown computer" /> Arrêter l'ordinateur
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
);
