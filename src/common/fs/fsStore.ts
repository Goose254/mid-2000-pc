/**
 * Store Zustand du système de fichiers virtuel.
 *
 * L'état porte l'arbre (`root`) et la Corbeille (`trash`), persistés dans le
 * localStorage à chaque mutation. Les lectures (`stat`, `readDir`, `readFile`)
 * sont sans effet de bord ; les écritures travaillent sur un CLONE de l'arbre
 * puis remplacent l'état (immutabilité à la frontière du store), ce qui rend les
 * mutations d'un arbre profondément imbriqué à la fois simples et sûres.
 */
import { create } from 'zustand';
import { FsError } from './errors';
import { createInitialFs, loadFs, saveFs } from './persistence';
import {
  assertValidName,
  childPath,
  isSameOrDescendant,
  joinSegments,
  normalizePath,
  splitPath,
} from './paths';
import {
  byteLength,
  cloneNode,
  createFileNode,
  createFolderNode,
  findChild,
  generateNodeId,
  reassignIds,
  resolveNode,
} from './tree';
import { FsDirEntry, FsFolderNode, FsNode, FsStat, PersistedFs, TrashItem } from './types';

/** Résout un nœud à partir d'un chemin (peut lever EINVAL si chemin invalide). */
const resolveByPath = (root: FsFolderNode, path: string): FsNode | null =>
  resolveNode(root, splitPath(path).segments);

/** Construit un `FsStat` à partir d'un nœud et de son chemin normalisé. */
const toStat = (node: FsNode, path: string): FsStat => ({
  name: node.name,
  type: node.type,
  size: node.type === 'file' ? node.size : 0,
  createdAt: node.createdAt,
  modifiedAt: node.modifiedAt,
  path,
});

/** Ordre d'affichage : dossiers d'abord, puis tri alphabétique insensible à la casse. */
const compareNodes = (a: FsNode, b: FsNode): number => {
  if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
  return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
};

export interface FsState {
  /** Racine du lecteur `C:`. */
  root: FsFolderNode;
  /** Corbeille (éléments supprimés, restaurables). */
  trash: TrashItem[];

  // --- Lecture ---
  /** Métadonnées d'un nœud, ou `null` si le chemin (valide) n'existe pas. */
  stat: (path: string) => FsStat | null;
  /** Vrai si le chemin existe (tolérant : `false` sur chemin invalide). */
  exists: (path: string) => boolean;
  /** Liste des entrées d'un dossier (triées). Lève ENOENT / ENOTDIR. */
  readDir: (path: string) => FsDirEntry[];
  /** Contenu texte d'un fichier. Lève ENOENT / EISDIR. */
  readFile: (path: string) => string;

  // --- Écriture / structure ---
  /** Crée ou écrase un fichier ; met à jour taille et date de modification. */
  writeFile: (path: string, content: string) => void;
  /** Crée un dossier (récursif optionnel). */
  mkdir: (path: string, options?: { recursive?: boolean }) => void;
  /** Renomme un nœud (dans son dossier courant). */
  rename: (path: string, newName: string) => void;
  /** Déplace un nœud dans un dossier destination (nom conservé). */
  move: (src: string, destDir: string) => void;
  /** Copie (profonde) un nœud dans un dossier destination (nom optionnel). */
  copy: (src: string, destDir: string, newName?: string) => void;

  // --- Corbeille ---
  /** Envoie un nœud à la Corbeille (pas de suppression sèche par défaut). */
  remove: (path: string) => void;
  /** Restaure un élément de la Corbeille à son emplacement d'origine. */
  restore: (trashItemId: string) => void;
  /** Vide la Corbeille (suppression définitive de tout son contenu). */
  emptyTrash: () => void;
  /** Supprime définitivement un nœud, sans passer par la Corbeille. */
  deletePermanently: (path: string) => void;
  /** Copie de la liste des éléments en Corbeille. */
  listTrash: () => TrashItem[];

  // --- Maintenance ---
  /** Réinitialise le FS à l'arborescence initiale (corbeille vidée). */
  reset: () => void;
}

