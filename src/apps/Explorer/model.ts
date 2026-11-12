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
import { COMPUTER, SPECIAL_PATHS, TRASH } from './locations';
import type { Location } from './locations';

// Types et constantes d'emplacement : définis dans `locations.ts` (module sans
// dépendance, utilisable par le registre des applications) et réexportés ici.
export { COMPUTER, SPECIAL_PATHS, TRASH };
export type { Location };

// --- Icônes multi-tailles (16/24/32/48) ------------------------------------
// Chaque entité expose un jeu d'icônes ; les vues choisissent la taille adaptée
// (16 pour Détails/Liste/arborescence, 32 pour Icônes, 48 pour Mosaïques/Miniatures).
import Computer16 from '@/assets/windows-icons/mycomputer-16.png';
import Computer24 from '@/assets/windows-icons/mycomputer-24.png';
import Computer32 from '@/assets/windows-icons/mycomputer-32.png';
import Computer48 from '@/assets/windows-icons/mycomputer-48.png';
import Folder16 from '@/assets/windows-icons/folder-16.png';
import Folder24 from '@/assets/windows-icons/folder-24.png';
import Folder32 from '@/assets/windows-icons/folder-32.png';
import Folder48 from '@/assets/windows-icons/folder-48.png';
import Pics16 from '@/assets/windows-icons/folder-pics-16.png';
import Pics24 from '@/assets/windows-icons/folder-pics-24.png';
import Pics32 from '@/assets/windows-icons/folder-pics-32.png';
import Pics48 from '@/assets/windows-icons/folder-pics-48.png';
import Music16 from '@/assets/windows-icons/folder-music-16.png';
import Music24 from '@/assets/windows-icons/folder-music-24.png';
import Music32 from '@/assets/windows-icons/folder-music-32.png';
import Music48 from '@/assets/windows-icons/folder-music-48.png';
import Favoris16 from '@/assets/windows-icons/favoris-16.png';
import Favoris24 from '@/assets/windows-icons/favoris-24.png';
import Favoris32 from '@/assets/windows-icons/favoris-32.png';
import Favoris48 from '@/assets/windows-icons/favoris-48.png';
import MyDocs32 from '@/assets/windows-icons/shell32.dll_14_235-9.png';
import MyDocs48 from '@/assets/windows-icons/shell32.dll_14_235-8.png';
import LocalDisk48 from '@/assets/windows-icons/shell32.dll_14_9-6.png';
import Floppy48 from '@/assets/windows-icons/shell32.dll_14_7-6.png';
import Cd48 from '@/assets/windows-icons/shell32.dll_14_12-6.png';
import Recycle32 from '@/assets/windows-icons/shell32.dll_14_254-7.png';
import ControlPanel32 from '@/assets/windows-icons/shell32.dll_14_137-8.png';
import NetworkPlaces from '@/assets/windows-icons/hnetcfg.dll_14_60.png';
import FileText16 from '@/assets/windows-icons/file-text-16.png';
import FileText32 from '@/assets/windows-icons/file-text-32.png';
import FileGeneric16 from '@/assets/windows-icons/file-generic-16.png';

/** Jeu d'icônes d'une entité, indexé par taille (px). */
export interface IconSet {
  16: string;
  24: string;
  32: string;
  48: string;
}

const iconSet = (s16: string, s24: string, s32: string, s48: string): IconSet => ({
  16: s16,
  24: s24,
  32: s32,
  48: s48,
});
/** Réplique une icône unique sur toutes les tailles (mise à l'échelle CSS). */
const uniform = (src: string): IconSet => iconSet(src, src, src, src);

export type IconSize = 16 | 24 | 32 | 48;

/** Choisit dans un jeu l'icône de la taille demandée. */
export const pickIcon = (set: IconSet, size: IconSize): string => set[size];

// Jeux d'icônes.
export const COMPUTER_ICONS = iconSet(Computer16, Computer24, Computer32, Computer48);
export const FOLDER_ICONS = iconSet(Folder16, Folder24, Folder32, Folder48);
export const PICS_ICONS = iconSet(Pics16, Pics24, Pics32, Pics48);
export const MUSIC_ICONS = iconSet(Music16, Music24, Music32, Music48);
export const FAVORIS_ICONS = iconSet(Favoris16, Favoris24, Favoris32, Favoris48);
export const MYDOCS_ICONS = iconSet(MyDocs32, MyDocs32, MyDocs32, MyDocs48);
export const FILE_TEXT_ICONS = iconSet(FileText16, FileText16, FileText32, FileText32);
export const FILE_GENERIC_ICONS = uniform(FileGeneric16);
export const LOCALDISK_ICONS = uniform(LocalDisk48);
export const FLOPPY_ICONS = uniform(Floppy48);
export const CD_ICONS = uniform(Cd48);
export const RECYCLE_ICONS = uniform(Recycle32);

