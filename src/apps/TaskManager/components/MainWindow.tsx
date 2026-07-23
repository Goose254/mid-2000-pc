import React, { useEffect } from 'react';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { WindowStatusBar } from '@/components/atoms/WindowStatusBar/WindowStatusBar';
import { StatusBarItem } from '@/components/atoms/StatusBarItem/StatusBarItem';
import { useWindowsStore } from '@/common/stores/windowsStore';

import ResizeDots from '@/assets/resize-dots.png';
import { TaskManagerApplicationsTab } from './Tabs/ApplicationsTab';
import { TaskManagerProcessesTab } from './Tabs/ProcessesTab';
import { TaskManagerPerformanceTab } from './Tabs/PerformanceTab';
import { TaskManagerNetworkTab } from './Tabs/NetworkTab';
import { TaskManagerUsersTab } from './Tabs/UsersTab';

import { getRefreshIntervalMs, RefreshRate, useTaskManagerStore } from '../stores/taskManagerStore';
import { formatMo } from '../utils/processMetrics';
import { openRunDialog } from '../utils/openRunDialog';

interface TaskManagerMainWindowProps {
  taskManagerWindowId: string;
}

export const TaskManagerMainWindow: React.FC<TaskManagerMainWindowProps> = ({ taskManagerWindowId }) => {
  const metrics = useTaskManagerStore((state) => state.metrics);
  const refreshRate = useTaskManagerStore((state) => state.refreshRate);
  const setRefreshRate = useTaskManagerStore((state) => state.setRefreshRate);
  const tick = useTaskManagerStore((state) => state.tick);

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

  return (
    <>
      <WindowToolbar>
        <WindowToolbarMenuButton label="Fichier">
          <FloatingMenu>
            <MenuItem label="Nouvelle tâche (Exécuter...)" onClick={openRunDialog} />
            <MenuSeparator />
            <MenuItem label="Quitter le gestionnaire des tâches" onClick={closeTaskManager} />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Options">
          <FloatingMenu>
            <MenuItem label="Toujours visible" />
            <MenuItem label="Réduire à l'exécution" />
            <MenuItem label="Masquer l'icône réduite" />
            <MenuItem label="Afficher les tâches 16 bits" />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Affichage">
          <FloatingMenu>
            <MenuItem label="Actualiser maintenant" onClick={() => tick()} />
            <MenuItem label="Fréquence d'actualisation">
              <FloatingMenu>
                <MenuItem label="Haute" info={rateMarker('high')} onClick={() => setRefreshRate('high')} />
                <MenuItem label="Normale" info={rateMarker('normal')} onClick={() => setRefreshRate('normal')} />
                <MenuItem label="Basse" info={rateMarker('low')} onClick={() => setRefreshRate('low')} />
                <MenuItem label="En pause" info={rateMarker('paused')} onClick={() => setRefreshRate('paused')} />
              </FloatingMenu>
            </MenuItem>
            <MenuSeparator />
            <MenuItem label="Sélectionner les colonnes..." />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="Arrêter">
          <FloatingMenu>
            <MenuItem label="Mettre en veille" aria-disabled />
            <MenuItem label="Mettre en veille prolongée" aria-disabled />
            <MenuItem label="Désactiver" />
            <MenuItem label="Redémarrer" />
            <MenuItem label="Fermer la session Utilisateur" />
            <MenuItem label="Changer d'utilisateur" info="Touche Windows+L" />
          </FloatingMenu>
        </WindowToolbarMenuButton>
        <WindowToolbarMenuButton label="?">
          <FloatingMenu>
            <MenuItem label="Rubriques d'aide du Gestionnaire des tâches" />
            <MenuSeparator />
            <MenuItem label="À propos du Gestionnaire des tâches" />
          </FloatingMenu>
        </WindowToolbarMenuButton>
      </WindowToolbar>
      <Tabs style={{ padding: '3px 6px', height: 'calc(100% - 72px)' }}>
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
          <TaskManagerProcessesTab />
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
    </>
  );
};
