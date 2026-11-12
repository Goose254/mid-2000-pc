import React from 'react';

import { ContextMenu } from '@/apps/TaskManager/components/ContextMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';

import { useExplorer } from '../useExplorer';
import { VIEW_MODES } from '../model';
import type { SortKey } from '../model';

interface RowProps {
  label: string;
  info?: string;
  disabled?: boolean;
  bold?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Nom' },
  { key: 'size', label: 'Taille' },
  { key: 'type', label: 'Type' },
  { key: 'modifiedAt', label: 'Modifié le' },
];

/** Menu contextuel (clic droit) de l'Explorateur, dépendant de la cible. */
export const ExplorerContextMenu: React.FC = () => {
  const explorer = useExplorer();
  const {
    contextMenu,
    closeContextMenu,
    open,
    cut,
    copy,
    paste,
    canPaste,
    deleteSelection,
    beginRename,
    createFolder,
    createTextFile,
    refresh,
    setView,
    setSort,
    openDialog,
    state,
    currentFolderPath,
  } = explorer;

  if (!contextMenu) return null;
  const target = contextMenu.target;

  const run = (fn?: () => void) => {
    fn?.();
    closeContextMenu();
  };

  const Row: React.FC<RowProps> = ({ label, info, disabled, bold, onClick, children }) => (
    <MenuItem
      label={label}
      info={info}
      primary={bold}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : children ? undefined : () => run(onClick)}
    >
      {children}
    </MenuItem>
  );

  let content: React.ReactNode;

  if (target) {
    // Menu d'un élément (fichier / dossier / lecteur)
    const editable = target.editable;
    const isDrive = target.kind === 'drive';
    content = (
      <>
        <Row label="Ouvrir" bold onClick={() => open(target)} />
        {target.kind !== 'file' && <Row label="Explorer" onClick={() => open(target)} />}
        {target.kind !== 'file' && <Row label="Rechercher..." disabled />}
        {target.kind === 'file' && <Row label="Imprimer" disabled />}
        <MenuSeparator />
        {!isDrive && (
          <>
            <Row label="Envoyer vers">
              <FloatingMenu>
                <MenuItem label="Bureau (créer un raccourci)" aria-disabled />
                <MenuItem label="Destinataire" aria-disabled />
                <MenuItem label="Dossier compressé" aria-disabled />
              </FloatingMenu>
            </Row>
            <MenuSeparator />
          </>
        )}
        <Row label="Couper" disabled={!editable} onClick={cut} />
        <Row label="Copier" disabled={!editable} onClick={copy} />
        <MenuSeparator />
        <Row label="Créer un raccourci" disabled />
        <Row label="Supprimer" disabled={!editable} onClick={deleteSelection} />
        <Row label="Renommer" disabled={!editable} onClick={() => beginRename(target.key)} />
        <MenuSeparator />
        <Row label="Propriétés" onClick={() => openDialog({ kind: 'properties', item: target })} />
      </>
    );
  } else {
    // Menu d'une zone vide
    const inFolder = currentFolderPath !== null;
    content = (
      <>
        <Row label="Affichage">
          <FloatingMenu>
            {VIEW_MODES.map((v) => (
              <MenuItem
                key={v.mode}
                label={v.label}
                iconElement={state.viewMode === v.mode ? <span>●</span> : <span />}
                onClick={() => run(() => setView(v.mode))}
              />
            ))}
          </FloatingMenu>
        </Row>
        <Row label="Réorganiser les icônes par">
          <FloatingMenu>
            {SORTS.map((s) => (
              <MenuItem
                key={s.key}
                label={s.label}
                iconElement={state.sortKey === s.key ? <span>●</span> : <span />}
                onClick={() => run(() => setSort(s.key))}
              />
            ))}
          </FloatingMenu>
        </Row>
        <Row label="Actualiser" onClick={refresh} />
        <MenuSeparator />
        <Row label="Coller" disabled={!canPaste} onClick={paste} />
        <Row label="Coller le raccourci" disabled />
        <MenuSeparator />
        <Row label="Nouveau" disabled={!inFolder}>
          <FloatingMenu>
            <MenuItem label="Dossier" onClick={() => run(createFolder)} />
            <MenuItem label="Document texte" onClick={() => run(createTextFile)} />
          </FloatingMenu>
        </Row>
        <MenuSeparator />
        <Row label="Propriétés" onClick={() => openDialog({ kind: 'properties', item: null })} />
      </>
    );
  }

  return (
    <ContextMenu x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu}>
      {content}
    </ContextMenu>
  );
};
