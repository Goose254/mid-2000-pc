/**
 * Modèle métier de l'Explorateur de fichiers (pur, sans dépendance UI/stores).
 *
 * On y définit :
 *  - la notion d'« emplacement » (Poste de travail / dossier / Corbeille) ;
 *  - les lecteurs virtuels du Poste de travail ;
 *  - la résolution d'icône, de libellé de type et de nom affiché d'un élément ;
 *  - le formatage XP des tailles (Ko) et des dates (JJ/MM/AAAA HH:MM).
 *
 * Ces fonctions sont directement testables et réutilisables par tous les
 * sous-composants (volet des tâches, arborescence, vues, barre d'état…).
 */
import { DRIVE, ROOT_PATH, SEPARATOR, getBaseName, getParentPath, normalizePath } from '@/common/fs';
import type { FsDirEntry, FsNodeType } from '@/common/fs';

// --- Icônes ----------------------------------------------------------------
import MyComputerIcon from '@/assets/windows-icons/explorer.exe_14_100-9.png';
import FolderIcon from '@/assets/windows-icons/shell32.dll_14_235-8.png';
import OpenFolderIcon from '@/assets/windows-icons/shell32.dll_14_267-6.png';
import LocalDiskIcon from '@/assets/windows-icons/shell32.dll_14_9-6.png';
import FloppyIcon from '@/assets/windows-icons/shell32.dll_14_7-6.png';
import CdDriveIcon from '@/assets/windows-icons/shell32.dll_14_12-6.png';
import MyDocumentsIcon from '@/assets/windows-icons/shell32.dll_14_235-9.png';
import MyPicturesIcon from '@/assets/windows-icons/folder-pics-16.png';
import MyMusicIcon from '@/assets/windows-icons/folder-music-32.png';
import FavorisIcon from '@/assets/windows-icons/favoris-32.png';
import RecycleIcon from '@/assets/windows-icons/shell32.dll_14_254-7.png';
import ControlPanelIcon from '@/assets/windows-icons/shell32.dll_14_137-8.png';
import NetworkPlacesIcon from '@/assets/windows-icons/hnetcfg.dll_14_60.png';
import FileTextIcon from '@/assets/windows-icons/file-text-32.png';
import FileGenericIcon from '@/assets/windows-icons/file-generic-16.png';

export {
  MyComputerIcon,
  FolderIcon,
  OpenFolderIcon,
  LocalDiskIcon,
  FloppyIcon,
  CdDriveIcon,
  MyDocumentsIcon,
  MyPicturesIcon,
  MyMusicIcon,
  FavorisIcon,
  RecycleIcon,
  ControlPanelIcon,
  NetworkPlacesIcon,
  FileTextIcon,
  FileGenericIcon,
};

// ---------------------------------------------------------------------------
// Emplacements
// ---------------------------------------------------------------------------

/** Un emplacement navigable de l'Explorateur. */
export type Location =
  | { kind: 'computer' } // « Poste de travail » (racine virtuelle : les lecteurs)
  | { kind: 'folder'; path: string } // un dossier réel du lecteur C:
  | { kind: 'trash' }; // la Corbeille (liste `trash` du store FS)

export const COMPUTER: Location = { kind: 'computer' };
export const TRASH: Location = { kind: 'trash' };
export const folderLocation = (path: string): Location => ({ kind: 'folder', path: normalizePath(path) });

/** Deux emplacements sont-ils identiques ? */
export const sameLocation = (a: Location, b: Location): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'folder' && b.kind === 'folder') return a.path === b.path;
  return true;
};

// ---------------------------------------------------------------------------
// Dossiers spéciaux (chemins canoniques de la simulation)
// ---------------------------------------------------------------------------

