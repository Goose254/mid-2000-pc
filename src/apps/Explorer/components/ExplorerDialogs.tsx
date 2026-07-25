import React, { useMemo, useState } from 'react';
import styles from './dialogs.module.scss';

import { TmDialog, MessageBox } from '@/apps/TaskManager/components/dialogs/TmDialog';
import { Button } from '@/components/atoms/Button/Button';
import { getBaseName, getParentPath, useFsStore } from '@/common/fs';

import { useExplorer } from '../ExplorerContext';
import { ExplorerItem } from '../items';
import {
  MyComputerIcon,
  VIRTUAL_DRIVES,
  folderDisplayName,
  folderIcon,
  formatDateTime,
  formatDiskSize,
  folderTypeLabel,
} from '../model';

// ---------------------------------------------------------------------------
// Propriétés
// ---------------------------------------------------------------------------

/** Compte récursif (fichiers / dossiers / octets) d'un dossier. */
const folderStats = (path: string): { files: number; folders: number; bytes: number } => {
  const fs = useFsStore.getState();
  let files = 0;
  let folders = 0;
  let bytes = 0;
  const walk = (p: string, depth: number) => {
    if (depth > 30) return;
    let entries;
    try {
      entries = fs.readDir(p);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.type === 'folder') {
        folders += 1;
        walk(e.path, depth + 1);
      } else {
        files += 1;
        bytes += e.size;
      }
    }
  };
  walk(path, 0);
  return { files, folders, bytes };
};

const PropRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className={styles.propRow}>
    <span className={styles.propLabel}>{label}</span>
    <span className={styles.propValue}>{children}</span>
  </div>
);

const PropertiesDialog: React.FC<{ windowId: string; item: ExplorerItem | null; currentFolderPath: string | null; onClose: () => void }> = ({
  windowId,
  item,
  currentFolderPath,
  onClose,
}) => {
  const fsRoot = useFsStore((s) => s.root);

  const body = useMemo(() => {
    void fsRoot;
    // Lecteur
    if (item && item.kind === 'drive') {
      const drive = VIRTUAL_DRIVES.find((d) => `drive:${d.id}` === item.key);
      return (
        <>
          <div className={styles.propHeader}>
            <img src={item.icon} alt="" />
            <span className={styles.propName}>{item.name}</span>
          </div>
          <hr className={styles.sep} />
          <PropRow label="Type :">{item.typeLabel}</PropRow>
          <PropRow label="Système de fichiers :">NTFS</PropRow>
          {drive?.totalBytes && drive.freeBytes !== undefined && (
            <>
              <hr className={styles.sep} />
              <PropRow label="Espace utilisé :">{formatDiskSize(drive.totalBytes - drive.freeBytes)}</PropRow>
              <PropRow label="Espace libre :">{formatDiskSize(drive.freeBytes)}</PropRow>
              <hr className={styles.sep} />
              <PropRow label="Capacité :">{formatDiskSize(drive.totalBytes)}</PropRow>
            </>
          )}
        </>
      );
    }

    // Fichier / dossier réel — on résout le chemin.
    const path = item?.path ?? currentFolderPath;
    if (!path) {
      return (
        <>
          <div className={styles.propHeader}>
            <img src={MyComputerIcon} alt="" />
            <span className={styles.propName}>Poste de travail</span>
          </div>
          <hr className={styles.sep} />
          <PropRow label="Type :">Dossier système</PropRow>
        </>
      );
    }
    const fs = useFsStore.getState();
    const stat = fs.stat(path);
    if (!stat) {
      return <div>Élément introuvable.</div>;
    }
    const isFolder = stat.type === 'folder';
    const parent = getParentPath(path);
    const icon = isFolder ? folderIcon(path) : item?.icon ?? '';
    return (
      <>
        <div className={styles.propHeader}>
          <img src={icon} alt="" />
          <span className={styles.propName}>{getBaseName(path)}</span>
        </div>
        <hr className={styles.sep} />
        <PropRow label="Type :">{isFolder ? folderTypeLabel(path) : item?.typeLabel ?? 'Fichier'}</PropRow>
        <PropRow label="Emplacement :">{parent ?? 'C:\\'}</PropRow>
        {isFolder ? (
          (() => {
            const { files, folders, bytes } = folderStats(path);
            return (
              <>
                <PropRow label="Taille :">
                  {bytes > 0 ? `${Math.ceil(bytes / 1024).toLocaleString('fr-FR')} Ko (${bytes.toLocaleString('fr-FR')} octets)` : '0 octet'}
                </PropRow>
                <PropRow label="Contient :">{`${files} fichier${files > 1 ? 's' : ''}, ${folders} dossier${folders > 1 ? 's' : ''}`}</PropRow>
              </>
            );
          })()
        ) : (
          <PropRow label="Taille :">
            {stat.size > 0
              ? `${Math.ceil(stat.size / 1024).toLocaleString('fr-FR')} Ko (${stat.size.toLocaleString('fr-FR')} octets)`
              : '0 octet'}
          </PropRow>
        )}
        <hr className={styles.sep} />
        <PropRow label="Créé le :">{formatDateTime(stat.createdAt)}</PropRow>
        <PropRow label="Modifié le :">{formatDateTime(stat.modifiedAt)}</PropRow>
      </>
    );
  }, [item, currentFolderPath, fsRoot]);

  const title = item ? `Propriétés de ${item.name}` : `Propriétés de ${currentFolderPath ? folderDisplayName(currentFolderPath) : 'Poste de travail'}`;

  return (
    <TmDialog windowId={windowId} title={title} onClose={onClose} onEnter={onClose}>
      <div className={styles.dialogRoot}>
        {body}
        <div className={styles.buttonsRow}>
          <Button className={styles.dialogButton} onClick={onClose}>
            OK
          </Button>
          <Button className={styles.dialogButton} onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </TmDialog>
  );
};

