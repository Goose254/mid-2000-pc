import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './chrome.module.scss';

import { useExplorer } from '../useExplorer';
import {
  COMPUTER,
  ControlPanelIcon,
  FolderIcon,
  MyComputerIcon,
  MyDocumentsIcon,
  NetworkPlacesIcon,
  OpenFolderIcon,
  RecycleIcon,
  SPECIAL_PATHS,
  folderDisplayName,
  folderLocation,
  formatDateTime,
  formatDiskSize,
  isMusicFolder,
  isPictureFolder,
  locationIcon,
  parentLocation,
} from '../model';
import { VIRTUAL_DRIVES } from '../model';
import { ExplorerItem } from '../items';

import SystemInfoIcon from '@/assets/windows-icons/sysdm.cpl_14_9-9.png';
import AddRemoveIcon from '@/assets/windows-icons/appwiz.cpl_14_1503.png';
import ChangeSettingsIcon from '@/assets/windows-icons/desk.cpl_14_40-6.png';

interface Task {
  label: string;
  icon: string;
  onClick?: () => void;
}

/** Section repliable du volet des tâches. */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <section className={styles.taskSection}>
      <header className={styles.taskSectionHeader} onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <button
          type="button"
          className={`${styles.collapseButton} ${open ? '' : styles.collapsed}`}
          aria-label={open ? 'Réduire' : 'Développer'}
        />
      </header>
      {open && <div className={styles.taskSectionBody}>{children}</div>}
    </section>
  );
};

const TaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
  <ul className={styles.taskList}>
    {tasks.map((task) => (
      <li key={task.label}>
        <button type="button" className={styles.taskButton} onClick={task.onClick}>
          <img src={task.icon} alt="" aria-hidden />
          <span>{task.label}</span>
        </button>
      </li>
    ))}
  </ul>
);

/** Volet des tâches contextuel (bleu) : 3 sections repliables. */
export const TaskPane: React.FC = () => {
  const { t: tTrash } = useTranslation('common', { keyPrefix: 'explorer.recycleBin' });
  const explorer = useExplorer();
  const {
    state,
    selectedItems,
    currentFolderPath,
    navigate,
    createFolder,
    beginRename,
    deleteSelection,
    copy,
    cut,
    restoreFromTrash,
    emptyTrash,
  } = explorer;

  const loc = state.location;
  const sel = selectedItems;
  const single = sel.length === 1 ? sel[0] : null;
  const multiple = sel.length > 1;

  // -- Section 1 : tâches contextuelles -------------------------------------
  const noop = () => {};

  let tasksTitle = 'Gestion des fichiers';
  let tasks: Task[] = [];

  if (loc.kind === 'computer') {
    tasksTitle = 'Gestion du système';
    tasks = [
      { label: 'Afficher les informations système', icon: SystemInfoIcon, onClick: noop },
      { label: 'Ajouter ou supprimer des programmes', icon: AddRemoveIcon, onClick: noop },
      { label: 'Modifier un paramètre', icon: ChangeSettingsIcon, onClick: noop },
    ];
  } else if (loc.kind === 'folder') {
    const isImg = isPictureFolder(loc.path);
    if (multiple) {
      tasks = [
        { label: 'Copier les éléments sélectionnés', icon: FolderIcon, onClick: copy },
        { label: 'Déplacer les éléments sélectionnés', icon: OpenFolderIcon, onClick: cut },
        { label: 'Supprimer les éléments sélectionnés', icon: RecycleIcon, onClick: deleteSelection },
      ];
    } else if (single) {
      const noun = single.kind === 'folder' ? 'ce dossier' : 'ce fichier';
      tasks = [
        { label: `Renommer ${noun}`, icon: single.icon, onClick: () => beginRename(single.key) },
        { label: `Déplacer ${noun}`, icon: OpenFolderIcon, onClick: cut },
        { label: `Copier ${noun}`, icon: FolderIcon, onClick: copy },
        { label: `Publier ${noun} sur le Web`, icon: NetworkPlacesIcon, onClick: noop },
        {
          label:
            single.kind === 'folder'
              ? 'Envoyer les fichiers de ce dossier par courrier électronique'
              : 'Envoyer ce fichier par courrier électronique',
          icon: NetworkPlacesIcon,
          onClick: noop,
        },
        { label: `Supprimer ${noun}`, icon: RecycleIcon, onClick: deleteSelection },
      ];
    } else if (isImg) {
      tasksTitle = 'Gestion des images';
      tasks = [
        { label: 'Afficher un diaporama', icon: MyDocumentsIcon, onClick: noop },
        { label: 'Commander des photos via internet', icon: NetworkPlacesIcon, onClick: noop },
        { label: 'Imprimer les images', icon: ChangeSettingsIcon, onClick: noop },
        { label: 'Créer un nouveau dossier', icon: FolderIcon, onClick: createFolder },
      ];
    } else {
      tasks = [
        { label: 'Créer un nouveau dossier', icon: FolderIcon, onClick: createFolder },
        { label: 'Publier ce dossier sur le Web', icon: NetworkPlacesIcon, onClick: noop },
        { label: 'Partager ce dossier', icon: OpenFolderIcon, onClick: noop },
      ];
    }
  } else {
    // Corbeille : la vider, ou restaurer la sélection (tout, sans sélection).
    tasksTitle = tTrash('tasksTitle');
    tasks = [
      { label: tTrash('empty'), icon: RecycleIcon, onClick: emptyTrash },
      multiple
        ? { label: tTrash('restoreSelected'), icon: RecycleIcon, onClick: () => restoreFromTrash('selection') }
        : single
          ? { label: tTrash('restoreThis'), icon: single.icon, onClick: () => restoreFromTrash('selection') }
          : { label: tTrash('restoreAll'), icon: RecycleIcon, onClick: () => restoreFromTrash('all') },
    ];
  }

  // -- Section 2 : autres emplacements --------------------------------------
  const otherPlaces: Task[] = [];
  if (loc.kind === 'computer') {
    otherPlaces.push(
      { label: 'Favoris réseau', icon: NetworkPlacesIcon, onClick: noop },
      { label: 'Mes documents', icon: MyDocumentsIcon, onClick: () => navigate(folderLocation(SPECIAL_PATHS.myDocuments)) },
      { label: 'Documents partagés', icon: FolderIcon, onClick: noop },
      { label: 'Panneau de configuration', icon: ControlPanelIcon, onClick: noop },
    );
  } else if (loc.kind === 'folder') {
    const parent = parentLocation(loc);
    if (parent && parent.kind === 'folder') {
      otherPlaces.push({
        label: folderDisplayName(parent.path),
        icon: locationIcon(parent),
        onClick: () => navigate(parent),
      });
    }
    otherPlaces.push(
      { label: 'Mes documents', icon: MyDocumentsIcon, onClick: () => navigate(folderLocation(SPECIAL_PATHS.myDocuments)) },
      { label: 'Poste de travail', icon: MyComputerIcon, onClick: () => navigate(COMPUTER) },
      { label: 'Favoris réseau', icon: NetworkPlacesIcon, onClick: noop },
    );
  } else {
    otherPlaces.push(
      { label: 'Poste de travail', icon: MyComputerIcon, onClick: () => navigate(COMPUTER) },
      { label: 'Mes documents', icon: MyDocumentsIcon, onClick: () => navigate(folderLocation(SPECIAL_PATHS.myDocuments)) },
    );
  }

  return (
    <div className={styles.taskPane}>
      {tasks.length > 0 && (
        <Section title={tasksTitle}>
          <TaskList tasks={tasks} />
        </Section>
      )}
      <Section title="Autres emplacements">
        <TaskList tasks={otherPlaces} />
      </Section>
      <Section title="Détails">
        <DetailsBlock single={single} multiple={multiple} count={sel.length} currentFolderPath={currentFolderPath} />
      </Section>
    </div>
  );
};

