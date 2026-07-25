import React from 'react';
import styles from './chrome.module.scss';

import { WindowStatusBar } from '@/components/atoms/WindowStatusBar/WindowStatusBar';
import { StatusBarItem } from '@/components/atoms/StatusBarItem/StatusBarItem';

import { useExplorer } from '../ExplorerContext';
import { objectCount } from '../model';

/** Somme d'octets formatée façon barre d'état XP (Ko / Mo). */
const formatTotal = (bytes: number): string => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mo`;
  }
  if (bytes > 0) return `${Math.ceil(bytes / 1024).toLocaleString('fr-FR')} Ko`;
  return '';
};

/** Barre d'état : nombre d'objets, taille, zone (« Mon ordinateur »). */
export const StatusBar: React.FC = () => {
  const { items, selectedItems } = useExplorer();

  const selCount = selectedItems.length;
  const relevant = selCount > 0 ? selectedItems : items;
  const totalBytes = relevant.filter((it) => it.kind === 'file').reduce((sum, it) => sum + it.size, 0);
  const sizeText = formatTotal(totalBytes);

  const leftLabel = selCount > 0 ? `${objectCount(selCount)} sélectionné${selCount > 1 ? 's' : ''}` : objectCount(items.length);

  return (
    <WindowStatusBar className={styles.statusBar}>
      <StatusBarItem className={styles.statusMain}>{leftLabel}</StatusBarItem>
      <StatusBarItem className={styles.statusSize}>{sizeText}</StatusBarItem>
      <StatusBarItem className={styles.statusZone}>
        <span className={styles.zoneIcon} />
        Mon ordinateur
      </StatusBarItem>
    </WindowStatusBar>
  );
};