/** Chemins spéciaux reconnus (icônes + libellés dédiés). */
export const SPECIAL_PATHS = {
  myDocuments: 'C:\\Mes documents',
  myPictures: 'C:\\Mes documents\\Mes images',
  myMusic: 'C:\\Mes documents\\Ma musique',
  favoris: 'C:\\Documents and Settings\\Utilisateur\\Favoris',
  sharedDocuments: 'C:\\Documents and Settings\\All Users',
} as const;

/** Un dossier « images » (vue Miniatures + tâches « Gestion des images » par défaut). */
export const isPictureFolder = (path: string): boolean =>
  normalizePath(path).toLowerCase() === SPECIAL_PATHS.myPictures.toLowerCase();

/** Un dossier « musique ». */
export const isMusicFolder = (path: string): boolean =>
  normalizePath(path).toLowerCase() === SPECIAL_PATHS.myMusic.toLowerCase();

// ---------------------------------------------------------------------------
// Lecteurs virtuels du Poste de travail
// ---------------------------------------------------------------------------

export type DriveGroup = 'hdd' | 'removable';

export interface VirtualDrive {
  id: string;
  /** Libellé affiché, ex. « Disque local (C:) ». */
  label: string;
  icon: string;
  group: DriveGroup;
  /** Emplacement ouvert au double-clic (null = lecteur non prêt). */
  location: Location | null;
  /** Libellé de type (colonne Type / volet Détails). */
  typeLabel: string;
  /** Capacité totale simulée (octets), pour le volet Détails. */
  totalBytes?: number;
  /** Espace libre simulé (octets). */
  freeBytes?: number;
}

/** Lecteurs présentés dans « Poste de travail ». Seul C: est « prêt ». */
export const VIRTUAL_DRIVES: VirtualDrive[] = [
  {
    id: 'C',
    label: 'Disque local (C:)',
    icon: LocalDiskIcon,
    group: 'hdd',
    location: folderLocation(ROOT_PATH),
    typeLabel: 'Disque local',
    totalBytes: 40 * 1024 ** 3, // 40 Go
    freeBytes: 27 * 1024 ** 3,
  },
  {
    id: 'A',
    label: 'Disquette 3½ (A:)',
    icon: FloppyIcon,
    group: 'removable',
    location: null,
    typeLabel: 'Disquette 3½ pouces',
  },
  {
    id: 'D',
    label: 'Lecteur CD (D:)',
    icon: CdDriveIcon,
    group: 'removable',
    location: null,
    typeLabel: 'Disque compact',
  },
];

/** Groupes de la vue « Poste de travail » (ordre et intitulés FR par défaut). */
export interface DriveGroupDef {
  key: string;
  title: string;
  drives: VirtualDrive[];
}

export const computerGroups = (): DriveGroupDef[] => [
  {
    key: 'hdd',
    title: 'Disques durs',
    drives: VIRTUAL_DRIVES.filter((d) => d.group === 'hdd'),
  },
  {
    key: 'removable',
    title: 'Périphériques utilisant des supports amovibles',
    drives: VIRTUAL_DRIVES.filter((d) => d.group === 'removable'),
  },
];

/** Un chemin C:\… correspond-il à un lecteur (racine C:\) ? */
export const isDriveRoot = (path: string): boolean => normalizePath(path) === ROOT_PATH;

// ---------------------------------------------------------------------------
// Résolution d'icône / type / nom affiché
// ---------------------------------------------------------------------------

/** Extension en minuscules SANS le point, ou '' si aucune. */
export const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.');
  if (dot <= 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
};

const IMAGE_EXTS = new Set(['bmp', 'jpg', 'jpeg', 'gif', 'png', 'tif', 'tiff', 'ico']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'wma', 'mid', 'midi']);
const TEXT_EXTS = new Set(['txt', 'log', 'nfo', 'me', '1st', 'text']);

