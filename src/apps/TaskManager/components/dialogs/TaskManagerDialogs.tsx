import React, { useState } from 'react';
import styles from './dialogs.module.scss';

import { Button } from '@/components/atoms/Button/Button';
import { Checkbox } from '@/components/atoms/Checkbox/Checkbox';
import { TmDialog } from './TmDialog';

import taskmgrIcon from '@/assets/windows-icons/taskmgr-icon-32.png';

interface BaseDialogProps {
  windowId: string;
  onClose: () => void;
}

/** « À propos du Gestionnaire des tâches de Windows » — boîte sobre. */
export const AboutDialog: React.FC<BaseDialogProps> = ({ windowId, onClose }) => (
  <TmDialog windowId={windowId} title="À propos du Gestionnaire des tâches de Windows" onClose={onClose} onEnter={onClose}>
    <div className={styles.aboutContent}>
      <img src={taskmgrIcon} alt="Gestionnaire des tâches" className={styles.aboutIcon} />
      <div className={styles.aboutText}>
        <span className={styles.aboutName}>Gestionnaire des tâches de Windows</span>
        <span>Reproduction du Gestionnaire des tâches de Windows XP</span>
        <span>mid-2000-pc — hommage, sans code original</span>
      </div>
    </div>
    <div className={styles.buttonsRowEnd}>
      <Button className={styles.dialogButton} onClick={onClose}>
        OK
      </Button>
    </div>
  </TmDialog>
);

// Colonnes proposées dans la boîte « Sélectionner les colonnes… » (cosmétique).
const COLUMN_OPTIONS: { id: string; label: string; defaultChecked: boolean }[] = [
  { id: 'pid', label: 'Identificateur de processus (PID)', defaultChecked: false },
  { id: 'user', label: "Nom de l'utilisateur", defaultChecked: true },
  { id: 'session', label: 'ID de session', defaultChecked: false },
  { id: 'cpu', label: 'Utilisation du processeur', defaultChecked: true },
  { id: 'cputime', label: 'Durée UC', defaultChecked: false },
  { id: 'mem', label: 'Utilisation de la mémoire', defaultChecked: true },
  { id: 'peakmem', label: 'Pic d’utilisation mémoire', defaultChecked: false },
  { id: 'memdelta', label: 'Delta de mémoire', defaultChecked: false },
  { id: 'faults', label: 'Défauts de page', defaultChecked: false },
  { id: 'handles', label: 'Nombre de handles', defaultChecked: false },
  { id: 'threads', label: 'Nombre de threads', defaultChecked: false },
  { id: 'vmem', label: 'Taille de la mémoire virtuelle', defaultChecked: false },
];

/**
 * « Sélectionner les colonnes… » : cases à cocher listant les colonnes de
 * l'onglet Processus. Cosmétique : la sélection n'altère pas le tableau, mais
 * l'état des cases est réel.
 */
export const SelectColumnsDialog: React.FC<BaseDialogProps> = ({ windowId, onClose }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(COLUMN_OPTIONS.map((column) => [column.id, column.defaultChecked]))
  );

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <TmDialog windowId={windowId} title="Sélectionner les colonnes" onClose={onClose} onEnter={onClose}>
      <p className={styles.columnsIntro}>
        Sélectionnez les colonnes à afficher dans la page Processus du Gestionnaire des tâches.
      </p>
      <div className={styles.columnsList}>
        {COLUMN_OPTIONS.map((column) => (
          <div key={column.id} className={styles.checkRow}>
            <Checkbox
              label={column.label}
              checked={!!checked[column.id]}
              onChange={() => toggle(column.id)}
            />
          </div>
        ))}
      </div>
      <div className={styles.buttonsRowEnd}>
        <Button className={styles.dialogButton} onClick={onClose}>
          OK
        </Button>
        <Button className={styles.dialogButton} onClick={onClose}>
          Annuler
        </Button>
      </div>
    </TmDialog>
  );
};

/**
 * « Définir l'affinité du processeur » : cosmétique. Une seule UC dans la
 * machine simulée ; on montre néanmoins la boîte fidèle à XP.
 */
export const AffinityDialog: React.FC<BaseDialogProps & { processName: string }> = ({
  windowId,
  onClose,
  processName,
}) => {
  const [cpu0, setCpu0] = useState(true);

  return (
    <TmDialog windowId={windowId} title="Relation du processeur" onClose={onClose} onEnter={onClose}>
      <p className={styles.affinityIntro}>
        La relation du processeur contrôle sur quels processeurs le processus
        <strong> {processName} </strong> est autorisé à s'exécuter.
      </p>
      <div className={styles.affinityList}>
        <div className={styles.checkRow}>
          <Checkbox label="UC 0" checked={cpu0} onChange={() => setCpu0((value) => !value)} />
        </div>
        <div className={styles.checkRow}>
          <Checkbox label="UC 1" checked={false} disabled />
        </div>
      </div>
      <div className={styles.buttonsRowEnd}>
        <Button className={styles.dialogButton} onClick={onClose}>
          OK
        </Button>
        <Button className={styles.dialogButton} onClick={onClose}>
          Annuler
        </Button>
      </div>
    </TmDialog>
  );
};