/** Bloc « Détails » : métadonnées de l'élément sélectionné ou de l'emplacement. */
const DetailsBlock: React.FC<{
  single: ExplorerItem | null;
  multiple: boolean;
  count: number;
  currentFolderPath: string | null;
}> = ({ single, multiple, count, currentFolderPath }) => {
  if (multiple) {
    return (
      <div className={styles.detailsBlock}>
        <div className={styles.detailsTitle}>{count} éléments sélectionnés</div>
      </div>
    );
  }
  if (single) {
    if (single.kind === 'drive') {
      const drive = VIRTUAL_DRIVES.find((d) => `drive:${d.id}` === single.key);
      return (
        <div className={styles.detailsBlock}>
          <div className={styles.detailsTitle}>{single.name}</div>
          <div className={styles.detailsText}>{single.typeLabel}</div>
          {drive?.totalBytes && drive.freeBytes !== undefined && (
            <>
              <div className={styles.detailsText}>Système de fichiers : NTFS</div>
              <div className={styles.detailsText}>Espace libre : {formatDiskSize(drive.freeBytes)}</div>
              <div className={styles.detailsText}>Taille totale : {formatDiskSize(drive.totalBytes)}</div>
            </>
          )}
        </div>
      );
    }
    return (
      <div className={styles.detailsBlock}>
        <div className={styles.detailsTitle}>{single.name}</div>
        <div className={styles.detailsText}>{single.typeLabel}</div>
        {single.kind === 'file' && single.sizeText && (
          <div className={styles.detailsText}>Taille : {single.sizeText}</div>
        )}
        {single.modifiedAt > 0 && (
          <div className={styles.detailsText}>Modifié le : {formatDateTime(single.modifiedAt)}</div>
        )}
      </div>
    );
  }
  if (currentFolderPath) {
    return (
      <div className={styles.detailsBlock}>
        <div className={styles.detailsTitle}>{folderDisplayName(currentFolderPath)}</div>
        <div className={styles.detailsText}>{isMusicFolder(currentFolderPath) ? 'Dossier de musique' : 'Dossier de fichiers'}</div>
      </div>
    );
  }
  return (
    <div className={styles.detailsBlock}>
      <div className={styles.detailsTitle}>Poste de travail</div>
      <div className={styles.detailsText}>Dossier système</div>
    </div>
  );
};