/** Libellé de type d'un fichier d'après son extension (colonne Type). */
export const fileTypeLabel = (name: string): string => {
  const ext = extensionOf(name);
  switch (ext) {
    case '':
      return 'Fichier';
    case 'txt':
    case 'text':
      return 'Document texte';
    case 'log':
      return 'Document texte';
    case 'ini':
      return 'Paramètres de configuration';
    case 'inf':
      return "Informations d'installation";
    case 'doc':
      return 'Document Microsoft Word';
    case 'rtf':
      return 'Format RTF';
    case 'bmp':
      return 'Image bitmap';
    case 'jpg':
    case 'jpeg':
      return 'Image JPEG';
    case 'gif':
      return 'Image GIF';
    case 'png':
      return 'Image PNG';
    case 'mp3':
      return 'Son MP3';
    case 'wav':
      return 'Son Wave';
    case 'exe':
      return 'Application';
    case 'dll':
      return "Extension de l'application";
    case 'htm':
    case 'html':
      return 'Document HTML';
    case 'zip':
      return 'Dossier compressé';
    default:
      return `Fichier ${ext.toUpperCase()}`;
  }
};

/** Libellé de type d'un dossier (spécial ou générique). */
export const folderTypeLabel = (path: string): string => {
  if (isDriveRoot(path)) return 'Disque local';
  return 'Dossier de fichiers';
};

/** Icône d'un fichier (16px pour Liste/Détails ; 32px pour Icônes/Mosaïques). */
export const fileIcon = (name: string): string => {
  const ext = extensionOf(name);
  if (TEXT_EXTS.has(ext) || ext === 'ini' || ext === 'inf' || ext === '') return FileTextIcon;
  if (IMAGE_EXTS.has(ext)) return FileGenericIcon;
  if (AUDIO_EXTS.has(ext)) return MyMusicIcon;
  return FileTextIcon;
};

/** Icône d'un dossier selon son chemin (dossiers spéciaux reconnus). */
export const folderIcon = (path: string): string => {
  const p = normalizePath(path).toLowerCase();
  if (p === SPECIAL_PATHS.myDocuments.toLowerCase()) return MyDocumentsIcon;
  if (p === SPECIAL_PATHS.myPictures.toLowerCase()) return MyPicturesIcon;
  if (p === SPECIAL_PATHS.myMusic.toLowerCase()) return MyMusicIcon;
  if (p === SPECIAL_PATHS.favoris.toLowerCase()) return FavorisIcon;
  return FolderIcon;
};

/** Icône d'une entrée de dossier (fichier ou sous-dossier). */
export const entryIcon = (entry: Pick<FsDirEntry, 'name' | 'type' | 'path'>): string =>
  entry.type === 'folder' ? folderIcon(entry.path) : fileIcon(entry.name);

/** Libellé de type d'une entrée. */
export const entryTypeLabel = (entry: Pick<FsDirEntry, 'name' | 'type' | 'path'>): string =>
  entry.type === 'folder' ? folderTypeLabel(entry.path) : fileTypeLabel(entry.name);

// ---------------------------------------------------------------------------
// Libellés d'emplacement
// ---------------------------------------------------------------------------

/** Nom affiché d'un dossier (dossiers spéciaux → nom convivial, racine → lecteur). */
export const folderDisplayName = (path: string): string => {
  const norm = normalizePath(path);
  if (isDriveRoot(norm)) return 'Disque local (C:)';
  return getBaseName(norm) || DRIVE;
};

/** Nom affiché d'un emplacement (barre de titre, barre d'adresse, onglet…). */
export const locationTitle = (loc: Location): string => {
  switch (loc.kind) {
    case 'computer':
      return 'Poste de travail';
    case 'trash':
      return 'Corbeille';
    case 'folder':
      return folderDisplayName(loc.path);
  }
};

/** Icône d'un emplacement (barre de titre / barre d'adresse). */
export const locationIcon = (loc: Location): string => {
  switch (loc.kind) {
    case 'computer':
      return MyComputerIcon;
    case 'trash':
      return RecycleIcon;
    case 'folder':
      return isDriveRoot(loc.path) ? LocalDiskIcon : folderIcon(loc.path);
  }
};

