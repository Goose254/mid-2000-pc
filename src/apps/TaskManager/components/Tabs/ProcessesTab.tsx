import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './ApplicationsTab.module.scss';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { useAppsStore } from '@/common/stores/appsStore';
import { useSystemStore } from '@/common/stores/systemStore';
import { Button } from '@/components/atoms/Button/Button';

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';
import { Table } from '@/components/molecules/Table/Table';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';

import { ContextMenu } from '../ContextMenu';
import { MessageBox } from '../dialogs/TmDialog';
import { AffinityDialog } from '../dialogs/TaskManagerDialogs';
import { useTaskManagerStore } from '../../stores/taskManagerStore';
import { formatCpu, formatKo, ProcessCategory } from '../../utils/processMetrics';

interface ProcessesTabProps {
  taskManagerWindowId: string;
}

type ProcessRow = {
  pid: string;
  imageName: string;
  userName: string;
  cpu: number;
  memoryKo: number;
  category: ProcessCategory;
};

// Niveaux de priorité proposés par le menu contextuel (cosmétiques).
const PRIORITY_LEVELS = [
  'Temps réel',
  'Haute',
  'Supérieure à la normale',
  'Normale',
  'Inférieure à la normale',
  'Basse',
] as const;
const DEFAULT_PRIORITY = 'Normale';

const columnHelper = createColumnHelper<ProcessRow>();

/** Coche affichée en regard de la priorité courante dans le sous-menu. */
const priorityCheck = (checked: boolean): React.ReactNode =>
  checked ? <span style={{ paddingRight: 4 }}>•</span> : undefined;

