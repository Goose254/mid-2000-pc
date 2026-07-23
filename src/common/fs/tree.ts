/**
 * Fonctions PURES d'appui manipulant l'arbre de nœuds (navigation, fabrique,
 * clonage). Le store `fsStore` s'appuie dessus pour rester lisible.
 */
import { FsFileNode, FsFolderNode, FsNode } from './types';

/** Taille en octets d'un contenu texte (encodage UTF-8). */
export const byteLength = (text: string): number => {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  // Repli si TextEncoder est indisponible : comptage manuel des octets UTF-8.
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      // Paire de substitution (caractère hors BMP) : 4 octets.
      bytes += 4;
      i += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
};

/** Génère un identifiant stable pour un nœud (UUID si disponible). */
export const generateNodeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fsnode-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

/** Clone profond d'un nœud (les nœuds sont sérialisables JSON). */
export const cloneNode = <T extends FsNode>(node: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(node);
  }
  return JSON.parse(JSON.stringify(node)) as T;
};

/** Fabrique un nouveau nœud dossier vide. */
export const createFolderNode = (name: string, now: number): FsFolderNode => ({
  id: generateNodeId(),
  name,
  type: 'folder',
  createdAt: now,
  modifiedAt: now,
  children: [],
});

/** Fabrique un nouveau nœud fichier (la taille est dérivée du contenu). */
export const createFileNode = (name: string, content: string, now: number): FsFileNode => ({
  id: generateNodeId(),
  name,
  type: 'file',
  content,
  size: byteLength(content),
  createdAt: now,
  modifiedAt: now,
});

/**
 * Recherche un enfant par nom, insensible à la casse (façon Windows, qui
 * préserve la casse mais l'ignore pour la résolution).
 */
export const findChild = (folder: FsFolderNode, name: string): FsNode | undefined =>
  folder.children.find((child) => child.name.toLowerCase() === name.toLowerCase());

/**
 * Résout un nœud à partir de segments normalisés. Renvoie `null` si un segment
 * est absent ou si un segment intermédiaire n'est pas un dossier.
 */
export const resolveNode = (root: FsFolderNode, segments: string[]): FsNode | null => {
  let current: FsNode = root;
  for (const segment of segments) {
    if (current.type !== 'folder') return null;
    const next = findChild(current, segment);
    if (!next) return null;
    current = next;
  }
  return current;
};

/**
 * Réattribue récursivement de nouveaux identifiants et timestamps à un
 * sous-arbre (utilisé par `copy`, qui doit produire des nœuds distincts).
 */
export const reassignIds = (node: FsNode, now: number): void => {
  node.id = generateNodeId();
  node.createdAt = now;
  node.modifiedAt = now;
  if (node.type === 'folder') {
    for (const child of node.children) {
      reassignIds(child, now);
    }
  }
};