/** Emplacement parent (remonter d'un niveau), ou null si déjà à la racine. */
export const parentLocation = (loc: Location): Location | null => {
  switch (loc.kind) {
    case 'computer':
      return null;
    case 'trash':
      return COMPUTER; // la Corbeille « remonte » vers le Bureau/Poste de travail
    case 'folder': {
      if (isDriveRoot(loc.path)) return COMPUTER; // C:\ remonte vers Poste de travail
      const parent = getParentPath(loc.path);
      return parent ? folderLocation(parent) : COMPUTER;
    }
  }
};

// ---------------------------------------------------------------------------
// Formatage XP
// ---------------------------------------------------------------------------

/** Taille façon XP : arrondi supérieur au Ko, séparateur de milliers FR. Dossiers → ''. */
export const formatSize = (type: FsNodeType, bytes: number): string => {
  if (type === 'folder') return '';
  const ko = Math.max(bytes === 0 ? 0 : 1, Math.ceil(bytes / 1024));
  return `${ko.toLocaleString('fr-FR')} Ko`;
};

/** Taille d'espace disque façon XP : « 27,0 Go », « 512 Mo »… */
export const formatDiskSize = (bytes: number): string => {
  const go = bytes / 1024 ** 3;
  if (go >= 1) return `${go.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Go`;
  const mo = bytes / 1024 ** 2;
  return `${Math.round(mo).toLocaleString('fr-FR')} Mo`;
};

/** Date/heure façon XP : « JJ/MM/AAAA HH:MM ». */
export const formatDateTime = (epochMs: number): string => {
  const d = new Date(epochMs);
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
};

/** Compteur d'objets façon barre d'état : « 3 objets » / « 1 objet ». */
export const objectCount = (n: number): string => `${n} ${n <= 1 ? 'objet' : 'objets'}`;

// ---------------------------------------------------------------------------
// Modes d'affichage
// ---------------------------------------------------------------------------

export type ViewMode = 'thumbnails' | 'tiles' | 'icons' | 'list' | 'details';

export const VIEW_MODES: { mode: ViewMode; label: string }[] = [
  { mode: 'thumbnails', label: 'Miniatures' },
  { mode: 'tiles', label: 'Mosaïques' },
  { mode: 'icons', label: 'Icônes' },
  { mode: 'list', label: 'Liste' },
  { mode: 'details', label: 'Détails' },
];

/** Vue par défaut d'un emplacement (Miniatures pour les dossiers d'images). */
export const defaultViewMode = (loc: Location): ViewMode => {
  if (loc.kind === 'folder' && isPictureFolder(loc.path)) return 'thumbnails';
  return 'tiles';
};

// ---------------------------------------------------------------------------
// Tri (colonnes Détails)
// ---------------------------------------------------------------------------

export type SortKey = 'name' | 'size' | 'type' | 'modifiedAt';
export type SortDir = 'asc' | 'desc';

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

/** Compare deux entrées selon la colonne/direction, dossiers toujours avant fichiers. */
export const compareEntries = (
  a: FsDirEntry,
  b: FsDirEntry,
  key: SortKey,
  dir: SortDir,
): number => {
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1; // dossiers d'abord
  const sign = dir === 'asc' ? 1 : -1;
  switch (key) {
    case 'size':
      return sign * (a.size - b.size);
    case 'modifiedAt':
      return sign * (a.modifiedAt - b.modifiedAt);
    case 'type': {
      const ta = a.type === 'folder' ? folderTypeLabel(a.path) : fileTypeLabel(a.name);
      const tb = b.type === 'folder' ? folderTypeLabel(b.path) : fileTypeLabel(b.name);
      return sign * (collator.compare(ta, tb) || collator.compare(a.name, b.name));
    }
    case 'name':
    default:
      return sign * collator.compare(a.name, b.name);
  }
};

export { SEPARATOR };