// ---------------------------------------------------------------------------
// Options des dossiers (onglet Général — reproduction fidèle)
// ---------------------------------------------------------------------------

const FolderOptionsDialog: React.FC<{ windowId: string; onClose: () => void }> = ({ windowId, onClose }) => {
  const [tasksMode, setTasksMode] = useState<'tasks' | 'classic'>('tasks');
  return (
    <TmDialog windowId={windowId} title="Options des dossiers" onClose={onClose} onEnter={onClose}>
      <div className={`${styles.dialogRoot} ${styles.wide}`}>
        <div className={styles.optionGroup}>
          <div style={{ fontWeight: 'bold', marginBottom: 6 }}>Tâches</div>
          <label className={styles.radioRow}>
            <input type="radio" name="tasks" checked={tasksMode === 'tasks'} onChange={() => setTasksMode('tasks')} />
            <span>Afficher les tâches habituelles dans les dossiers</span>
          </label>
          <label className={styles.radioRow}>
            <input type="radio" name="tasks" checked={tasksMode === 'classic'} onChange={() => setTasksMode('classic')} />
            <span>Utiliser les dossiers classiques de Windows</span>
          </label>
        </div>
        <div className={styles.buttonsRow}>
          <Button className={styles.dialogButton} onClick={onClose}>
            OK
          </Button>
          <Button className={styles.dialogButton} onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </TmDialog>
  );
};

// ---------------------------------------------------------------------------
// Visionneuse / éditeur de texte (mini Bloc-notes)
// ---------------------------------------------------------------------------

const TextViewerDialog: React.FC<{ windowId: string; path: string; name: string; onClose: () => void }> = ({
  windowId,
  path,
  name,
  onClose,
}) => {
  const initial = useMemo(() => {
    try {
      return useFsStore.getState().readFile(path);
    } catch {
      return '';
    }
  }, [path]);
  const [text, setText] = useState(initial);

  const save = () => {
    try {
      useFsStore.getState().writeFile(path, text);
    } catch {
      /* ignore */
    }
    onClose();
  };

  return (
    <TmDialog windowId={windowId} title={`${name} - Bloc-notes`} onClose={onClose}>
      <div className={`${styles.dialogRoot} ${styles.viewerBody}`}>
        <textarea
          className={styles.viewerTextarea}
          value={text}
          spellCheck={false}
          onChange={(e) => setText(e.target.value)}
        />
        <div className={styles.buttonsRow}>
          <Button className={styles.dialogButton} onClick={save}>
            Enregistrer
          </Button>
          <Button className={styles.dialogButton} onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </TmDialog>
  );
};

// ---------------------------------------------------------------------------
// À propos de Windows
// ---------------------------------------------------------------------------

const AboutDialog: React.FC<{ windowId: string; onClose: () => void }> = ({ windowId, onClose }) => (
  <TmDialog windowId={windowId} title="À propos de Windows" onClose={onClose} onEnter={onClose}>
    <div className={styles.dialogRoot}>
      <div className={styles.aboutText}>
        <strong>Microsoft&nbsp;Windows</strong>
        <br />
        Version&nbsp;5.1 (Build&nbsp;2600.xpsp_sp3)
        <br />
        Service&nbsp;Pack&nbsp;3
        <br />
        <br />
        Reconstitution nostalgique exécutée dans le navigateur.
      </div>
      <div className={styles.buttonsRow}>
        <Button className={styles.dialogButton} onClick={onClose}>
          OK
        </Button>
      </div>
    </div>
  </TmDialog>
);

// ---------------------------------------------------------------------------
// Hôte : rend le dialogue / message / menu contextuel actif
// ---------------------------------------------------------------------------

export const ExplorerDialogs: React.FC = () => {
  const { windowId, dialog, closeDialog, message, clearMessage, currentFolderPath } = useExplorer();

  return (
    <>
      {message && (
        <MessageBox
          windowId={windowId}
          title={message.title}
          icon={message.icon}
          message={message.message}
          confirmLabel={message.confirmLabel}
          onConfirm={() => {
            message.onConfirm?.();
            clearMessage();
          }}
          cancelLabel={message.cancelLabel}
          onCancel={
            message.cancelLabel
              ? () => {
                  message.onCancel?.();
                  clearMessage();
                }
              : undefined
          }
        />
      )}

      {dialog?.kind === 'properties' && (
        <PropertiesDialog windowId={windowId} item={dialog.item} currentFolderPath={currentFolderPath} onClose={closeDialog} />
      )}
      {dialog?.kind === 'folderOptions' && <FolderOptionsDialog windowId={windowId} onClose={closeDialog} />}
      {dialog?.kind === 'textViewer' && (
        <TextViewerDialog windowId={windowId} path={dialog.path} name={dialog.name} onClose={closeDialog} />
      )}
      {dialog?.kind === 'about' && <AboutDialog windowId={windowId} onClose={closeDialog} />}
    </>
  );
};