export const TaskManagerProcessesTab: React.FC<ProcessesTabProps> = ({ taskManagerWindowId }) => {
  const processes = useTaskManagerStore((state) => state.metrics.processes);
  const priorities = useTaskManagerStore((state) => state.priorities);
  const setPriority = useTaskManagerStore((state) => state.setPriority);
  const terminateProcess = useTaskManagerStore((state) => state.terminateProcess);
  const tick = useTaskManagerStore((state) => state.tick);
  const processToSelect = useTaskManagerStore((state) => state.processToSelect);
  const clearProcessToSelect = useTaskManagerStore((state) => state.clearProcessToSelect);
  const triggerBsod = useSystemStore((state) => state.triggerBsod);

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pid: string } | null>(null);
  // Boîte de message en cours (avertissement de terminaison ou accès refusé).
  const [messageDialog, setMessageDialog] = useState<
    { kind: 'warning' | 'accessDenied'; proc: ProcessRow } | null
  >(null);
  const [affinityProcess, setAffinityProcess] = useState<string | null>(null);

  const osRef = useRef<OverlayScrollbarsComponentRef>(null);

  const data = useMemo<ProcessRow[]>(
    () =>
      processes.map((process) => ({
        pid: process.pid,
        imageName: process.imageName,
        userName: process.userName,
        cpu: process.cpu,
        memoryKo: process.memoryKo,
        category: process.category,
      })),
    [processes]
  );

  const getProcess = useCallback((pid: string) => data.find((row) => row.pid === pid), [data]);

  // Clic droit : sélectionne d'abord la ligne, puis ouvre le menu contextuel.
  const openContextMenu = useCallback((event: React.MouseEvent, pid: string) => {
    event.preventDefault();
    event.stopPropagation();
    setRowSelection({ [pid]: true });
    setContextMenu({ x: event.clientX, y: event.clientY, pid });
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('imageName', {
        cell: (info) => (
          <div onContextMenu={(event) => openContextMenu(event, info.row.original.pid)}>
            {info.getValue()}
          </div>
        ),
        header: () => <span>Nom de l'image</span>,
        enableResizing: true,
        size: 140,
      }),
      columnHelper.accessor('userName', {
        cell: (info) => (
          <div onContextMenu={(event) => openContextMenu(event, info.row.original.pid)}>
            {info.getValue()}
          </div>
        ),
        header: () => <span>Nom de l'utilisateur</span>,
        enableResizing: true,
        size: 110,
      }),
      columnHelper.accessor('cpu', {
        cell: (info) => (
          <div
            style={{ textAlign: 'right', paddingRight: '5px' }}
            onContextMenu={(event) => openContextMenu(event, info.row.original.pid)}
          >
            {formatCpu(info.getValue())}
          </div>
        ),
        header: () => <span>Processeur</span>,
        enableResizing: true,
        size: 60,
      }),
      columnHelper.accessor('memoryKo', {
        cell: (info) => (
          <div
            style={{ textAlign: 'right', paddingRight: '5px' }}
            onContextMenu={(event) => openContextMenu(event, info.row.original.pid)}
          >
            {formatKo(info.getValue())}
          </div>
        ),
        header: () => <span>Util. mémoire</span>,
        enableResizing: true,
        size: 80,
      }),
    ],
    [openContextMenu]
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

  // pid du processus sélectionné (sélection unique).
  const selectedPid = Object.keys(rowSelection)[0];
  const selectedProcess = data.find((row) => row.pid === selectedPid);
  const hasSelection = !!selectedProcess;

  // Basculement inter-onglets : « Aller au processus » demande la sélection d'un
  // pid ; on l'applique dès qu'il existe dans la liste, puis on consomme la demande.
  useEffect(() => {
    if (!processToSelect) return;
    if (data.some((row) => row.pid === processToSelect)) {
      setRowSelection({ [processToSelect]: true });
    }
    clearProcessToSelect();
  }, [processToSelect, data, clearProcessToSelect]);

  /** Termine réellement un processus « normal ». */
  const performTerminate = useCallback(
    (proc: ProcessRow) => {
      // On ferme les vraies fenêtres associées à l'instance par leur id de
      // fenêtre : `closeWindow` déclenche en cascade `killInstance` une fois la
      // dernière fenêtre fermée (même logique que l'onglet Applications).
      const relatedWindows = useWindowsStore.getState().windows.filter((window) => window.appPid === proc.pid);

      if (relatedWindows.length > 0) {
        relatedWindows.forEach((window) => useWindowsStore.getState().closeWindow(window.id));
      } else if (useAppsStore.getState().instances.some((instance) => instance.pid === proc.pid)) {
        // Instance sans fenêtre encore référencée : on la retire directement.
        useAppsStore.getState().killInstance(proc.pid);
      } else {
        // Processus système synthétique (svchost, spoolsv, ...) : on le retire
        // de la liste virtuelle du Gestionnaire des tâches.
        terminateProcess(proc.pid);
      }

      tick();
      setRowSelection({});
    },
    [terminateProcess, tick]
  );

  /**
   * Point d'entrée unique de la terminaison — partagé par le bouton et le menu
   * contextuel. Aiguille selon la catégorie du processus (fidélité XP).
   */
  const requestTerminate = useCallback(
    (proc: ProcessRow | undefined) => {
      if (!proc) return;
      switch (proc.category) {
        case 'protected':
          // Processus inactif du système / System : « Accès refusé ».
          setMessageDialog({ kind: 'accessDenied', proc });
          break;
        case 'fatal':
          // smss/csrss/winlogon/services/lsass : écran bleu puis redémarrage.
          triggerBsod(proc.imageName);
          break;
        case 'normal':
        default:
          // Avertissement XP avant de terminer.
          setMessageDialog({ kind: 'warning', proc });
          break;
      }
    },
    [triggerBsod]
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const contextProcess = contextMenu ? getProcess(contextMenu.pid) : undefined;
  const currentPriority = contextMenu ? priorities[contextMenu.pid] ?? DEFAULT_PRIORITY : DEFAULT_PRIORITY;

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
        <Button
          disabled={!hasSelection}
          onClick={() => requestTerminate(selectedProcess)}
          className="blockOutsideClick"
        >
          Terminer le processus
        </Button>
      </div>

      {contextMenu && contextProcess && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu}>
          <MenuItem
            label="Terminer le processus"
            onClick={() => {
              closeContextMenu();
              requestTerminate(contextProcess);
            }}
          />
          <MenuItem
            label="Terminer l'arborescence du processus"
            onClick={() => {
              closeContextMenu();
              requestTerminate(contextProcess);
            }}
          />
          <MenuItem label="Déboguer" aria-disabled />
          <MenuSeparator />
          <MenuItem label="Définir la priorité">
            <FloatingMenu>
              {PRIORITY_LEVELS.map((level) => (
                <MenuItem
                  key={level}
                  label={level}
                  iconElement={priorityCheck(currentPriority === level)}
                  onClick={() => {
                    closeContextMenu();
                    setPriority(contextProcess.pid, level);
                  }}
                />
              ))}
            </FloatingMenu>
          </MenuItem>
          <MenuItem
            label="Définir l'affinité..."
            onClick={() => {
              closeContextMenu();
              setAffinityProcess(contextProcess.imageName);
            }}
          />
        </ContextMenu>
      )}

      {messageDialog?.kind === 'warning' && (
        <MessageBox
          windowId={taskManagerWindowId}
          title="Avertissement du Gestionnaire des tâches"
          icon="warning"
          message={
            <>
              AVERTISSEMENT : la fin d'un processus peut entraîner des résultats indésirables,
              dont la perte de données et l'instabilité du système. Le processus n'aura pas la
              possibilité d'enregistrer son état ou ses données avant d'être terminé. Voulez-vous
              terminer le processus ?
            </>
          }
          confirmLabel="Oui"
          cancelLabel="Non"
          onConfirm={() => {
            const proc = messageDialog.proc;
            setMessageDialog(null);
            performTerminate(proc);
          }}
          onCancel={() => setMessageDialog(null)}
        />
      )}

      {messageDialog?.kind === 'accessDenied' && (
        <MessageBox
          windowId={taskManagerWindowId}
          title="Gestionnaire des tâches"
          icon="error"
          message={
            <>
              Impossible de terminer le processus.
              <br />
              Accès refusé.
            </>
          }
          confirmLabel="OK"
          onConfirm={() => setMessageDialog(null)}
        />
      )}

      {affinityProcess && (
        <AffinityDialog
          windowId={taskManagerWindowId}
          processName={affinityProcess}
          onClose={() => setAffinityProcess(null)}
        />
      )}
    </div>
  );
};
