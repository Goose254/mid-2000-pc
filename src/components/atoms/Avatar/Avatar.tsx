import React from 'react';
import styles from './Avatar.module.scss';
import { getAvatarById, getAvatarInitial } from '@/common/utils/avatars';

interface AvatarProps {
  /** Identifiant de l'avatar dans le catalogue (voir `common/utils/avatars`) */
  avatar: string;
  /** Nom du compte, utilisé pour l'initiale des avatars colorés */
  name: string;
  /** Taille du carré en pixels */
  size?: number;
  /** Ajoute le cadre blanc façon photo de compte (tuile de compte). */
  framed?: boolean;
  className?: string;
}

/**
 * Rendu d'une tuile d'avatar de compte (image ou initiale sur fond coloré),
 * réutilisée par l'écran de logon, l'en-tête du menu Démarrer et l'applet de
 * gestion des comptes.
 */
export const Avatar: React.FC<AvatarProps> = ({ avatar, name, size = 48, framed = false, className }) => {
  const definition = getAvatarById(avatar);
  const classes = [styles.avatar, framed && styles.framed, className].filter(Boolean).join(' ');
  const style: React.CSSProperties = { width: size, height: size };

  if (definition.kind === 'image' && definition.src) {
    return (
      <div className={classes} style={style}>
        <img src={definition.src} alt={name} draggable={false} />
      </div>
    );
  }

  return (
    <div
      className={classes}
      style={{ ...style, background: definition.color, fontSize: Math.round(size * 0.5) }}
    >
      <span className={styles.initial}>{getAvatarInitial(name)}</span>
    </div>
  );
};
