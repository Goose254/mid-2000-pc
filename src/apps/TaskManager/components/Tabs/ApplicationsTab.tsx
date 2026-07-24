import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ApplicationsTab.module.scss';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { Button } from '@/components/atoms/Button/Button';

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';
import { Table } from '@/components/molecules/Table/Table';
import { TableListItem } from '@/components/atoms/TableListItem/TableListItem';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { ContextMenu } from '../ContextMenu';
import { useTaskManagerStore } from '../../stores/taskManagerStore';
import { openRunDialog } from '../../utils/openRunDialog';

interface TaskManagerApplicationsTabProps {
  taskManagerWindowId: string
}

type Application = {
  task: React.ReactNode;
  state: string;
};

const columnHelper = createColumnHelper<Application>();

const columns = [
  columnHelper.accessor('task', {
    cell: info => info.getValue(),
    header: () => <span>Tâche</span>,
    enableResizing: true,
    size: 360,
  }),
  columnHelper.accessor(row => row.state, {
    id: 'state',
    cell: info => info.getValue(),
    header: () => <span>État</span>,
    enableResizing: true,
    size: 90,
  }),
];

export const TaskManagerApplicationsTab: React.FC<TaskManagerApplicationsTabProps> = ({ taskManagerWindowId }) => {
  const windows = useWindowsStore((state) => state.windows);
  const goToProcess = useTaskManagerStore((state) => state.goToProcess);
  const [data, setData] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; appId: string } | null>(null);

  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

  const table = useReactTable({
    data,
    columns,
    // Configuration du redimensionnement
    defaultColumn: {
      minSize: 60,
      maxSize: 800,
    },
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    enableRowSelection: false,
  });

  // Calcul des variables CSS pour définir dynamiquement la largeur des colonnes.
  // Calculé à chaque rendu : un useMemo n'apporterait rien ici, car le
  // composant ne re-rend que lorsque le state de la table change (notamment à
  // chaque redimensionnement, qui invaliderait de toute façon la mémoïsation)
  // et le coût se limite à l'itération de quelques colonnes.
  const columnSizeVars: { [key: string]: number } = {};
  table.getFlatHeaders().forEach(header => {
    columnSizeVars[`--header-${header.id}-size`] = header.getSize();
    columnSizeVars[`--col-${header.column.id}-size`] = header.column.getSize();
  });

  const goToApp = useCallback((appId?: string) => {
    if (appId) {
      useWindowsStore.getState().toggleMinimizeWindow(taskManagerWindowId);
      useWindowsStore.getState().bringToFront(appId);
    }
  }, [taskManagerWindowId])

  const killApp = (appId?: string) => {
    if (appId) useWindowsStore.getState().closeWindow(appId);
  }

  // Clic droit sur une ligne : sélectionne l'application puis ouvre le menu.
  const openAppContextMenu = useCallback((event: React.MouseEvent, appId: string) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedAppId(appId);
    setContextMenu({ x: event.clientX, y: event.clientY, appId });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // « Aller au processus » : bascule sur l'onglet Processus en sélectionnant le
  // pid (appPid) de la fenêtre. Réduit aussi le menu.
  const goToProcessOfWindow = useCallback((appId: string) => {
    const target = useWindowsStore.getState().windows.find((window) => window.id === appId);
    if (target) goToProcess(target.appPid);
  }, [goToProcess]);

  useEffect(() => {
    setData(windows.filter((w) => w.id !== taskManagerWindowId).map(w => ({
      task: (
        <TableListItem
          key={w.id}
          icon={w.icon}
          label={w.title}
          onActive={() => setSelectedAppId(w.id)}
          onInactive={() => setSelectedAppId('')}
          onDoubleClick={() => goToApp(w.id)}
          onContextMenu={(event) => openAppContextMenu(event, w.id)}
        />
      ),
      state: 'En cours d\'exécution',
    })))
  }, [windows, taskManagerWindowId, goToApp, openAppContextMenu])

  return (
    <div className={styles.tabContent}>
      <OverlayScrollbarsComponent
        className={`overlayscrollbars-react ${styles.tableContainer}`}
        ref={osRef}
        options={{ scrollbars: { autoHide: "never", clickScroll: true } }}
        defer
      >
        <Table table={table} columnSizeVars={columnSizeVars} />
      </OverlayScrollbarsComponent>
      <div style={{ display: 'flex', alignSelf: 'end', justifyContent: 'end', flexGrow: 0 }}>
        <Button disabled={!selectedAppId} onClick={() => killApp(selectedAppId)} className="blockOutsideClick" style={{ marginRight: '10px', width: '95px', maxWidth: 'unset' }}>Fin de tâche</Button>
        <Button disabled={!selectedAppId} onClick={() => goToApp(selectedAppId)} className="blockOutsideClick" style={{ marginRight: '10px', width: '95px', maxWidth: 'unset' }}>Basculer vers</Button>
        <Button onClick={openRunDialog}>Nouvelle tâche...</Button>
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu}>
          <MenuItem
            label="Basculer vers"
            primary
            onClick={() => { closeContextMenu(); goToApp(contextMenu.appId); }}
          />
          <MenuItem
            label="Amener au premier plan"
            onClick={() => { closeContextMenu(); useWindowsStore.getState().bringToFront(contextMenu.appId); }}
          />
          <MenuItem
            label="Réduire"
            onClick={() => { closeContextMenu(); useWindowsStore.getState().toggleMinimizeWindow(contextMenu.appId, true); }}
          />
          <MenuItem
            label="Agrandir"
            onClick={() => { closeContextMenu(); useWindowsStore.getState().toggleMaximizeWindow(contextMenu.appId); }}
          />
          <MenuSeparator />
          <MenuItem
            label="Fin de tâche"
            onClick={() => { closeContextMenu(); killApp(contextMenu.appId); }}
          />
          <MenuItem
            label="Aller au processus"
            onClick={() => { closeContextMenu(); goToProcessOfWindow(contextMenu.appId); }}
          />
        </ContextMenu>
      )}
    </div>
  );
};
