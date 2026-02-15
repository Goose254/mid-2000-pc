import React, { useMemo, useState } from 'react';
import styles from './RunDialog.module.scss';

import { ExplorerApp } from '@/apps/Explorer/main';
import { MinesweeperApp } from '@/apps/Minesweeper/main';
import { TaskManagerApp } from '@/apps/TaskManager/main';
import { AppTemplate } from '@/common/types/appTemplate';
import { useAppsStore } from '@/common/stores/appsStore';
import { useRunDialogStore } from '@/common/stores/runDialogStore';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';

import RunDialogIcon from '@/assets/windows-icons/shell32.dll_14_160-8.png';

interface RunDialogProps {
  windowId: string;
}

const executableMap: Record<string, AppTemplate> = {
  'explorer.exe': ExplorerApp,
  'taskmgr.exe': TaskManagerApp,
  'winmine.exe': MinesweeperApp,
};

const parseExecutableFromCommand = (command: string): string | null => {
  const trimmed = command.trim();
  if (!trimmed) return null;

  const quotedMatch = trimmed.match(/^"([^"]+)"/);
  const token = quotedMatch?.[1] || trimmed.split(/\s+/)[0];
  const baseToken = token.split(/[\\/]/).pop()?.toLowerCase();

  if (!baseToken) return null;
  return baseToken.endsWith('.exe') ? baseToken : `${baseToken}.exe`;
};

export const RunDialog: React.FC<RunDialogProps> = ({ windowId }) => {
  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const startApp = useAppsStore((state) => state.startApp);
  const commandHistory = useRunDialogStore((state) => state.history);
  const addHistoryEntry = useRunDialogStore((state) => state.addHistoryEntry);

  const [command, setCommand] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canRunCommand = command.trim().length > 0;

  const historyOptions = useMemo(() => commandHistory, [commandHistory]);

  const launchCommand = () => {
    const executable = parseExecutableFromCommand(command);
    if (!executable) return;

    const appToLaunch = executableMap[executable];
    if (!appToLaunch) {
      setErrorMessage(`Windows ne trouve pas "${command.trim()}". Vérifiez le nom, puis réessayez.`);
      return;
    }

    addHistoryEntry(command);
    startApp(appToLaunch);
    closeWindow(windowId);
  };

  const cancel = () => {
    closeWindow(windowId);
  };

  const browse = () => {
    startApp(ExplorerApp);
  };

  return (
    <div className={styles.runDialog}>
      <div className={styles.mainContent}>
        <img src={RunDialogIcon} alt="Run dialog icon" className={styles.icon} />

        <div className={styles.formArea}>
          <p className={styles.description}>
            Entrez le nom d&apos;un programme, dossier, document ou d&apos;une ressource Internet, et Windows
            l&apos;ouvrira pour vous.
          </p>
        </div>
      </div>

      <div className={styles.openArea}>
        <div className={styles.openRow}>
          <label htmlFor="run-command-input" className={styles.openLabel}>
            Ouvrir :
          </label>
          <Input
            id="run-command-input"
            value={command}
            autoFocus
            wrapperClassName={styles.commandInput}
            dropdownOptions={historyOptions}
            onChange={(event) => {
              setCommand(event.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            onDropdownValueSelect={(selectedValue) => {
              setCommand(selectedValue);
              if (errorMessage) setErrorMessage('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                launchCommand();
              }

              if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
              }
            }}
          />
        </div>

        {errorMessage && (
          <div className={styles.commandTooltip} role="status" aria-live="polite">
            <span className={styles.commandTooltipIcon}>i</span>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button disabled={!canRunCommand} onClick={launchCommand}>
          OK
        </Button>
        <Button onClick={cancel}>
          Annuler
        </Button>
        <Button onClick={browse}>
          Parcourir...
        </Button>
      </div>
    </div>
  );
};
