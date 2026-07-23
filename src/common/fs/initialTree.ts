/**
 * Arborescence initiale plausible, amorcée au premier lancement.
 *
 * On reste sobre et crédible : les dossiers emblématiques de Windows XP
 * (Documents and Settings, Mes documents, Program Files, WINDOWS) et quelques
 * fichiers d'exemple. La Corbeille n'est PAS un dossier navigable ici : elle est
 * modélisée par la liste `trash` du store (le modèle authentique de la Recycle
 * Bin), initialement vide.
 */
import { createFileNode, createFolderNode } from './tree';
import { FsFolderNode, FsNode } from './types';

const WELCOME_CONTENT = [
  'Bienvenue sur votre PC du milieu des années 2000 !',
  '',
  'Ce fichier est stocké dans le système de fichiers virtuel de la simulation.',
  'Vous pouvez le lire, le modifier, le déplacer vers la Corbeille, puis le',
  'restaurer : tout est persisté dans votre navigateur.',
  '',
  'Bonne exploration.',
].join('\r\n');

const README_CONTENT = [
  'mid-2000-pc',
  '===========',
  '',
  "Ceci est une reconstitution nostalgique d'un PC sous Windows XP,",
  'exécutée entièrement dans le navigateur.',
].join('\r\n');

const WIN_INI_CONTENT = [
  '[fonts]',
  '[extensions]',
  '[mci extensions]',
  '[files]',
].join('\r\n');

/** Petit helper local : fabrique un dossier déjà pourvu de ses enfants. */
const folderWith = (name: string, now: number, children: FsNode[]): FsFolderNode => {
  const node = createFolderNode(name, now);
  node.children = children;
  return node;
};

/** Construit une arborescence neuve pour le lecteur `C:`. */
export const createInitialRoot = (now: number): FsFolderNode => {
  const root = createFolderNode('C:', now);
  root.children = [
    folderWith('Documents and Settings', now, [
      folderWith('Utilisateur', now, [
        createFolderNode('Bureau', now),
        createFolderNode('Favoris', now),
        createFolderNode('Mes documents', now),
      ]),
      createFolderNode('All Users', now),
    ]),
    folderWith('Mes documents', now, [
      createFolderNode('Mes images', now),
      createFolderNode('Ma musique', now),
      createFileNode('Bienvenue.txt', WELCOME_CONTENT, now),
    ]),
    folderWith('Program Files', now, [
      createFolderNode('Fichiers communs', now),
      createFolderNode('Accessoires', now),
    ]),
    folderWith('WINDOWS', now, [
      createFolderNode('system32', now),
      createFolderNode('Temp', now),
      createFileNode('win.ini', WIN_INI_CONTENT, now),
    ]),
    createFileNode('Lisez-moi.txt', README_CONTENT, now),
  ];
  return root;
};
