import React from 'react';
import styles from './styles.module.scss';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Button } from '@/components/atoms/Button/Button';
import { WindowStatusBar } from '@/components/atoms/WindowStatusBar/WindowStatusBar';
import { StatusBarItem } from '@/components/atoms/StatusBarItem/StatusBarItem';

import ResizeDots from '@/assets/resize-dots.png';

export const TaskManagerMainWindow: React.FC = () => {

  return (
    <>
      <WindowToolbar>
        <WindowToolbarMenuButton label="Fichier">
          <FloatingMenu>
            <MenuItem label="Nouvelle tâche (Exécuter...)" />
            <MenuSeparator />
            <MenuItem label="Quitter le gestionnaire des tâches" />
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
            <MenuItem label="Actualiser maintenant"/>
            <MenuItem label="Fréquence d'actualisation">
              <FloatingMenu>
                <MenuItem label="Haute"/>
                <MenuItem label="Normale"/>
                <MenuItem label="Basse"/>
                <MenuItem label="En pause"/>
              </FloatingMenu>
            </MenuItem>
            <MenuSeparator />
            <MenuItem label="Sélectionner les colonnes..."/>
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
            <MenuItem label="Rubriques d'aide du Gestionnaire des tâches"/>
            <MenuSeparator />
            <MenuItem label="À propos du Gestionnaire des tâches"/>
          </FloatingMenu>
        </WindowToolbarMenuButton>
      </WindowToolbar>
      <Tabs style={{ padding: '3px 6px' }}>
        <TabList>
          <Tab>Applications</Tab>
          <Tab>Processus</Tab>
          <Tab>Performances</Tab>
          <Tab>Mise en réseau</Tab>
          <Tab>Utilisateurs</Tab>
        </TabList>

        <TabPanel>
          <div style={{ display: 'flex', flex: '1 1', backgroundColor: '#ece9d8', margin: '1px 1px 1px 3px', padding: '15px' }}>
            test
            <div style={{ display: 'flex', alignSelf: 'end', justifyContent: 'end', flexGrow: '1' }}>
              <Button disabled>Fin de tâche</Button>
              <Button disabled>Basculer vers</Button>
              <Button>Nouvelle tâche...</Button>
            </div>
          </div>
        </TabPanel>
        <TabPanel>
          <br/><br/><br/><br/><br/><br/><br/><br/><br/>
        </TabPanel>
        <TabPanel>
          <br/><br/><br/><br/><br/><br/><br/><br/><br/>
        </TabPanel>
        <TabPanel>
          <br/><br/><br/><br/><br/><br/><br/><br/><br/>
        </TabPanel>
        <TabPanel>
          <br/><br/><br/><br/><br/><br/><br/><br/><br/>
        </TabPanel>
      </Tabs>
      <WindowStatusBar>
        <StatusBarItem>Processus : 22</StatusBarItem>
        <StatusBarItem>UC utilisée : 0%</StatusBarItem>
        <StatusBarItem>Charge dédiée : 95 Mo / 2048 Mo</StatusBarItem>
        <img src={ResizeDots} style={{ marginLeft: '20px' }} />
      </WindowStatusBar>
    </>
  );
};
