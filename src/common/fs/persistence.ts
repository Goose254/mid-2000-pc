/**
 * Persistance du système de fichiers dans le localStorage.
 *
 * Le projet n'a pas de helper de persistance dédié : on suit la même approche
 * que `usersStore.ts` (lecture / écriture encapsulées dans des try/catch
 * tolérants au mode privé et au quota dépassé). Les fonctions `serializeFs` /
 * `deserializeFs` sont pures et directement testables.
 */
import { createInitialRoot } from './initialTree';
import { FsFolderNode, FsNode, PersistedFs, TrashItem } from './types';

/** Clé de stockage versionnée (convention kebab-case du projet). */
export const FS_STORAGE_KEY = 'mid-2000-pc-fs-v1';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Garde de type d'un nœud (validation défensive au chargement). */
const isFsNode = (value: unknown): value is FsNode => {
  if (!isObject(value)) return false;
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.createdAt !== 'number' ||
    typeof value.modifiedAt !== 'number'
  ) {
    return false;
  }
  if (value.type === 'file') {
    return typeof value.content === 'string' && typeof value.size === 'number';
  }
  if (value.type === 'folder') {
    return Array.isArray(value.children) && value.children.every(isFsNode);
  }
  return false;
};

const isFsFolderNode = (value: unknown): value is FsFolderNode =>
  isFsNode(value) && value.type === 'folder';

const isTrashItem = (value: unknown): value is TrashItem =>
  isObject(value) &&
  typeof value.id === 'string' &&
  typeof value.originalPath === 'string' &&
  typeof value.originalParent === 'string' &&
  typeof value.deletedAt === 'number' &&
  isFsNode(value.node);

const isPersistedFs = (value: unknown): value is PersistedFs =>
  isObject(value) &&
  isFsFolderNode(value.root) &&
  Array.isArray(value.trash) &&
  value.trash.every(isTrashItem);

/** Sérialise l'état du FS en chaîne JSON. */
export const serializeFs = (state: PersistedFs): string => JSON.stringify(state);

/** Désérialise et valide une chaîne JSON. Renvoie `null` en cas de forme invalide. */
export const deserializeFs = (raw: string): PersistedFs | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isPersistedFs(parsed) ? parsed : null;
  } catch {
    // JSON illisible : on ignore et on laisse l'appelant retomber sur le seed.
    return null;
  }
};

/** Construit un état de FS neuf (arborescence initiale + corbeille vide). */
export const createInitialFs = (): PersistedFs => ({
  root: createInitialRoot(Date.now()),
  trash: [],
});

/** Charge le FS depuis le localStorage, avec repli tolérant sur le seed. */
export const loadFs = (): PersistedFs => {
  if (typeof window === 'undefined') {
    return createInitialFs();
  }
  try {
    const raw = window.localStorage.getItem(FS_STORAGE_KEY);
    if (!raw) {
      return createInitialFs();
    }
    const parsed = deserializeFs(raw);
    return parsed ?? createInitialFs();
  } catch {
    // Mode privé / accès localStorage refusé : on repart d'un FS neuf.
    return createInitialFs();
  }
};

/** Sauvegarde le FS dans le localStorage (silencieux en cas d'échec). */
export const saveFs = (state: PersistedFs): void => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(FS_STORAGE_KEY, serializeFs(state));
  } catch {
    // Ignore silencieusement les erreurs de stockage (mode privé / quota).
  }
};