// Icônes uniques (16px) pour le volet des tâches / l'arborescence / les dialogues.
export const MyComputerIcon = Computer16;
export const FolderIcon = Folder16;
export const OpenFolderIcon = Folder16;
export const MyDocumentsIcon = MyDocs32;
export const MyPicturesIcon = Pics16;
export const MyMusicIcon = Music16;
export const FavorisIcon = Favoris16;
export const RecycleIcon = Recycle32;
export const ControlPanelIcon = ControlPanel32;
export const NetworkPlacesIcon = NetworkPlaces;
export const FileTextIcon = FileText32;
export const FileGenericIcon = FileGeneric16;
export const LocalDiskIcon = LocalDisk48;
export const FloppyIcon = Floppy48;
export const CdDriveIcon = Cd48;

// ---------------------------------------------------------------------------
// Emplacements
// ---------------------------------------------------------------------------

export const folderLocation = (path: string): Location => ({ kind: 'folder', path: normalizePath(path) });

/** Deux emplacements sont-ils identiques ? */
export const sameLocation = (a: Location, b: Location): boolean => {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'folder' && b.kind === 'folder') return a.path === b.path;
  return true;
};

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
  icons: IconSet;
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
    icons: LOCALDISK_ICONS,
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
    icons: FLOPPY_ICONS,
    group: 'removable',
    location: null,
    typeLabel: 'Disquette 3½ pouces',
  },
  {
    id: 'D',
    label: 'Lecteur CD (D:)',
    icon: CdDriveIcon,
    icons: CD_ICONS,
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

/** Jeu d'icônes d'un fichier selon son extension. */
export const fileIconSet = (name: string): IconSet => {
  const ext = extensionOf(name);
  if (IMAGE_EXTS.has(ext)) return FILE_GENERIC_ICONS;
  if (AUDIO_EXTS.has(ext)) return MUSIC_ICONS;
  if (TEXT_EXTS.has(ext) || ext === 'ini' || ext === 'inf' || ext === '') return FILE_TEXT_ICONS;
  return FILE_TEXT_ICONS;
};

/** Jeu d'icônes d'un dossier selon son chemin (dossiers spéciaux reconnus). */
export const folderIconSet = (path: string): IconSet => {
  const p = normalizePath(path).toLowerCase();
  if (p === SPECIAL_PATHS.myDocuments.toLowerCase()) return MYDOCS_ICONS;
  if (p === SPECIAL_PATHS.myPictures.toLowerCase()) return PICS_ICONS;
  if (p === SPECIAL_PATHS.myMusic.toLowerCase()) return MUSIC_ICONS;
  if (p === SPECIAL_PATHS.favoris.toLowerCase()) return FAVORIS_ICONS;
  return FOLDER_ICONS;
};

/** Jeu d'icônes d'une entrée (fichier ou sous-dossier). */
export const entryIconSet = (entry: Pick<FsDirEntry, 'name' | 'type' | 'path'>): IconSet =>
  entry.type === 'folder' ? folderIconSet(entry.path) : fileIconSet(entry.name);

/** Icône 16px d'un dossier (arborescence, volet des tâches). */
export const folderIcon = (path: string): string => pickIcon(folderIconSet(path), 16);

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

/** Jeu d'icônes d'un emplacement. */
export const locationIconSet = (loc: Location): IconSet => {
  switch (loc.kind) {
    case 'computer':
      return COMPUTER_ICONS;
    case 'trash':
      return RECYCLE_ICONS;
    case 'folder':
      return isDriveRoot(loc.path) ? LOCALDISK_ICONS : folderIconSet(loc.path);
  }
};

/** Icône d'un emplacement à la taille voulue (16px par défaut : barre de titre/adresse). */
export const locationIcon = (loc: Location, size: IconSize = 16): string => pickIcon(locationIconSet(loc), size);

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
