import React, { useMemo, useRef } from 'react';
import styles from './NetworkTab.module.scss';

import { useTaskManagerStore } from '../../stores/taskManagerStore';
import { GraphCanvas } from './PerfCanvas';

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';
import { Table } from '@/components/molecules/Table/Table';

type AdapterRow = {
  id: string;
  adapter: string;
  usage: string;
  speed: string;
  state: string;
};

const columnHelper = createColumnHelper<AdapterRow>();

const columns = [
  columnHelper.accessor('adapter', {
    cell: (info) => info.getValue(),
    header: () => <span>Carte réseau</span>,
    enableResizing: true,
    size: 142,
  }),
  columnHelper.accessor('usage', {
    cell: (info) => info.getValue(),
    header: () => <span>Utilisation du réseau</span>,
    enableResizing: true,
    size: 112,
  }),
  columnHelper.accessor('speed', {
    cell: (info) => info.getValue(),
    header: () => <span>Vitesse de la liaison</span>,
    enableResizing: true,
    size: 92,
  }),
  columnHelper.accessor('state', {
    cell: (info) => info.getValue(),
    header: () => <span>État</span>,
    enableResizing: true,
    size: 84,
  }),
];

export const TaskManagerNetworkTab: React.FC = () => {
  const netHistory = useTaskManagerStore((state) => state.netHistory);
  const tick = useTaskManagerStore((state) => state.tickCount);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

  const currentUsage = netHistory.length > 0 ? netHistory[netHistory.length - 1] : 0;
  // Une décimale, format français (« 0,5 % »).
  const usageLabel = `${currentUsage.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })} %`;

  const data = useMemo<AdapterRow[]>(
    () => [
      {
        id: 'lan',
        adapter: 'Connexion au réseau local',
        usage: usageLabel,
        speed: '100 Mbits/s',
        state: 'Opérationnel',
      },
    ],
    [usageLabel],
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    defaultColumn: { minSize: 55, maxSize: 800 },
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSorting: true,
    enableRowSelection: true,
    enableMultiRowSelection: false,
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  });

  const columnSizeVars: { [key: string]: number } = {};
  table.getFlatHeaders().forEach((header) => {
    columnSizeVars[`--header-${header.id}-size`] = header.getSize();
    columnSizeVars[`--col-${header.column.id}-size`] = header.column.getSize();
  });

  return (
    <div className={styles.netContent}>
      <fieldset className={styles.box}>
        <legend>Connexion au réseau local</legend>
        <GraphCanvas history={netHistory} tick={tick} color="#ffff00" className={styles.graphCanvas} />
      </fieldset>

      {/* Même tableau partagé que les autres onglets (fond blanc, en-tête XP). */}
      <OverlayScrollbarsComponent
        className={`overlayscrollbars-react ${styles.tableContainer}`}
        ref={osRef}
        options={{ scrollbars: { autoHide: 'never', clickScroll: true } }}
        defer
      >
        <Table table={table} columnSizeVars={columnSizeVars} />
      </OverlayScrollbarsComponent>
    </div>
  );
};
