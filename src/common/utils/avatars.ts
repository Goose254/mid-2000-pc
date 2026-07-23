import DefaultAvatarImage from '@/assets/default-avatar.png';

/**
 * Catalogue d'avatars pour les comptes utilisateurs.
 *
 * Les tuiles d'avatars originales de Windows XP sont sous copyright Microsoft et
 * absentes du dépôt. On propose donc :
 *  - l'avatar « échecs » livré avec le projet (`default-avatar.png`, une vraie
 *    image XP disponible dans les assets) ;
 *  - une série d'avatars « CSS » : l'initiale du compte sur un fond coloré.
 *
 * Un vrai jeu de tuiles XP (bulle, poisson, fleur, etc.) pourrait remplacer les
 * avatars colorés en ajoutant simplement des entrées de type `image`.
 */
export type AvatarKind = 'image' | 'color';

export interface AvatarDefinition {
  /** Identifiant stable stocké dans le compte utilisateur */
  id: string;
  kind: AvatarKind;
  /** Source de l'image (avatars de type `image`) */
  src?: string;
  /** Couleur de fond (avatars de type `color`) */
  color?: string;
}

export const DEFAULT_AVATAR_ID = 'chess';

export const AVATARS: AvatarDefinition[] = [
  { id: 'chess', kind: 'image', src: DefaultAvatarImage },
  { id: 'blue', kind: 'color', color: '#3a6ea5' },
  { id: 'green', kind: 'color', color: '#4a8c3f' },
  { id: 'orange', kind: 'color', color: '#d9862b' },
  { id: 'red', kind: 'color', color: '#b0483f' },
  { id: 'teal', kind: 'color', color: '#2f8f8a' },
  { id: 'purple', kind: 'color', color: '#6b4a8f' },
  { id: 'pink', kind: 'color', color: '#c25a8a' },
];

export const getAvatarById = (id: string | undefined): AvatarDefinition =>
  AVATARS.find((avatar) => avatar.id === id) ??
  AVATARS.find((avatar) => avatar.id === DEFAULT_AVATAR_ID) ??
  AVATARS[0];

/** Retourne l'initiale affichée pour les avatars colorés. */
export const getAvatarInitial = (name: string): string =>
  (name.trim().charAt(0) || '?').toUpperCase();
