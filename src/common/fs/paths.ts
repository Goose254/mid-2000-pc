/**
 * Fonctions PURES de normalisation et de manipulation de chemins « façon
 * Windows » (séparateur `\`, lecteur `C:`). Aucune dépendance au store : ces
 * helpers sont directement testables.
 */
import { FsError } from './errors';

/** Lettre de lecteur unique simulée. */
export const DRIVE = 'C:';
/** Séparateur de chemin Windows. */
export const SEPARATOR = '\\';
/** Racine normalisée du lecteur (`C:\`). */
export const ROOT_PATH = `${DRIVE}${SEPARATOR}`;

/** Caractères interdits dans un nom de fichier / dossier (comme sous Windows). */
const INVALID_NAME_CHARS = /[\\/:*?"<>|]/;

interface SplitPath {
  /** Lecteur normalisé, ex. `C:`. */
  drive: string;
  /** Segments normalisés, ex. `['WINDOWS', 'system32']`. */
  segments: string[];
}

/**
 * Découpe et valide un chemin. Accepte les séparateurs `\` et `/`, exige un
 * lecteur (`C:`) ou un chemin racine (`\...`, rattaché au lecteur par défaut).
 * Résout `.` et `..`. Lève `FsError('EINVAL')` sur chemin invalide.
 */
export const splitPath = (input: string): SplitPath => {
  if (typeof input !== 'string' || input.trim() === '') {
    throw new FsError('EINVAL', 'Chemin vide ou invalide', input);
  }

  // Uniformise les séparateurs vers `\`.
  const unified = input.trim().replace(/\//g, SEPARATOR);

  let rest = unified;
  let drive = DRIVE;

  const driveMatch = /^([A-Za-z]):(.*)$/.exec(unified);
  if (driveMatch) {
    drive = `${driveMatch[1].toUpperCase()}:`;
    rest = driveMatch[2];
    if (drive !== DRIVE) {
      throw new FsError('EINVAL', `Lecteur inconnu : ${drive}`, input);
    }
  } else if (!rest.startsWith(SEPARATOR)) {
    // Ni lecteur ni racine : les chemins relatifs ne sont pas supportés.
    throw new FsError('EINVAL', `Chemin non absolu : ${input}`, input);
  }

  const rawSegments = rest.split(SEPARATOR).filter((segment) => segment.length > 0);

  const segments: string[] = [];
  for (const segment of rawSegments) {
    if (segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) {
        throw new FsError('EINVAL', `Remontée au-delà de la racine : ${input}`, input);
      }
      segments.pop();
      continue;
    }
    segments.push(segment);
  }

  return { drive, segments };
};

/** Recompose un chemin normalisé à partir de segments (racine = `C:\`). */
export const joinSegments = (segments: string[]): string =>
  segments.length === 0 ? ROOT_PATH : `${DRIVE}${SEPARATOR}${segments.join(SEPARATOR)}`;

/** Normalise un chemin en forme canonique (`C:\Foo\Bar`, racine = `C:\`). */
export const normalizePath = (input: string): string => joinSegments(splitPath(input).segments);

/** Chemin du dossier parent, ou `null` si `input` désigne la racine. */
export const getParentPath = (input: string): string | null => {
  const { segments } = splitPath(input);
  if (segments.length === 0) return null;
  return joinSegments(segments.slice(0, -1));
};

/** Dernier segment (nom de fichier / dossier), chaîne vide pour la racine. */
export const getBaseName = (input: string): string => {
  const { segments } = splitPath(input);
  return segments.length === 0 ? '' : segments[segments.length - 1];
};

/** Concatène un dossier parent et un nom d'enfant, en forme normalisée. */
export const childPath = (parent: string, name: string): string => {
  const { segments } = splitPath(parent);
  return joinSegments([...segments, name]);
};

/** Vrai si `candidate` est identique à `ancestor` ou l'un de ses descendants. */
export const isSameOrDescendant = (ancestor: string, candidate: string): boolean => {
  const a = normalizePath(ancestor).toLowerCase();
  const c = normalizePath(candidate).toLowerCase();
  if (c === a) return true;
  const prefix = a.endsWith(SEPARATOR) ? a : `${a}${SEPARATOR}`;
  return c.startsWith(prefix);
};

/** Vrai si `name` est un nom de fichier / dossier valide. */
export const isValidName = (name: string): boolean =>
  name.length > 0 && name !== '.' && name !== '..' && !INVALID_NAME_CHARS.test(name);

/** Lève `FsError('EINVAL')` si `name` n'est pas un nom valide. */
export const assertValidName = (name: string): void => {
  if (!isValidName(name)) {
    throw new FsError('EINVAL', `Nom invalide : "${name}"`, name);
  }
};
