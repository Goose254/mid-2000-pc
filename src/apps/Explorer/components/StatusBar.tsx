import React from 'react';
import styles from './chrome.module.scss';

import { useExplorer } from '../useExplorer';
import { MyComputerIcon, objectCount } from '../model';

/** Somme d'octets formatée façon barre d'état XP (Ko / Mo). */
const formatTotal = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mo`;
  }
  if (bytes > 0) return `${Math.ceil(bytes / 1024).toLocaleString('fr-FR')} Ko`;
  return '';
};

/**
 * Barre d'état de l'Explorateur : élément de flux (non absolu) placé sous la
 * zone de contenu — le contenu défilant s'arrête donc au-dessus d'elle. Panneaux
 * gravés (sunken) façon XP, avec l'icône « Mon ordinateur » à droite.
 */
export const StatusBar: React.FC = () => {
  const { items, selectedItems } = useExplorer();

  const selCount = selectedItems.length;
  const relevant = selCount > 0 ? selectedItems : items;
  const totalBytes = relevant.filter((it) => it.kind === 'file').reduce((sum, it) => sum + it.size, 0);
  const sizeText = formatTotal(totalBytes);

  const leftLabel =
    selCount > 0 ? `${objectCount(selCount)} sélectionné${selCount > 1 ? 's' : ''}` : objectCount(items.length);

  return (
    <div className={styles.statusBar}>
      <div className={`${styles.statusPanel} ${styles.statusMain}`}>{leftLabel}</div>
      <div className={`${styles.statusPanel} ${styles.statusSize}`}>{sizeText}</div>
      <div className={`${styles.statusPanel} ${styles.statusZone}`}>
        <img src={MyComputerIcon} alt="" width={16} height={16} />
        <span>Mon ordinateur</span>
      </div>
    </div>
  );
};
