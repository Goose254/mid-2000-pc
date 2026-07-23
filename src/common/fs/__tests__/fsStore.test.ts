import { beforeEach, describe, expect, it } from 'vitest';
import { useFsStore } from '../fsStore';
import { FsError, FsErrorCode } from '../errors';

/** Raccourci vers l'API du store. */
const fs = () => useFsStore.getState();

/** Assertion utilitaire : `fn` doit lever une `FsError` du code attendu. */
const expectFsError = (fn: () => unknown, code: FsErrorCode): void => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(FsError);
    expect((error as FsError).code).toBe(code);
    return;
  }
  throw new Error(`Une FsError (${code}) était attendue`);
};

beforeEach(() => {
  // Chaque test repart d'une arborescence neuve.
  fs().reset();
});

describe('arborescence initiale', () => {
  it('amorce C:\\ avec les dossiers emblématiques', () => {
    const names = fs().readDir('C:\\').map((entry) => entry.name);
    expect(names).toEqual(
      expect.arrayContaining(['Documents and Settings', 'Mes documents', 'Program Files', 'WINDOWS']),
    );
  });

  it('trie les entrées (dossiers avant fichiers)', () => {
    const entries = fs().readDir('C:\\');
    const firstFileIndex = entries.findIndex((entry) => entry.type === 'file');
    const lastFolderIndex = entries.map((entry) => entry.type).lastIndexOf('folder');
    expect(lastFolderIndex).toBeLessThan(firstFileIndex);
  });

  it('fournit un fichier de bienvenue lisible', () => {
    const content = fs().readFile('C:\\Mes documents\\Bienvenue.txt');
    expect(content.length).toBeGreaterThan(0);
    const info = fs().stat('C:\\Mes documents\\Bienvenue.txt');
    expect(info?.type).toBe('file');
    expect(info?.size).toBeGreaterThan(0);
  });

  it('démarre avec une Corbeille vide', () => {
    expect(fs().listTrash()).toEqual([]);
  });
});

describe('stat / exists', () => {
  it('renvoie null sur un chemin valide mais inexistant', () => {
    expect(fs().stat('C:\\introuvable')).toBeNull();
  });

  it('exists reflète la présence des nœuds', () => {
    expect(fs().exists('C:\\WINDOWS')).toBe(true);
    expect(fs().exists('C:\\WINDOWS\\nope')).toBe(false);
    expect(fs().exists('chemin relatif')).toBe(false);
  });
});

describe('création / lecture / écriture de fichiers', () => {
  it('crée un fichier et dérive sa taille', () => {
    fs().writeFile('C:\\Mes documents\\note.txt', 'Bonjour');
    expect(fs().readFile('C:\\Mes documents\\note.txt')).toBe('Bonjour');
    expect(fs().stat('C:\\Mes documents\\note.txt')?.size).toBe(7);
  });

  it('écrase un fichier existant et met à jour la taille', () => {
    fs().writeFile('C:\\note.txt', 'a');
    fs().writeFile('C:\\note.txt', 'abcde');
    expect(fs().readFile('C:\\note.txt')).toBe('abcde');
    expect(fs().stat('C:\\note.txt')?.size).toBe(5);
  });

  it('compte les octets UTF-8 (accents = plusieurs octets)', () => {
    fs().writeFile('C:\\accents.txt', 'éè');
    expect(fs().stat('C:\\accents.txt')?.size).toBe(4);
  });
});

describe('mkdir', () => {
  it('crée un dossier simple', () => {
    fs().mkdir('C:\\Projets');
    expect(fs().stat('C:\\Projets')?.type).toBe('folder');
  });

  it('crée une chaîne de dossiers en mode récursif', () => {
    fs().mkdir('C:\\a\\b\\c', { recursive: true });
    expect(fs().exists('C:\\a\\b\\c')).toBe(true);
  });

  it('échoue si le parent manque en mode non récursif', () => {
    expectFsError(() => fs().mkdir('C:\\x\\y'), 'ENOENT');
  });

  it('échoue si le dossier existe déjà', () => {
    expectFsError(() => fs().mkdir('C:\\WINDOWS'), 'EEXIST');
  });
});

describe('rename', () => {
  it('renomme un dossier', () => {
    fs().mkdir('C:\\Ancien');
    fs().rename('C:\\Ancien', 'Nouveau');
    expect(fs().exists('C:\\Ancien')).toBe(false);
    expect(fs().exists('C:\\Nouveau')).toBe(true);
  });

  it('refuse une collision de nom', () => {
    fs().mkdir('C:\\A');
    fs().mkdir('C:\\B');
    expectFsError(() => fs().rename('C:\\A', 'B'), 'EEXIST');
  });
});

