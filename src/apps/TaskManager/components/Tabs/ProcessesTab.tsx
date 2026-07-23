import React, { useMemo, useRef } from 'react';
import styles from './ApplicationsTab.module.scss';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { useAppsStore } from '@/common/stores/appsStore';
import { Button } from '@/components/atoms/Button/Button';

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';
import { Table } from '@/components/molecules/Table/Table';

import { useTaskManagerStore } from '../../stores/taskManagerStore';
import { formatCpu, formatKo, IDLE_PID } from '../../utils/processMetrics';

type ProcessRow = {
  pid: string;
  imageName: string;
  userName: string;
  cpu: number;
  memoryKo: number;
  killable: boolean;
};

const columnHelper = createColumnHelper<ProcessRow>();

const columns = [
  columnHelper.accessor('imageName', {
    cell: (info) => info.getValue(),
    header: () => <span>Nom de l'image</span>,
    enableResizing: true,
    size: 140,
  }),
  columnHelper.accessor('userName', {
    cell: (info) => info.getValue(),
    header: () => <span>Nom de l'utilisateur</span>,
    enableResizing: true,
    size: 110,
  }),
  columnHelper.accessor('cpu', {
    cell: (info) => (
      <div style={{ textAlign: 'right', paddingRight: '5px' }}>{formatCpu(info.getValue())}</div>
    ),
    header: () => <span>Processeur</span>,
    enableResizing: true,
    size: 60,
  }),
  columnHelper.accessor('memoryKo', {
    cell: (info) => (
      <div style={{ textAlign: 'right', paddingRight: '5px' }}>{formatKo(info.getValue())}</div>
    ),
    header: () => <span>Util. mémoire</span>,
    enableResizing: true,
    size: 80,
  }),
];

export const TaskManagerProcessesTab: React.FC = () => {
  const processes = useTaskManagerStore((state) => state.metrics.processes);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

  const data = useMemo<ProcessRow[]>(
    () =>
      processes.map((process) => ({
        pid: process.pid,
        imageName: process.imageName,
        userName: process.userName,
        cpu: process.cpu,
        memoryKo: process.memoryKo,
        killable: process.killable,
      })),
    [processes]
  );

  const table = useReactTable({
    data,
    columns,
    // La ligne est identifiée par le pid : la sélection reste stable malgré le
    // rafraîchissement des métriques à chaque tick.
    getRowId: (row) => row.pid,
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

  // Calcul des variables CSS pour définir dynamiquement la largeur des colonnes.
  const columnSizeVars: { [key: string]: number } = {};
  table.getFlatHeaders().forEach((header) => {
    columnSizeVars[`--header-${header.id}-size`] = header.getSize();
    columnSizeVars[`--col-${header.column.id}-size`] = header.column.getSize();
  });

  // pid du processus sélectionné (le tableau étant en sélection unique, il n'y
  // a qu'une seule clé au maximum).
  const selectedPid = Object.keys(rowSelection)[0];
  const selectedProcess = data.find((row) => row.pid === selectedPid);
  const canKill = !!selectedProcess && selectedProcess.killable;

  const killProcess = () => {
    if (!selectedProcess || !selectedProcess.killable || selectedProcess.pid === IDLE_PID) {
      return;
    }

    const pid = selectedProcess.pid;

    // On ferme les vraies fenêtres associées à l'instance par leur id de
    // fenêtre : `closeWindow` déclenche en cascade `killInstance` une fois la
    // dernière fenêtre fermée (même logique que l'onglet Applications).
    const relatedWindows = useWindowsStore
      .getState()
      .windows.filter((window) => window.appPid === pid);

    if (relatedWindows.length > 0) {
      relatedWindows.forEach((window) => useWindowsStore.getState().closeWindow(window.id));
    } else {
      // Processus sans fenêtre (svchost.exe, ctfmon.exe, ...) : on retire
      // directement l'instance.
      useAppsStore.getState().killInstance(pid);
    }

    // Rafraîchissement immédiat pour que la ligne disparaisse sans attendre le
    // prochain tick.
    useTaskManagerStore.getState().tick();
    setRowSelection({});
  };

  return (
    <div className={styles.tabContent}>
      <OverlayScrollbarsComponent
        className={`overlayscrollbars-react ${styles.tableContainer}`}
        ref={osRef}
        options={{ scrollbars: { autoHide: 'never', clickScroll: true } }}
        defer
      >
        {/* Pas de `onClickOutside` : le molecule Table efface la sélection au
            `mousedown` (avant le `click`), ce qui désactiverait le bouton
            « Terminer le processus » au moment même où on le presse. XP conserve
            d'ailleurs la sélection quand on clique dans le vide. */}
        <Table table={table} columnSizeVars={columnSizeVars} />
      </OverlayScrollbarsComponent>
      <div style={{ display: 'flex', alignSelf: 'end', justifyContent: 'end', flexGrow: 0 }}>
        <Button disabled={!canKill} onClick={killProcess} className="blockOutsideClick">
          Terminer le processus
        </Button>
      </div>
    </div>
  );
};
