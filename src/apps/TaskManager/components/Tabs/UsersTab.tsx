import React, { useMemo, useRef } from 'react';
import styles from './ApplicationsTab.module.scss';

import { useUsersStore } from '@/common/stores/usersStore';
import { Button } from '@/components/atoms/Button/Button';

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';
import { Table } from '@/components/molecules/Table/Table';

type SessionRow = {
  userId: string;
  userName: string;
  sessionId: string;
  status: string;
  clientName: string;
  session: string;
};

const columnHelper = createColumnHelper<SessionRow>();

const columns = [
  columnHelper.accessor('userName', {
    cell: (info) => info.getValue(),
    header: () => <span>Utilisateur</span>,
    enableResizing: true,
    size: 150,
  }),
  columnHelper.accessor('sessionId', {
    cell: (info) => info.getValue(),
    header: () => <span>Ident.</span>,
    enableResizing: true,
    size: 55,
  }),
  columnHelper.accessor('status', {
    cell: (info) => info.getValue(),
    header: () => <span>État</span>,
    enableResizing: true,
    size: 80,
  }),
  columnHelper.accessor('clientName', {
    cell: (info) => info.getValue(),
    header: () => <span>Nom du client</span>,
    enableResizing: true,
    size: 100,
  }),
  columnHelper.accessor('session', {
    cell: (info) => info.getValue(),
    header: () => <span>Session</span>,
    enableResizing: true,
    size: 80,
  }),
];

export const TaskManagerUsersTab: React.FC = () => {
  // Lecture seule : on n'appelle aucune action de mutation de `usersStore`.
  const users = useUsersStore((state) => state.users);
  const currentUserId = useUsersStore((state) => state.currentUserId);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});

  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

  // Seul le compte connecté possède une session active (« Console »).
  const data = useMemo<SessionRow[]>(() => {
    const currentUser = users.find((user) => user.id === currentUserId);
    if (!currentUser) return [];
    return [
      {
        userId: currentUser.id,
        userName: currentUser.name,
        sessionId: '0',
        status: 'Actif',
        clientName: '',
        session: 'Console',
      },
    ];
  }, [users, currentUserId]);

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.userId,
    defaultColumn: {
      minSize: 55,
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

  const columnSizeVars: { [key: string]: number } = {};
  table.getFlatHeaders().forEach((header) => {
    columnSizeVars[`--header-${header.id}-size`] = header.getSize();
    columnSizeVars[`--col-${header.column.id}-size`] = header.column.getSize();
  });

  const hasSelection = Object.keys(rowSelection).length > 0;

  return (
    <div className={styles.tabContent}>
      <OverlayScrollbarsComponent
        className={`overlayscrollbars-react ${styles.tableContainer}`}
        ref={osRef}
        options={{ scrollbars: { autoHide: 'never', clickScroll: true } }}
        defer
      >
        <Table table={table} columnSizeVars={columnSizeVars} />
      </OverlayScrollbarsComponent>
      <div style={{ display: 'flex', alignSelf: 'end', justifyContent: 'end', flexGrow: 0, gap: '10px' }}>
        {/* Actions de session cosmétiques (fidélité visuelle XP). */}
        <Button disabled={!hasSelection} className="blockOutsideClick" style={{ width: '95px', maxWidth: 'unset' }}>
          Déconnecter
        </Button>
        <Button disabled={!hasSelection} className="blockOutsideClick" style={{ width: '110px', maxWidth: 'unset' }}>
          Fermer la session
        </Button>
        <Button disabled className="blockOutsideClick" style={{ width: '130px', maxWidth: 'unset' }}>
          Envoyer un message...
        </Button>
      </div>
    </div>
  );
};
