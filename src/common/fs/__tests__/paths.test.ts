import { describe, expect, it } from 'vitest';
import {
  childPath,
  getBaseName,
  getParentPath,
  isSameOrDescendant,
  isValidName,
  normalizePath,
  ROOT_PATH,
  splitPath,
} from '../paths';
import { FsError } from '../errors';

describe('normalisation des chemins', () => {
  it('normalise le lecteur et la racine', () => {
    expect(normalizePath('C:')).toBe('C:\\');
    expect(normalizePath('C:\\')).toBe('C:\\');
    expect(normalizePath('c:/')).toBe('C:\\');
    expect(ROOT_PATH).toBe('C:\\');
  });

  it('uniformise les séparateurs et supprime les segments vides', () => {
    expect(normalizePath('C:/Mes documents//Mes images')).toBe('C:\\Mes documents\\Mes images');
    expect(normalizePath('C:\\a\\\\b')).toBe('C:\\a\\b');
  });

  it('résout les segments « . » et « .. »', () => {
    expect(normalizePath('C:\\WINDOWS\\..\\Mes documents\\.')).toBe('C:\\Mes documents');
  });

  it('met la lettre de lecteur en majuscule mais préserve la casse des segments', () => {
    expect(normalizePath('c:\\windows\\SYSTEM32')).toBe('C:\\windows\\SYSTEM32');
  });

  it('rejette un chemin vide, un lecteur inconnu, un chemin relatif et une remontée hors racine', () => {
    expect(() => normalizePath('   ')).toThrow(FsError);
    expect(() => normalizePath('D:\\x')).toThrow(FsError);
    expect(() => normalizePath('dossier\\relatif')).toThrow(FsError);
    expect(() => normalizePath('C:\\..')).toThrow(FsError);
  });
});

describe('helpers de chemin', () => {
  it('getParentPath', () => {
    expect(getParentPath('C:\\a\\b')).toBe('C:\\a');
    expect(getParentPath('C:\\a')).toBe('C:\\');
    expect(getParentPath('C:\\')).toBeNull();
  });

  it('getBaseName', () => {
    expect(getBaseName('C:\\a\\b.txt')).toBe('b.txt');
    expect(getBaseName('C:\\')).toBe('');
  });

  it('childPath', () => {
    expect(childPath('C:\\a', 'b')).toBe('C:\\a\\b');
    expect(childPath('C:\\', 'a')).toBe('C:\\a');
  });

  it('splitPath renvoie les segments normalisés', () => {
    expect(splitPath('C:\\a\\b').segments).toEqual(['a', 'b']);
    expect(splitPath('C:\\').segments).toEqual([]);
  });

  it('isSameOrDescendant', () => {
    expect(isSameOrDescendant('C:\\a', 'C:\\a')).toBe(true);
    expect(isSameOrDescendant('C:\\a', 'C:\\a\\b')).toBe(true);
    expect(isSameOrDescendant('C:\\a', 'C:\\ab')).toBe(false);
    expect(isSameOrDescendant('C:\\a', 'C:\\b')).toBe(false);
  });

  it('isValidName', () => {
    expect(isValidName('Mes documents')).toBe(true);
    expect(isValidName('rapport.txt')).toBe(true);
    expect(isValidName('')).toBe(false);
    expect(isValidName('..')).toBe(false);
    expect(isValidName('a/b')).toBe(false);
    expect(isValidName('a:b')).toBe(false);
    expect(isValidName('a*?')).toBe(false);
  });
});
