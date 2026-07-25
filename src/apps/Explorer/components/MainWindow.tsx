import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from './chrome.module.scss';

import { ExplorerProvider, useExplorer } from '../ExplorerContext';
import { Location } from '../model';

import { MenuBar } from './MenuBar';
import { Toolbar } from './Toolbar';
import { AddressBar } from './AddressBar';
import { TaskPane } from './TaskPane';
import { FolderTree } from './FolderTree';
import { ContentView } from './ContentView';
import { StatusBar } from './StatusBar';
import { ExplorerContextMenu } from './ExplorerContextMenu';
import { ExplorerDialogs } from './ExplorerDialogs';

/** Corps de l'Explorateur (une fois le contexte fourni). */
const ExplorerShell: React.FC = () => {
  const { state } = useExplorer();
  return (
    <div className={styles.explorer}>
      <MenuBar />
      <Toolbar />
      <AddressBar />
      <div className={styles.body}>
        {state.showTree ? (
          <FolderTree />
        ) : (
          <OverlayScrollbarsComponent
            className={`overlayscrollbars-react ${styles.taskScroll}`}
            options={{ scrollbars: { autoHide: 'never', clickScroll: true } }}
            defer
          >
            <TaskPane />
          </OverlayScrollbarsComponent>
        )}
        <ContentView />
      </div>
      {state.showStatusBar && <StatusBar />}
      <ExplorerContextMenu />
      <ExplorerDialogs />
    </div>
  );
};

interface ExplorerMainWindowProps {
  windowId: string;
  initialLocation: Location;
}

/** Fenêtre principale de l'Explorateur, branchée sur le système de fichiers. */
export const ExplorerMainWindow: React.FC<ExplorerMainWindowProps> = ({ windowId, initialLocation }) => (
  <ExplorerProvider windowId={windowId} initialLocation={initialLocation}>
    <ExplorerShell />
  </ExplorerProvider>
);
