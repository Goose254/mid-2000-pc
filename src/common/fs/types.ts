/**
 * Types du système de fichiers virtuel.
 *
 * Représentation retenue : un ARBRE IMBRIQUÉ (chaque dossier contient la liste
 * de ses enfants). Ce choix est motivé par les opérations structurantes du FS :
 *  - `move` / `rename` d'un dossier = simple détachement / rattachement de
 *    sous-arbre, sans re-clé de tous les descendants (ce qu'imposerait une table
 *    plate chemin→nœud) ;
 *  - `readDir` = lecture directe des enfants du nœud, sans balayage global ;
 *  - sérialisation JSON naturelle (l'arbre est déjà un objet imbriqué), donc une
 *    persistance localStorage triviale.
 */

/** Nature d'un nœud du système de fichiers. */
export type FsNodeType = 'file' | 'folder';

/** Nœud fichier : porte le contenu et une taille dérivée (octets). */
export interface FsFileNode {
  id: string;
  name: string;
  type: 'file';
  /** Contenu texte (Bloc-notes, WordPad…). */
  content: string;
  /**
   * Réservé aux contenus non-texte (image Paint…) sous forme de data URL
   * base64. Optionnel : la plupart des fichiers sont de simples textes.
   */
  dataUrl?: string;
  /** Type MIME optionnel associé au contenu binaire. */
  mimeType?: string;
  /** Taille en octets, DÉRIVÉE du contenu (jamais saisie à la main). */
  size: number;
  /** Timestamps (millisecondes epoch). */
  createdAt: number;
  modifiedAt: number;
}

/** Nœud dossier : contient ses enfants. */
export interface FsFolderNode {
  id: string;
  name: string;
  type: 'folder';
  createdAt: number;
  modifiedAt: number;
  /** Enfants (fichiers et sous-dossiers) de ce dossier. */
  children: FsNode[];
}

/** Union discriminée d'un nœud du système de fichiers. */
export type FsNode = FsFileNode | FsFolderNode;

/** Entrée renvoyée par `readDir` (vue « plate » d'un enfant). */
export interface FsDirEntry {
  name: string;
  type: FsNodeType;
  size: number;
  createdAt: number;
  modifiedAt: number;
  /** Chemin absolu normalisé de l'entrée. */
  path: string;
}

/** Métadonnées renvoyées par `stat`. */
export interface FsStat {
  name: string;
  type: FsNodeType;
  size: number;
  createdAt: number;
  modifiedAt: number;
  /** Chemin absolu normalisé du nœud. */
  path: string;
}

/** Élément de la Corbeille (Recycle Bin). */
export interface TrashItem {
  /** Identifiant stable de l'élément corbeille (distinct de l'id du nœud). */
  id: string;
  /** Sous-arbre supprimé, conservé intact pour la restauration. */
  node: FsNode;
  /** Chemin d'origine complet (dossier parent + nom). */
  originalPath: string;
  /** Chemin du dossier parent d'origine. */
  originalParent: string;
  /** Date de mise en corbeille (millisecondes epoch). */
  deletedAt: number;
}

/** Forme persistée dans le localStorage. */
export interface PersistedFs {
  root: FsFolderNode;
  trash: TrashItem[];
}
