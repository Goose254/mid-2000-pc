import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { useAppsStore } from '@/common/stores/appsStore';

type Application = {
  file: string;
  username: string;
  processor: React.ReactNode;
  memory: React.ReactNode;
};

const columnHelper = createColumnHelper<Application>();

const columns = [
  columnHelper.accessor('file', {
    cell: info => info.getValue(),
    header: () => <span>Nom de l'image</span>,
    enableResizing: true,
    size: 110,
  }),
  columnHelper.accessor('username', {
    cell: info => info.getValue(),
    header: () => <span>Nom de l'utilisateur</span>,
    enableResizing: true,
    size: 110,
  }),
  columnHelper.accessor('processor', {
    cell: info => info.getValue(),
    header: () => <span>Processeur</span>,
    enableResizing: true,
    size: 65,
  }),
  columnHelper.accessor('memory', {
    cell: info => info.getValue(),
    header: () => <span>Util. mémoire</span>,
    enableResizing: true,
    size: 65,
  }),
];

export const TaskManagerProcessesTab: React.FC = () => {
  const processes = useAppsStore((state) => state.instances);
  const [data, setData] = useState<Application[]>([]);
  const [rowSelection, setRowSelection] = React.useState({})

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
    enableRowSelection: true,
    enableMultiRowSelection: false,
    onRowSelectionChange: setRowSelection,
    state: {
        rowSelection,
    },
  });

  // Calcul des variables CSS pour définir dynamiquement la largeur des colonnes
  const columnSizeVars = useMemo(() => {
    const headers = table.getFlatHeaders();
    const colSizes: { [key: string]: number } = {};
    headers.forEach(header => {
      colSizes[`--header-${header.id}-size`] = header.getSize();
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
    });
    return colSizes;
  }, [table.getState().columnSizingInfo, table.getState().columnSizing]);

  const killProcess = (appId?: string) => {
    if (appId) useWindowsStore.getState().closeWindow(appId);
  }

  useEffect(() => {
    setData(processes.map(p => ({
      file: p.appId,
      username: 'Utilisateur',
      processor: <div style={{ justifySelf: 'end', textAlign: 'right', paddingRight: '5px' }}>00</div>,
      memory: <div style={{ textAlign: 'right', paddingRight: '5px' }}>2 916 Ko</div>,
    })))
  }, [processes])

  return (
    <div className={styles.tabContent}>
      <OverlayScrollbarsComponent
        className={`overlayscrollbars-react ${styles.tableContainer}`}
        ref={osRef}
        options={{ scrollbars: { autoHide: "never", clickScroll: true } }}
        defer
      >
        <Table table={table} columnSizeVars={columnSizeVars} onClickOutside={() => setRowSelection({})} />
      </OverlayScrollbarsComponent>
      <div style={{ display: 'flex', alignSelf: 'end', justifyContent: 'end', flexGrow: 0 }}>
        <Button disabled={Object.entries(rowSelection).length <= 0} onClick={() => killProcess('')} className="blockOutsideClick">Terminer le processus</Button>
      </div>
    </div>
  );
};
