import React, { useMemo, useState } from 'react';
import styles from './RunDialog.module.scss';

import { findAppByCommand } from '@/apps/registry';
import { useAppsStore } from '@/common/stores/appsStore';
import { useRunDialogStore } from '@/common/stores/runDialogStore';
import { useWindowsStore } from '@/common/stores/windowsStore';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';

import RunDialogIcon from '@/assets/windows-icons/shell32.dll_14_160-8.png';

interface RunDialogProps {
  windowId: string;
}

export const RunDialog: React.FC<RunDialogProps> = ({ windowId }) => {
  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const launchApp = useAppsStore((state) => state.launchApp);
  const commandHistory = useRunDialogStore((state) => state.history);
  const addHistoryEntry = useRunDialogStore((state) => state.addHistoryEntry);

  const [command, setCommand] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canRunCommand = command.trim().length > 0;

  const historyOptions = useMemo(() => commandHistory, [commandHistory]);

  const launchCommand = () => {
    if (!canRunCommand) return;

    // Toute application du registre se lance par son nom d'exécutable.
    const appToLaunch = findAppByCommand(command);
    if (!appToLaunch) {
      setErrorMessage(`Windows ne trouve pas "${command.trim()}". Vérifiez le nom, puis réessayez.`);
      return;
    }

    addHistoryEntry(command);
    launchApp(appToLaunch.id);
    closeWindow(windowId);
  };

  const cancel = () => {
    closeWindow(windowId);
  };

  const browse = () => {
    launchApp('explorer.exe');
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
