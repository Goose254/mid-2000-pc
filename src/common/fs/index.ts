/**
 * Point d'entrée public du socle de système de fichiers virtuel.
 *
 * Les couches supérieures (Explorateur, Bloc-notes, Paint…) importent depuis
 * `@/common/fs` — jamais les fichiers internes directement.
 */
export type {
  FsNode,
  FsNodeType,
  FsFileNode,
  FsFolderNode,
  FsDirEntry,
  FsStat,
  TrashItem,
  PersistedFs,
} from './types';
export { FsError } from './errors';
export type { FsErrorCode } from './errors';
export {
  DRIVE,
  SEPARATOR,
  ROOT_PATH,
  normalizePath,
  splitPath,
  joinSegments,
  getParentPath,
  getBaseName,
  childPath,
  isSameOrDescendant,
  isValidName,
} from './paths';
export { FS_STORAGE_KEY } from './persistence';
export { useFsStore } from './fsStore';
export type { FsState } from './fsStore';
