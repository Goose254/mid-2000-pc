import React, { useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from './chrome.module.scss';

import { useFsStore } from '@/common/fs';
import { useExplorer } from '../useExplorer';
import {
  COMPUTER,
  FolderIcon,
  Location,
  MyComputerIcon,
  MyDocumentsIcon,
  RecycleIcon,
  SPECIAL_PATHS,
  TRASH,
  VIRTUAL_DRIVES,
  folderIcon,
  folderLocation,
  sameLocation,
} from '../model';

interface TreeNodeData {
  id: string;
  label: string;
  icon: string;
  location: Location;
  hasChildren: boolean;
  getChildren: () => TreeNodeData[];
}

/** Sous-dossiers (dossiers seulement) d'un chemin, en nœuds d'arbre. */
const folderChildren = (path: string): TreeNodeData[] => {
  const fs = useFsStore.getState();
  let entries;
  try {
    entries = fs.readDir(path);
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.type === 'folder')
    .map((e) => folderNode(e.path, e.name));
};

const folderNode = (path: string, label: string): TreeNodeData => ({
  id: `folder:${path}`,
  label,
  icon: folderIcon(path),
  location: folderLocation(path),
  hasChildren: folderChildren(path).length > 0,
  getChildren: () => folderChildren(path),
});

const driveNode = (): TreeNodeData[] =>
  VIRTUAL_DRIVES.map((d) => {
    if (d.location && d.location.kind === 'folder') {
      const path = d.location.path;
      return {
        id: `drive:${d.id}`,
        label: d.label,
        icon: d.icon,
        location: d.location,
        hasChildren: folderChildren(path).length > 0,
        getChildren: () => folderChildren(path),
      };
    }
    return { id: `drive:${d.id}`, label: d.label, icon: d.icon, location: COMPUTER, hasChildren: false, getChildren: () => [] };
  });

const computerNode: TreeNodeData = {
  id: 'computer',
  label: 'Poste de travail',
  icon: MyComputerIcon,
  location: COMPUTER,
  hasChildren: true,
  getChildren: driveNode,
};

const trashNode: TreeNodeData = {
  id: 'trash',
  label: 'Corbeille',
  icon: RecycleIcon,
  location: TRASH,
  hasChildren: false,
  getChildren: () => [],
};

const desktopRoot: TreeNodeData = {
  id: 'desktop',
  label: 'Bureau',
  icon: FolderIcon,
  location: COMPUTER,
  hasChildren: true,
  getChildren: () => [
    { ...folderNode(SPECIAL_PATHS.myDocuments, 'Mes documents'), icon: MyDocumentsIcon },
    computerNode,
    trashNode,
  ],
};

interface RowProps {
  node: TreeNodeData;
  depth: number;
  expanded: Set<string>;
  toggle: (id: string) => void;
}

const TreeRow: React.FC<RowProps> = ({ node, depth, expanded, toggle }) => {
  const { state, navigate } = useExplorer();
  const isOpen = expanded.has(node.id);
  const isCurrent = sameLocation(state.location, node.location);
  const children = isOpen ? node.getChildren() : [];

  return (
    <>
      <div
        className={`${styles.treeRow} ${isCurrent ? styles.treeRowActive : ''}`}
        style={{ paddingLeft: depth * 16 }}
        onClick={() => navigate(node.location)}
      >
        {node.hasChildren ? (
          <button
            type="button"
            className={styles.treeToggle}
            onClick={(e) => {
              e.stopPropagation();
              toggle(node.id);
            }}
          >
            {isOpen ? '−' : '+'}
          </button>
        ) : (
          <span className={styles.treeToggleSpacer} />
        )}
        <img className={styles.treeIcon} src={node.icon} alt="" />
        <span className={styles.treeLabel}>{node.label}</span>
      </div>
      {isOpen && children.map((child) => <TreeRow key={child.id} node={child} depth={depth + 1} expanded={expanded} toggle={toggle} />)}
    </>
  );
};

/** Volet « Dossiers » : arborescence du PC (Bureau ▸ Poste de travail ▸ C: ▸ …). */
export const FolderTree: React.FC = () => {
  // Réactivité FS : re-render quand l'arbre change.
  useFsStore((s) => s.root);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['desktop', 'computer', 'drive:C']));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={styles.treePane}>
      <div className={styles.treeHeader}>
        <span>Dossiers</span>
      </div>
      <OverlayScrollbarsComponent
        className={`overlayscrollbars-react ${styles.treeBody}`}
        options={{ scrollbars: { autoHide: 'never', clickScroll: true } }}
        defer
      >
        <div className={styles.treeInner}>
          <TreeRow node={desktopRoot} depth={0} expanded={expanded} toggle={toggle} />
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};
