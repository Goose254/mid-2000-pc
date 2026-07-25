/**
 * Construction des « éléments » affichés par l'Explorateur, unifiés quelle que
 * soit la source : entrées d'un dossier (FS), lecteurs virtuels du Poste de
 * travail, ou éléments de la Corbeille. Les vues (Détails, Icônes, Mosaïques…)
 * consomment ce type unique `ExplorerItem`.
 *
 * Module pur : il transforme des données (FsDirEntry / VirtualDrive / TrashItem)
 * en modèle d'affichage ; il n'accède ni au store FS ni aux stores de fenêtres.
 */
import type { FsDirEntry, TrashItem } from '@/common/fs';
import {
  VirtualDrive,
  entryIcon,
  entryTypeLabel,
  folderLocation,
  formatDateTime,
  formatDiskSize,
  formatSize,
  Location,
} from './model';

/** Nature d'affichage d'un élément. */
export type ItemKind = 'folder' | 'file' | 'drive';

export interface ExplorerItem {
  /** Clé unique de sélection (chemin FS, `drive:<id>`, ou `trash:<id>`). */
  key: string;
  /** Nom affiché. */
  name: string;
  kind: ItemKind;
  /** Icône (mise à l'échelle par la vue selon le mode). */
  icon: string;
  /** Libellé de type (colonne Type / volet Détails). */
  typeLabel: string;
  /** Taille en octets (0 pour dossiers/lecteurs). */
  size: number;
  /** Taille formatée pour la colonne Taille (vide pour dossiers). */
  sizeText: string;
  /** Date de modification (ms epoch, 0 si sans objet). */
  modifiedAt: number;
  /** Date de modification formatée (vide si sans objet). */
  modifiedText: string;
  /** Emplacement ouvert au double-clic (dossier/lecteur) ou null (fichier). */
  navigateTo: Location | null;
  /** Chemin FS (fichier/dossier) ou null (lecteur non prêt, sentinelle). */
  path: string | null;
  /** L'élément peut-il être renommé / supprimé ? (faux pour les lecteurs). */
  editable: boolean;
  /** Deuxième ligne des Mosaïques (type de lecteur, espace libre…). */
  secondary?: string;
  /** Lecteur non prêt (disquette/CD vide) → message d'erreur au double-clic. */
  notReady?: boolean;
}

/** Entrée de dossier FS → élément d'affichage. */
export const entryToItem = (entry: FsDirEntry): ExplorerItem => ({
  key: entry.path,
  name: entry.name,
  kind: entry.type === 'folder' ? 'folder' : 'file',
  icon: entryIcon(entry),
  typeLabel: entryTypeLabel(entry),
  size: entry.size,
  sizeText: formatSize(entry.type, entry.size),
  modifiedAt: entry.modifiedAt,
  modifiedText: formatDateTime(entry.modifiedAt),
  navigateTo: entry.type === 'folder' ? folderLocation(entry.path) : null,
  path: entry.path,
  editable: true,
});

/** Lecteur virtuel → élément d'affichage (vue Poste de travail). */
export const driveToItem = (drive: VirtualDrive): ExplorerItem => {
  const secondary =
    drive.location && drive.totalBytes && drive.freeBytes !== undefined
      ? `${formatDiskSize(drive.freeBytes)} libres sur ${formatDiskSize(drive.totalBytes)}`
      : drive.typeLabel;
  return {
    key: `drive:${drive.id}`,
    name: drive.label,
    kind: 'drive',
    icon: drive.icon,
    typeLabel: drive.typeLabel,
    size: 0,
    sizeText: '',
    modifiedAt: 0,
    modifiedText: '',
    navigateTo: drive.location,
    path: drive.location && drive.location.kind === 'folder' ? drive.location.path : null,
    editable: false,
    secondary,
    notReady: drive.location === null,
  };
};

/** Élément de Corbeille → élément d'affichage (avec emplacement d'origine). */
export const trashToItem = (item: TrashItem): ExplorerItem => {
  const isFolder = item.node.type === 'folder';
  return {
    key: `trash:${item.id}`,
    name: item.node.name,
    kind: isFolder ? 'folder' : 'file',
    icon: entryIcon({ name: item.node.name, type: item.node.type, path: item.originalPath }),
    typeLabel: entryTypeLabel({ name: item.node.name, type: item.node.type, path: item.originalPath }),
    size: item.node.type === 'file' ? item.node.size : 0,
    sizeText: formatSize(item.node.type, item.node.type === 'file' ? item.node.size : 0),
    modifiedAt: item.deletedAt,
    modifiedText: formatDateTime(item.deletedAt),
    navigateTo: null,
    path: null,
    editable: false,
    secondary: item.originalParent,
  };
};
