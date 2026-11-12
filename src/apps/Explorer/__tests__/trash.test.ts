import { beforeEach, describe, expect, it } from 'vitest';
import { useFsStore } from '@/common/fs';
import { trashToItem, entryToItem } from '../items';
import { isTrashItem, restoreTrashItems, trashItemId } from '../trash';

const fs = () => useFsStore.getState();
const DOCS = 'C:\\Mes documents';
const WELCOME = `${DOCS}\\Bienvenue.txt`;

/** Les éléments de la Corbeille tels que l'Explorateur les affiche. */
const trashItems = () => fs().listTrash().map(trashToItem);
const namesIn = (path: string) => fs().readDir(path).map((entry) => entry.name);

beforeEach(() => {
  fs().reset();
});

describe('éléments de la Corbeille', () => {
  it('reconnaît un élément de la Corbeille et retrouve son identifiant', () => {
    fs().remove(WELCOME);
    const [trashed] = fs().listTrash();
    const [item] = trashItems();

    expect(isTrashItem(item)).toBe(true);
    expect(trashItemId(item)).toBe(trashed.id);
  });

  it('ne confond pas un fichier ordinaire avec un élément de la Corbeille', () => {
    const item = entryToItem(fs().readDir(DOCS).find((entry) => entry.name === 'Bienvenue.txt')!);

    expect(isTrashItem(item)).toBe(false);
    expect(trashItemId(item)).toBeNull();
  });
});

describe('restoreTrashItems', () => {
  it('remet un fichier à son emplacement d\'origine avec son contenu', () => {
    const content = fs().readFile(WELCOME);
    fs().remove(WELCOME);
    expect(namesIn(DOCS)).not.toContain('Bienvenue.txt');

    const failures = restoreTrashItems(trashItems(), fs().restore);

    expect(failures).toEqual([]);
    expect(fs().listTrash()).toEqual([]);
    expect(fs().readFile(WELCOME)).toBe(content);
  });

  it('restaure plusieurs éléments, dossiers compris', () => {
    fs().mkdir(`${DOCS}\\Projets`);
    fs().writeFile(`${DOCS}\\Projets\\notes.txt`, 'à faire');
    fs().remove(`${DOCS}\\Projets`);
    fs().remove(WELCOME);

    const failures = restoreTrashItems(trashItems(), fs().restore);

    expect(failures).toEqual([]);
    expect(namesIn(DOCS)).toEqual(expect.arrayContaining(['Projets', 'Bienvenue.txt']));
    expect(fs().readFile(`${DOCS}\\Projets\\notes.txt`)).toBe('à faire');
  });

  it('ne restaure que les éléments demandés', () => {
    fs().writeFile(`${DOCS}\\a.txt`, 'a');
    fs().writeFile(`${DOCS}\\b.txt`, 'b');
    fs().remove(`${DOCS}\\a.txt`);
    fs().remove(`${DOCS}\\b.txt`);

    restoreTrashItems(trashItems().filter((item) => item.name === 'b.txt'), fs().restore);

    expect(namesIn(DOCS)).toContain('b.txt');
    expect(namesIn(DOCS)).not.toContain('a.txt');
    expect(fs().listTrash().map((item) => item.node.name)).toEqual(['a.txt']);
  });

  it('signale un nom déjà pris à l\'emplacement d\'origine et laisse l\'élément dans la Corbeille', () => {
    fs().remove(WELCOME);
    fs().writeFile(WELCOME, 'nouveau fichier du même nom');

    const failures = restoreTrashItems(trashItems(), fs().restore);

    expect(failures).toEqual([{ name: 'Bienvenue.txt', reason: 'nameTaken' }]);
    expect(fs().listTrash()).toHaveLength(1);
    expect(fs().readFile(WELCOME)).toBe('nouveau fichier du même nom');
  });

  it('signale un dossier d\'origine disparu', () => {
    fs().mkdir(`${DOCS}\\Projets`);
    fs().writeFile(`${DOCS}\\Projets\\notes.txt`, 'à faire');
    fs().remove(`${DOCS}\\Projets\\notes.txt`);
    fs().remove(`${DOCS}\\Projets`);
    const notes = trashItems().filter((item) => item.name === 'notes.txt');

    const failures = restoreTrashItems(notes, fs().restore);

    expect(failures).toEqual([{ name: 'notes.txt', reason: 'folderMissing' }]);
  });

  it('poursuit après un échec', () => {
    fs().writeFile(`${DOCS}\\a.txt`, 'a');
    fs().remove(`${DOCS}\\a.txt`);
    fs().remove(WELCOME);
    fs().writeFile(`${DOCS}\\a.txt`, 'autre a');

    const failures = restoreTrashItems(trashItems(), fs().restore);

    expect(failures).toEqual([{ name: 'a.txt', reason: 'nameTaken' }]);
    expect(namesIn(DOCS)).toContain('Bienvenue.txt');
  });

  it('classe une erreur inattendue comme inconnue', () => {
    fs().remove(WELCOME);

    const failures = restoreTrashItems(trashItems(), () => {
      throw new Error('panne');
    });

    expect(failures).toEqual([{ name: 'Bienvenue.txt', reason: 'unknown' }]);
  });

  it('ignore les éléments qui ne viennent pas de la Corbeille', () => {
    const ordinary = fs().readDir(DOCS).map(entryToItem);
    let calls = 0;

    const failures = restoreTrashItems(ordinary, () => {
      calls++;
    });

    expect(failures).toEqual([]);
    expect(calls).toBe(0);
  });
});
