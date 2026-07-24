import React, { useEffect, useState } from 'react';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { WindowStatusBar } from '@/components/atoms/WindowStatusBar/WindowStatusBar';
import { StatusBarItem } from '@/components/atoms/StatusBarItem/StatusBarItem';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { useSystemStore } from '@/common/stores/systemStore';
import { useUsersStore } from '@/common/stores/usersStore';

import ResizeDots from '@/assets/resize-dots.png';
import { TaskManagerApplicationsTab } from './Tabs/ApplicationsTab';
import { TaskManagerProcessesTab } from './Tabs/ProcessesTab';
import { TaskManagerPerformanceTab } from './Tabs/PerformanceTab';
import { TaskManagerNetworkTab } from './Tabs/NetworkTab';
import { TaskManagerUsersTab } from './Tabs/UsersTab';
import { AboutDialog, SelectColumnsDialog } from './dialogs/TaskManagerDialogs';

import { getRefreshIntervalMs, RefreshRate, useTaskManagerStore } from '../stores/taskManagerStore';
import { formatMo } from '../utils/processMetrics';
import { openRunDialog } from '../utils/openRunDialog';

interface TaskManagerMainWindowProps {
  taskManagerWindowId: string;
}

/** Les menus de la barre d'outils restent ouverts tant que le bouton a le
 *  focus ; cliquer un élément le blure pour les refermer (comme le Démineur). */
const closeMenu = () => {
  (document.activeElement as HTMLElement | null)?.blur();
};

/** Coche affichée en regard d'une option activée. */
const menuCheck = (on: boolean): React.ReactNode => (on ? <span>✓</span> : undefined);

