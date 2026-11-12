import React from 'react';
import styles from './chrome.module.scss';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { useWindowsStore } from '@/common/stores/windowsStore';

import WindowsBrand from '@/assets/explorer-toolbar-windows-icon.png';

import { useExplorer } from '../useExplorer';
import { SortKey, VIEW_MODES } from '../model';

const closeMenu = () => (document.activeElement as HTMLElement | null)?.blur();

const Bullet = () => <span className={styles.menuBullet}>●</span>;
const Check = () => <span className={styles.menuCheck}>✓</span>;
const Blank = () => <span className={styles.menuBlank} />;

interface ItemProps {
  label: string;
  info?: string;
  icon?: string;
  iconElement?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

/** MenuItem avec gestion du désactivé + fermeture du menu au clic (feuilles). */
const Item: React.FC<ItemProps> = ({ label, info, icon, iconElement, disabled, onClick, children }) => (
  <MenuItem
    label={label}
    info={info}
    icon={icon}
    iconElement={iconElement}
    aria-disabled={disabled || undefined}
    onClick={
      disabled
        ? undefined
        : () => {
            onClick?.();
            if (!children) closeMenu();
          }
    }
  >
    {children}
  </MenuItem>
);

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nom' },
  { key: 'size', label: 'Taille' },
  { key: 'type', label: 'Type' },
  { key: 'modifiedAt', label: 'Modifié le' },
];

/** Barre de menus de l'Explorateur (6 menus fixes, contenu contextuel). */
export const MenuBar: React.FC = () => {
  const explorer = useExplorer();
  const {
    windowId,
    state,
    selectedItems,
    currentFolderPath,
    canPaste,
    open,
    refresh,
    createFolder,
    createTextFile,
    beginRename,
    deleteSelection,
    cut,
    copy,
    paste,
    selectAll,
    setView,
    setSort,
    toggleTree,
    toggleStatusBar,
    openDialog,
  } = explorer;

  const sel = selectedItems;
  const single = sel.length === 1 ? sel[0] : null;
  const hasEditableSel = sel.some((it) => it.editable);
  const inFolder = currentFolderPath !== null;

  const closeSelf = () => useWindowsStore.getState().closeWindow(windowId);

  return (
    <WindowToolbar variant="gradient" className={styles.menuToolbar}>
      {/* Fichier */}
      <WindowToolbarMenuButton label="Fichier">
        <FloatingMenu>
          {single && <Item label="Ouvrir" onClick={() => open(single)} />}
          <Item label="Nouveau" disabled={!inFolder}>
            <FloatingMenu>
              <Item label="Dossier" onClick={createFolder} />
              <Item label="Document texte" onClick={createTextFile} />
            </FloatingMenu>
          </Item>
          <MenuSeparator />
          <Item label="Supprimer" disabled={!hasEditableSel} onClick={deleteSelection} />
          <Item
            label="Renommer"
            disabled={!single || !single.editable}
            onClick={() => single && beginRename(single.key)}
          />
          <Item label="Propriétés" onClick={() => openDialog({ kind: 'properties', item: single })} />
          <MenuSeparator />
          <Item label="Fermer" onClick={closeSelf} />
        </FloatingMenu>
      </WindowToolbarMenuButton>

      {/* Édition */}
      <WindowToolbarMenuButton label="Édition">
        <FloatingMenu>
          <Item label="Annuler" info="Ctrl+Z" disabled />
          <MenuSeparator />
          <Item label="Couper" info="Ctrl+X" disabled={!hasEditableSel} onClick={cut} />
          <Item label="Copier" info="Ctrl+C" disabled={!hasEditableSel} onClick={copy} />
          <Item label="Coller" info="Ctrl+V" disabled={!canPaste} onClick={paste} />
          <MenuSeparator />
          <Item label="Sélectionner tout" info="Ctrl+A" onClick={selectAll} />
        </FloatingMenu>
      </WindowToolbarMenuButton>

      {/* Affichage */}
      <WindowToolbarMenuButton label="Affichage">
        <FloatingMenu>
          <Item
            label="Barre d'état"
            iconElement={state.showStatusBar ? <Check /> : <Blank />}
            onClick={toggleStatusBar}
          />
          <Item label="Volet d'exploration">
            <FloatingMenu>
              <Item label="Dossiers" iconElement={state.showTree ? <Check /> : <Blank />} onClick={toggleTree} />
            </FloatingMenu>
          </Item>
          <MenuSeparator />
          {VIEW_MODES.map((v) => (
            <Item
              key={v.mode}
              label={v.label}
              iconElement={state.viewMode === v.mode ? <Bullet /> : <Blank />}
              onClick={() => setView(v.mode)}
            />
          ))}
          <MenuSeparator />
          <Item label="Réorganiser les icônes par">
            <FloatingMenu>
              {SORTS.map((s) => (
                <Item
                  key={s.key}
                  label={s.label}
                  iconElement={state.sortKey === s.key ? <Bullet /> : <Blank />}
                  onClick={() => setSort(s.key)}
                />
              ))}
            </FloatingMenu>
          </Item>
          <MenuSeparator />
          <Item label="Actualiser" onClick={refresh} />
        </FloatingMenu>
      </WindowToolbarMenuButton>

      {/* Favoris */}
      <WindowToolbarMenuButton label="Favoris">
        <FloatingMenu>
          <Item label="Ajouter aux Favoris..." disabled />
          <Item label="Organiser les Favoris..." disabled />
        </FloatingMenu>
      </WindowToolbarMenuButton>

      {/* Outils */}
      <WindowToolbarMenuButton label="Outils">
        <FloatingMenu>
          <Item label="Connecter un lecteur réseau..." disabled />
          <Item label="Déconnecter un lecteur réseau..." disabled />
          <MenuSeparator />
          <Item label="Options des dossiers..." onClick={() => openDialog({ kind: 'folderOptions' })} />
        </FloatingMenu>
      </WindowToolbarMenuButton>

      {/* ? */}
      <WindowToolbarMenuButton label="?">
        <FloatingMenu>
          <Item label="Centre d'aide et de support" disabled />
          <MenuSeparator />
          <Item label="À propos de Windows" onClick={() => openDialog({ kind: 'about' })} />
        </FloatingMenu>
      </WindowToolbarMenuButton>

      <img src={WindowsBrand} className={styles.windowsBrand} alt="" aria-hidden />
    </WindowToolbar>
  );
};
