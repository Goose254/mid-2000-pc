/**
 * Erreurs explicites du système de fichiers.
 *
 * On s'inspire des codes POSIX afin que les couches supérieures (Explorateur,
 * Bloc-notes…) puissent réagir précisément (chemin inexistant, collision de
 * nom, etc.) plutôt que de deviner à partir d'un message.
 */
export type FsErrorCode =
  | 'ENOENT' // chemin inexistant
  | 'EEXIST' // collision de nom
  | 'ENOTDIR' // le nœud n'est pas un dossier
  | 'EISDIR' // le nœud est un dossier (opération fichier attendue)
  | 'EINVAL' // chemin ou nom invalide
  | 'EPERM'; // opération interdite

/** Erreur porteuse d'un code et, si pertinent, du chemin fautif. */
export class FsError extends Error {
  readonly code: FsErrorCode;
  readonly path?: string;

  constructor(code: FsErrorCode, message: string, path?: string) {
    super(message);
    this.name = 'FsError';
    this.code = code;
    this.path = path;
    // Rétablit la chaîne de prototype (nécessaire quand on étend Error en TS).
    Object.setPrototypeOf(this, FsError.prototype);
  }
}