describe('move', () => {
  it('déplace un fichier vers un autre dossier', () => {
    fs().writeFile('C:\\a.txt', 'x');
    fs().move('C:\\a.txt', 'C:\\Mes documents');
    expect(fs().exists('C:\\a.txt')).toBe(false);
    expect(fs().readFile('C:\\Mes documents\\a.txt')).toBe('x');
  });

  it('interdit de déplacer un dossier dans lui-même', () => {
    fs().mkdir('C:\\parent\\enfant', { recursive: true });
    expectFsError(() => fs().move('C:\\parent', 'C:\\parent\\enfant'), 'EPERM');
  });

  it('refuse une collision dans la destination', () => {
    fs().writeFile('C:\\a.txt', '1');
    fs().writeFile('C:\\Mes documents\\a.txt', '2');
    expectFsError(() => fs().move('C:\\a.txt', 'C:\\Mes documents'), 'EEXIST');
  });
});

describe('copy', () => {
  it('copie profondément un dossier (nœuds distincts)', () => {
    fs().mkdir('C:\\src');
    fs().writeFile('C:\\src\\f.txt', 'contenu');
    fs().copy('C:\\src', 'C:\\Mes documents');
    // L'original demeure et la copie contient les mêmes données.
    expect(fs().exists('C:\\src\\f.txt')).toBe(true);
    expect(fs().readFile('C:\\Mes documents\\src\\f.txt')).toBe('contenu');
    // Les identifiants diffèrent (copie = nouveaux nœuds).
    const originalId = fs().root.children.find((c) => c.name === 'src')?.id;
    const mesDocs = fs().root.children.find((c) => c.name === 'Mes documents');
    const copyId =
      mesDocs?.type === 'folder' ? mesDocs.children.find((c) => c.name === 'src')?.id : undefined;
    expect(copyId).toBeDefined();
    expect(copyId).not.toBe(originalId);
  });

  it('refuse une collision de nom lors de la copie', () => {
    fs().writeFile('C:\\a.txt', '1');
    expectFsError(() => fs().copy('C:\\a.txt', 'C:\\'), 'EEXIST');
  });
});

describe('corbeille : remove / restore / emptyTrash / deletePermanently', () => {
  it('remove envoie à la corbeille puis restore ramène à l\'origine', () => {
    fs().writeFile('C:\\Mes documents\\doc.txt', 'données');
    fs().remove('C:\\Mes documents\\doc.txt');

    expect(fs().exists('C:\\Mes documents\\doc.txt')).toBe(false);
    const trash = fs().listTrash();
    expect(trash).toHaveLength(1);
    expect(trash[0].originalPath).toBe('C:\\Mes documents\\doc.txt');

    fs().restore(trash[0].id);
    expect(fs().readFile('C:\\Mes documents\\doc.txt')).toBe('données');
    expect(fs().listTrash()).toHaveLength(0);
  });

  it('emptyTrash vide définitivement la corbeille', () => {
    fs().writeFile('C:\\tmp.txt', 'x');
    fs().remove('C:\\tmp.txt');
    expect(fs().listTrash()).toHaveLength(1);
    fs().emptyTrash();
    expect(fs().listTrash()).toHaveLength(0);
  });

  it('deletePermanently supprime sans passer par la corbeille', () => {
    fs().writeFile('C:\\perm.txt', 'x');
    fs().deletePermanently('C:\\perm.txt');
    expect(fs().exists('C:\\perm.txt')).toBe(false);
    expect(fs().listTrash()).toHaveLength(0);
  });

  it('restore échoue si un homonyme occupe déjà l\'emplacement', () => {
    fs().writeFile('C:\\dup.txt', 'a');
    fs().remove('C:\\dup.txt');
    fs().writeFile('C:\\dup.txt', 'b');
    const id = fs().listTrash()[0].id;
    expectFsError(() => fs().restore(id), 'EEXIST');
  });
});

describe('erreurs sur chemins invalides', () => {
  it('readDir sur un chemin inexistant', () => {
    expectFsError(() => fs().readDir('C:\\nope'), 'ENOENT');
  });

  it('readDir sur un fichier', () => {
    expectFsError(() => fs().readDir('C:\\Lisez-moi.txt'), 'ENOTDIR');
  });

  it('readFile sur un dossier', () => {
    expectFsError(() => fs().readFile('C:\\WINDOWS'), 'EISDIR');
  });

  it('readFile sur un chemin inexistant', () => {
    expectFsError(() => fs().readFile('C:\\nope.txt'), 'ENOENT');
  });

  it('opérations rejetant un lecteur inconnu', () => {
    expectFsError(() => fs().readDir('D:\\'), 'EINVAL');
  });

  it('interdit de supprimer la racine', () => {
    expectFsError(() => fs().remove('C:\\'), 'EPERM');
  });
});
