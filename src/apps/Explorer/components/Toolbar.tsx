import React from 'react';
import styles from './chrome.module.scss';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarButton } from '@/components/atoms/WindowToolbarButton/WindowToolbarButton';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';

import BackIcon from '@/assets/explorer-icons/back.png';
import ForwardIcon from '@/assets/explorer-icons/forward.png';
import UpIcon from '@/assets/explorer-icons/up.png';
import SearchIcon from '@/assets/explorer-icons/search.png';
import FoldersIcon from '@/assets/explorer-icons/folders.png';
import ViewsIcon from '@/assets/explorer-icons/views.png';

import { useExplorer } from '../useExplorer';
import { VIEW_MODES } from '../model';

const closeMenu = () => (document.activeElement as HTMLElement | null)?.blur();

/** Barre d'outils standard : navigation, Rechercher, Dossiers, Affichages. */
export const Toolbar: React.FC = () => {
  const { canBack, canForward, canUp, goBack, goForward, goUp, state, setView, toggleTree } = useExplorer();

  return (
    <WindowToolbar variant="gradient" className={styles.navToolbar}>
      <WindowToolbarButton
        icon={BackIcon}
        label="Précédente"
        aria-disabled={!canBack}
        className={canBack ? undefined : styles.toolbarDisabled}
        onClick={canBack ? goBack : undefined}
      />
      <WindowToolbarButton
        icon={ForwardIcon}
        aria-disabled={!canForward}
        className={canForward ? undefined : styles.toolbarDisabled}
        onClick={canForward ? goForward : undefined}
      />
      <WindowToolbarButton
        icon={UpIcon}
        title="Dossier parent"
        aria-disabled={!canUp}
        className={canUp ? undefined : styles.toolbarDisabled}
        onClick={canUp ? goUp : undefined}
      />
      <MenuSeparator direction="vertical" />
      <WindowToolbarButton icon={SearchIcon} label="Rechercher" />
      <WindowToolbarButton
        icon={FoldersIcon}
        label="Dossiers"
        onClick={toggleTree}
        className={state.showTree ? styles.toolbarActive : undefined}
        aria-pressed={state.showTree}
      />
      <MenuSeparator direction="vertical" />
      <WindowToolbarButton icon={ViewsIcon}>
        <FloatingMenu>
          {VIEW_MODES.map((v) => (
            <MenuItem
              key={v.mode}
              label={v.label}
              iconElement={
                state.viewMode === v.mode ? <span className={styles.menuBullet}>●</span> : <span />
              }
              onClick={() => {
                setView(v.mode);
                closeMenu();
              }}
            />
          ))}
        </FloatingMenu>
      </WindowToolbarButton>
    </WindowToolbar>
  );
};
