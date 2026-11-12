/**
 * Actions de la Corbeille côté Explorateur (module pur, sans React).
 *
 * Le système de fichiers sait restaurer un élément et vider la Corbeille
 * (`restore`, `emptyTrash` dans `src/common/fs`). Ce module fait le lien avec
 * les éléments affichés : retrouver l'identifiant de Corbeille d'un élément,
 * restaurer une sélection et rapporter, pour chaque échec, une raison que
 * l'interface sait expliquer.
 */
import { FsError } from '@/common/fs';
import { ExplorerItem, TRASH_KEY_PREFIX } from './items';

/** L'élément affiché vient-il de la Corbeille ? */
export const isTrashItem = (item: ExplorerItem): boolean => item.key.startsWith(TRASH_KEY_PREFIX);

/** Identifiant de Corbeille d'un élément affiché, ou `null` s'il n'en vient pas. */
export const trashItemId = (item: ExplorerItem): string | null =>
  isTrashItem(item) ? item.key.slice(TRASH_KEY_PREFIX.length) : null;

/**
 * Pourquoi un élément n'a pas pu être restauré :
 *  - `nameTaken` : un élément du même nom occupe son emplacement d'origine ;
 *  - `folderMissing` : son dossier d'origine n'existe plus ;
 *  - `unknown` : toute autre erreur.
 */
export type RestoreFailureReason = 'nameTaken' | 'folderMissing' | 'unknown';

export interface RestoreFailure {
  name: string;
  reason: RestoreFailureReason;
}

const failureReason = (error: unknown): RestoreFailureReason => {
  if (!(error instanceof FsError)) return 'unknown';
  if (error.code === 'EEXIST') return 'nameTaken';
  if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return 'folderMissing';
  return 'unknown';
};

/**
 * Restaure chaque élément à son emplacement d'origine avec `restore` (l'action
 * du store FS). Les éléments qui ne viennent pas de la Corbeille sont ignorés.
 * Un échec n'arrête pas les suivants ; la liste des échecs est retournée.
 */
export const restoreTrashItems = (
  items: ExplorerItem[],
  restore: (trashItemId: string) => void
): RestoreFailure[] => {
  const failures: RestoreFailure[] = [];

  for (const item of items) {
    const id = trashItemId(item);
    if (id === null) continue;

    try {
      restore(id);
    } catch (error) {
      failures.push({ name: item.name, reason: failureReason(error) });
    }
  }

  return failures;
};