export const TaskManagerMainWindow: React.FC<TaskManagerMainWindowProps> = ({ taskManagerWindowId }) => {
  const metrics = useTaskManagerStore((state) => state.metrics);
  const refreshRate = useTaskManagerStore((state) => state.refreshRate);
  const setRefreshRate = useTaskManagerStore((state) => state.setRefreshRate);
  const tick = useTaskManagerStore((state) => state.tick);
  const activeTabIndex = useTaskManagerStore((state) => state.activeTabIndex);
  const setActiveTabIndex = useTaskManagerStore((state) => state.setActiveTabIndex);

  const requestShutdown = useSystemStore((state) => state.requestShutdown);
  const requestRestart = useSystemStore((state) => state.requestRestart);
  const requestLogoff = useSystemStore((state) => state.requestLogoff);

  const currentUserName = useUsersStore((state) => {
    const user = state.users.find((candidate) => candidate.id === state.currentUserId);
    return user?.name ?? 'Utilisateur';
  });

  // Bascules cosmétiques du menu Options (état réel, coche/décoche fonctionnelle).
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [minimizeOnUse, setMinimizeOnUse] = useState(false);
  const [hideWhenMinimized, setHideWhenMinimized] = useState(true);
  const [show16Bit, setShow16Bit] = useState(true);

  // Boîtes de dialogue ouvertes depuis les menus du haut.
  const [activeDialog, setActiveDialog] = useState<'about' | 'columns' | null>(null);

  // Boucle d'actualisation : un seul rythme pilote toutes les métriques
  // (barre d'état, onglet Processus, Performances, Mise en réseau).
  useEffect(() => {
    tick(); // valeurs immédiates au montage / changement de fréquence
    const intervalMs = getRefreshIntervalMs(refreshRate);
    if (intervalMs <= 0) return; // « En pause »
    const intervalId = setInterval(() => tick(), intervalMs);
    return () => clearInterval(intervalId);
  }, [refreshRate, tick]);

  const closeTaskManager = () => useWindowsStore.getState().closeWindow(taskManagerWindowId);

  // Indicateur (•) sur le rythme d'actualisation actif.
  const rateMarker = (rate: RefreshRate): string | undefined => (refreshRate === rate ? '•' : undefined);

  // « Toujours visible » : à l'activation, on ramène la fenêtre au premier plan
  // (l'épinglage complet dépasse le périmètre, mais l'état est réel et mémorisé).
  const toggleAlwaysOnTop = () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    if (next) useWindowsStore.getState().bringToFront(taskManagerWindowId);
  };

  return (
    <>
      <WindowToolbar>
        <WindowToolbarMenuButton label="Fichier">
          <FloatingMenu>
            <MenuItem label="Nouvelle tâche (Exécuter...)" onClick={() => { closeMenu(); openRunDialog(); }} />
            <MenuSeparator />
            <MenuItem label="Quitter le Gestionnaire des tâches" onClick={() => { closeMenu(); closeTaskManager(); }} />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Options">
          <FloatingMenu>
            <MenuItem
              label="Toujours visible"
              iconElement={menuCheck(alwaysOnTop)}
              onClick={() => { closeMenu(); toggleAlwaysOnTop(); }}
            />
            <MenuItem
              label="Réduire lors de l'utilisation"
              iconElement={menuCheck(minimizeOnUse)}
              onClick={() => { closeMenu(); setMinimizeOnUse((value) => !value); }}
            />
            <MenuItem
              label="Masquer lorsque réduit"
              iconElement={menuCheck(hideWhenMinimized)}
              onClick={() => { closeMenu(); setHideWhenMinimized((value) => !value); }}
            />
            <MenuItem
              label="Afficher les processus 16 bits"
              iconElement={menuCheck(show16Bit)}
              onClick={() => { closeMenu(); setShow16Bit((value) => !value); }}
            />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Affichage">
          <FloatingMenu>
            <MenuItem label="Actualiser maintenant" onClick={() => { closeMenu(); tick(); }} />
            <MenuItem label="Fréquence d'actualisation">
              <FloatingMenu>
                <MenuItem label="Haute" info={rateMarker('high')} onClick={() => { closeMenu(); setRefreshRate('high'); }} />
                <MenuItem label="Normale" info={rateMarker('normal')} onClick={() => { closeMenu(); setRefreshRate('normal'); }} />
                <MenuItem label="Basse" info={rateMarker('low')} onClick={() => { closeMenu(); setRefreshRate('low'); }} />
                <MenuItem label="En pause" info={rateMarker('paused')} onClick={() => { closeMenu(); setRefreshRate('paused'); }} />
              </FloatingMenu>
            </MenuItem>
            <MenuSeparator />
            <MenuItem label="Sélectionner les colonnes..." onClick={() => { closeMenu(); setActiveDialog('columns'); }} />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Arrêter">
          <FloatingMenu>
            <MenuItem label="Mettre en veille" aria-disabled />
            <MenuItem label="Mettre en veille prolongée" aria-disabled />
            <MenuSeparator />
            <MenuItem label="Arrêter" onClick={() => { closeMenu(); requestShutdown(); }} />
            <MenuItem label="Redémarrer" onClick={() => { closeMenu(); requestRestart(); }} />
            <MenuSeparator />
            <MenuItem label={`Fermer la session ${currentUserName}`} onClick={() => { closeMenu(); requestLogoff(); }} />
            <MenuItem label="Changer d'utilisateur" info="Touche Windows+L" aria-disabled />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="?">
          <FloatingMenu>
            <MenuItem label="Rubriques d'aide du Gestionnaire des tâches" aria-disabled />
            <MenuSeparator />
            <MenuItem label="À propos du Gestionnaire des tâches" onClick={() => { closeMenu(); setActiveDialog('about'); }} />
          </FloatingMenu>
        </WindowToolbarMenuButton>
      </WindowToolbar>
      <Tabs
        style={{ padding: '3px 6px', height: 'calc(100% - 72px)' }}
        selectedIndex={activeTabIndex}
        onSelect={(index) => setActiveTabIndex(index)}
      >
        <TabList>
          <Tab>Applications</Tab>
          <Tab>Processus</Tab>
          <Tab>Performances</Tab>
          <Tab>Mise en réseau</Tab>
          <Tab>Utilisateurs</Tab>
        </TabList>

        <TabPanel>
          <TaskManagerApplicationsTab taskManagerWindowId={taskManagerWindowId} />
        </TabPanel>
        <TabPanel>
          <TaskManagerProcessesTab taskManagerWindowId={taskManagerWindowId} />
        </TabPanel>
        <TabPanel>
          <TaskManagerPerformanceTab />
        </TabPanel>
        <TabPanel>
          <TaskManagerNetworkTab />
        </TabPanel>
        <TabPanel>
          <TaskManagerUsersTab />
        </TabPanel>
      </Tabs>
      <WindowStatusBar>
        <StatusBarItem>Processus : {metrics.processCount}</StatusBarItem>
        <StatusBarItem>UC utilisée : {metrics.cpuUsage} %</StatusBarItem>
        <StatusBarItem>
          Charge dédiée : {formatMo(metrics.commitTotalKo)} / {formatMo(metrics.commitLimitKo)}
        </StatusBarItem>
        <img src={ResizeDots} style={{ marginLeft: '20px' }} />
      </WindowStatusBar>

      {activeDialog === 'about' && (
        <AboutDialog windowId={taskManagerWindowId} onClose={() => setActiveDialog(null)} />
      )}
      {activeDialog === 'columns' && (
        <SelectColumnsDialog windowId={taskManagerWindowId} onClose={() => setActiveDialog(null)} />
      )}
    </>
  );
};