export const useFsStore = create<FsState>((set, get) => {
  const initial = loadFs();
  // Amorce la persistance au premier lancement (comme `usersStore`).
  saveFs(initial);

  /**
   * Applique une mutation sur un clone de l'état puis persiste le résultat.
   * Si `mutate` lève une erreur, l'état n'est pas modifié (aucun `set` validé).
   */
  const applyMutation = (
    mutate: (root: FsFolderNode, trash: TrashItem[]) => PersistedFs,
  ): void => {
    set((state) => {
      const root = cloneNode(state.root);
      const trash = state.trash.slice();
      const next = mutate(root, trash);
      saveFs(next);
      return next;
    });
  };

  return {
    root: initial.root,
    trash: initial.trash,

    // ------------------------------------------------------------------
    // Lecture
    // ------------------------------------------------------------------
    stat: (path) => {
      const node = resolveByPath(get().root, path);
      return node ? toStat(node, normalizePath(path)) : null;
    },

    exists: (path) => {
      try {
        return resolveByPath(get().root, path) !== null;
      } catch {
        // Chemin invalide : considéré comme inexistant.
        return false;
      }
    },

    readDir: (path) => {
      const normalized = normalizePath(path);
      const node = resolveByPath(get().root, path);
      if (!node) throw new FsError('ENOENT', `Dossier introuvable : ${path}`, path);
      if (node.type !== 'folder') throw new FsError('ENOTDIR', `N'est pas un dossier : ${path}`, path);
      return [...node.children].sort(compareNodes).map((child) => ({
        name: child.name,
        type: child.type,
        size: child.type === 'file' ? child.size : 0,
        createdAt: child.createdAt,
        modifiedAt: child.modifiedAt,
        path: childPath(normalized, child.name),
      }));
    },

    readFile: (path) => {
      const node = resolveByPath(get().root, path);
      if (!node) throw new FsError('ENOENT', `Fichier introuvable : ${path}`, path);
      if (node.type !== 'file') throw new FsError('EISDIR', `N'est pas un fichier : ${path}`, path);
      return node.content;
    },

    // ------------------------------------------------------------------
    // Écriture / structure
    // ------------------------------------------------------------------
    writeFile: (path, content) =>
      applyMutation((root, trash) => {
        const { segments } = splitPath(path);
        if (segments.length === 0) {
          throw new FsError('EINVAL', 'Chemin de fichier invalide', path);
        }
        const name = segments[segments.length - 1];
        assertValidName(name);
        const parent = resolveNode(root, segments.slice(0, -1));
        if (!parent) throw new FsError('ENOENT', `Dossier parent introuvable : ${path}`, path);
        if (parent.type !== 'folder') throw new FsError('ENOTDIR', `N'est pas un dossier : ${path}`, path);

        const now = Date.now();
        const existing = findChild(parent, name);
        if (existing) {
          if (existing.type !== 'file') throw new FsError('EISDIR', `N'est pas un fichier : ${path}`, path);
          existing.content = content;
          existing.size = byteLength(content);
          existing.modifiedAt = now;
        } else {
          parent.children.push(createFileNode(name, content, now));
        }
        parent.modifiedAt = now;
        return { root, trash };
      }),

    mkdir: (path, options) =>
      applyMutation((root, trash) => {
        const { segments } = splitPath(path);
        if (segments.length === 0) {
          throw new FsError('EEXIST', 'La racine existe déjà', path);
        }
        const now = Date.now();

        if (options?.recursive) {
          let current: FsFolderNode = root;
          for (const segment of segments) {
            assertValidName(segment);
            const existing = findChild(current, segment);
            if (existing) {
              if (existing.type !== 'folder') {
                throw new FsError('ENOTDIR', `Un fichier bloque la création : ${segment}`, path);
              }
              current = existing;
            } else {
              const created = createFolderNode(segment, now);
              current.children.push(created);
              current.modifiedAt = now;
              current = created;
            }
          }
          return { root, trash };
        }

        const name = segments[segments.length - 1];
        assertValidName(name);
        const parent = resolveNode(root, segments.slice(0, -1));
        if (!parent) throw new FsError('ENOENT', `Dossier parent introuvable : ${path}`, path);
        if (parent.type !== 'folder') throw new FsError('ENOTDIR', `N'est pas un dossier : ${path}`, path);
        if (findChild(parent, name)) throw new FsError('EEXIST', `Le nom existe déjà : ${path}`, path);
        parent.children.push(createFolderNode(name, now));
        parent.modifiedAt = now;
        return { root, trash };
      }),

    rename: (path, newName) =>
      applyMutation((root, trash) => {
        assertValidName(newName);
        const { segments } = splitPath(path);
        if (segments.length === 0) throw new FsError('EPERM', 'Impossible de renommer la racine', path);
        const parent = resolveNode(root, segments.slice(0, -1));
        if (!parent || parent.type !== 'folder') {
          throw new FsError('ENOENT', `Élément introuvable : ${path}`, path);
        }
        const node = findChild(parent, segments[segments.length - 1]);
        if (!node) throw new FsError('ENOENT', `Élément introuvable : ${path}`, path);

        const collision = parent.children.find(
          (child) => child !== node && child.name.toLowerCase() === newName.toLowerCase(),
        );
        if (collision) throw new FsError('EEXIST', `Le nom existe déjà : ${newName}`, path);

        const now = Date.now();
        node.name = newName;
        node.modifiedAt = now;
        parent.modifiedAt = now;
        return { root, trash };
      }),

    move: (src, destDir) =>
      applyMutation((root, trash) => {
        const srcSegments = splitPath(src).segments;
        if (srcSegments.length === 0) throw new FsError('EPERM', 'Impossible de déplacer la racine', src);
        if (isSameOrDescendant(normalizePath(src), normalizePath(destDir))) {
          throw new FsError('EPERM', `Déplacement d'un dossier dans lui-même : ${src}`, src);
        }
        const srcParent = resolveNode(root, srcSegments.slice(0, -1));
        if (!srcParent || srcParent.type !== 'folder') {
          throw new FsError('ENOENT', `Source introuvable : ${src}`, src);
        }
        const node = findChild(srcParent, srcSegments[srcSegments.length - 1]);
        if (!node) throw new FsError('ENOENT', `Source introuvable : ${src}`, src);

        const dest = resolveNode(root, splitPath(destDir).segments);
        if (!dest) throw new FsError('ENOENT', `Destination introuvable : ${destDir}`, destDir);
        if (dest.type !== 'folder') throw new FsError('ENOTDIR', `La destination n'est pas un dossier : ${destDir}`, destDir);

        // Déjà dans le dossier cible : aucune opération nécessaire.
        if (dest === srcParent) return { root, trash };

        if (findChild(dest, node.name)) {
          throw new FsError('EEXIST', `Le nom existe déjà dans la destination : ${node.name}`, destDir);
        }

        const now = Date.now();
        srcParent.children = srcParent.children.filter((child) => child !== node);
        srcParent.modifiedAt = now;
        dest.children.push(node);
        dest.modifiedAt = now;
        return { root, trash };
      }),

    copy: (src, destDir, newName) =>
      applyMutation((root, trash) => {
        const srcSegments = splitPath(src).segments;
        if (srcSegments.length === 0) throw new FsError('EPERM', 'Impossible de copier la racine', src);
        const srcParent = resolveNode(root, srcSegments.slice(0, -1));
        if (!srcParent || srcParent.type !== 'folder') {
          throw new FsError('ENOENT', `Source introuvable : ${src}`, src);
        }
        const node = findChild(srcParent, srcSegments[srcSegments.length - 1]);
        if (!node) throw new FsError('ENOENT', `Source introuvable : ${src}`, src);

        const dest = resolveNode(root, splitPath(destDir).segments);
        if (!dest) throw new FsError('ENOENT', `Destination introuvable : ${destDir}`, destDir);
        if (dest.type !== 'folder') throw new FsError('ENOTDIR', `La destination n'est pas un dossier : ${destDir}`, destDir);

        // Nom cible (défaut : nom de la source). Permet « Coller » dans le même
        // dossier via un nom « Copie de … » sans conflit.
        const targetName = newName ?? node.name;
        assertValidName(targetName);

        if (node.type === 'folder' && isSameOrDescendant(normalizePath(src), normalizePath(destDir))) {
          throw new FsError('EPERM', `Copie d'un dossier dans lui-même : ${src}`, src);
        }
        if (findChild(dest, targetName)) {
          throw new FsError('EEXIST', `Le nom existe déjà dans la destination : ${targetName}`, destDir);
        }

        const now = Date.now();
        const copyNode = cloneNode(node);
        reassignIds(copyNode, now);
        copyNode.name = targetName;
        dest.children.push(copyNode);
        dest.modifiedAt = now;
        return { root, trash };
      }),

    // ------------------------------------------------------------------
    // Corbeille
    // ------------------------------------------------------------------
    remove: (path) =>
      applyMutation((root, trash) => {
        const { segments } = splitPath(path);
        if (segments.length === 0) throw new FsError('EPERM', 'Impossible de supprimer la racine', path);
        const parent = resolveNode(root, segments.slice(0, -1));
        if (!parent || parent.type !== 'folder') {
          throw new FsError('ENOENT', `Élément introuvable : ${path}`, path);
        }
        const node = findChild(parent, segments[segments.length - 1]);
        if (!node) throw new FsError('ENOENT', `Élément introuvable : ${path}`, path);

        const now = Date.now();
        parent.children = parent.children.filter((child) => child !== node);
        parent.modifiedAt = now;

        const trashItem: TrashItem = {
          id: generateNodeId(),
          node,
          originalPath: joinSegments(segments),
          originalParent: joinSegments(segments.slice(0, -1)),
          deletedAt: now,
        };
        return { root, trash: [...trash, trashItem] };
      }),

    restore: (trashItemId) =>
      applyMutation((root, trash) => {
        const item = trash.find((entry) => entry.id === trashItemId);
        if (!item) throw new FsError('ENOENT', `Élément de corbeille introuvable : ${trashItemId}`);

        const parent = resolveNode(root, splitPath(item.originalParent).segments);
        if (!parent) {
          throw new FsError('ENOENT', `Dossier d'origine introuvable : ${item.originalParent}`, item.originalParent);
        }
        if (parent.type !== 'folder') {
          throw new FsError('ENOTDIR', `L'emplacement d'origine n'est pas un dossier : ${item.originalParent}`, item.originalParent);
        }
        if (findChild(parent, item.node.name)) {
          throw new FsError('EEXIST', `Un élément du même nom existe déjà : ${item.node.name}`, item.originalPath);
        }

        const now = Date.now();
        parent.children.push(item.node);
        parent.modifiedAt = now;
        return { root, trash: trash.filter((entry) => entry.id !== trashItemId) };
      }),

    emptyTrash: () => {
      set((state) => {
        const next: PersistedFs = { root: state.root, trash: [] };
        saveFs(next);
        return next;
      });
    },

    deletePermanently: (path) =>
      applyMutation((root, trash) => {
        const { segments } = splitPath(path);
        if (segments.length === 0) throw new FsError('EPERM', 'Impossible de supprimer la racine', path);
        const parent = resolveNode(root, segments.slice(0, -1));
        if (!parent || parent.type !== 'folder') {
          throw new FsError('ENOENT', `Élément introuvable : ${path}`, path);
        }
        const node = findChild(parent, segments[segments.length - 1]);
        if (!node) throw new FsError('ENOENT', `Élément introuvable : ${path}`, path);

        const now = Date.now();
        parent.children = parent.children.filter((child) => child !== node);
        parent.modifiedAt = now;
        return { root, trash };
      }),

    listTrash: () => [...get().trash],

    // ------------------------------------------------------------------
    // Maintenance
    // ------------------------------------------------------------------
    reset: () => {
      const fresh = createInitialFs();
      saveFs(fresh);
      set({ root: fresh.root, trash: fresh.trash });
    },
  };
});
