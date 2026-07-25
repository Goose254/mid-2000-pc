import React, { useCallback, useRef, useState } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import styles from './content.module.scss';

import { useExplorer } from '../ExplorerContext';
import { ExplorerItem } from '../items';
import { IconSize, SortKey, pickIcon } from '../model';
import { RenameInput } from './RenameInput';

// ---------------------------------------------------------------------------
// Icône d'un élément, avec teinte bleue de sélection (technique du Bureau XP :
// un calque masqué par l'icône, rempli de bleu #316ac5 à 50 %).
// ---------------------------------------------------------------------------
const ItemIcon: React.FC<{ item: ExplorerItem; size: IconSize; selected: boolean }> = ({ item, size, selected }) => {
  const src = pickIcon(item.icons, size);
  return (
    <span className={styles.iconWrap} style={{ width: size, height: size }}>
      <img src={src} width={size} height={size} alt="" />
      {selected && (
        <span
          className={styles.iconSelOverlay}
          style={{ ['--m' as string]: `url(${src})` } as React.CSSProperties}
        />
      )}
    </span>
  );
};

/** Libellé d'un élément : bascule en champ d'édition pendant le renommage. */
const ItemLabel: React.FC<{ item: ExplorerItem; className?: string }> = ({ item, className }) => {
  const { state, commitRename, cancelRename } = useExplorer();
  if (state.renaming === item.key) {
    return <RenameInput itemKey={item.key} onCommit={commitRename} onCancel={cancelRename} />;
  }
  return <span className={className}>{item.name}</span>;
};

// ---------------------------------------------------------------------------
// Vue Détails (tableau trié)
// ---------------------------------------------------------------------------
const COLUMNS: { key: SortKey; label: string; className: string }[] = [
  { key: 'name', label: 'Nom', className: styles.colName },
  { key: 'size', label: 'Taille', className: styles.colSize },
  { key: 'type', label: 'Type', className: styles.colType },
  { key: 'modifiedAt', label: 'Date de modification', className: styles.colDate },
];

const DetailsView: React.FC = () => {
  const { items, isSelected, sortKey, sortDir, setSort, handleItemMouse, handleItemDouble, handleItemContext } =
    useExplorerView();

  return (
    <table className={styles.detailsTable}>
      <thead>
        <tr>
          {COLUMNS.map((col) => (
            <th
              key={col.key}
              className={`${styles.th} ${col.className} ${sortKey === col.key ? styles.sortActive : ''}`}
              onClick={() => setSort(col.key)}
            >
              <span className={styles.thLabel}>{col.label}</span>
              {sortKey === col.key && <span className={styles.sortArrow}>{sortDir === 'asc' ? '▲' : '▼'}</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.key}
            data-itemkey={item.key}
            className={isSelected(item.key) ? styles.rowSelected : ''}
            onMouseDown={(e) => handleItemMouse(e, item)}
            onDoubleClick={() => handleItemDouble(item)}
            onContextMenu={(e) => handleItemContext(e, item)}
          >
            <td className={styles.colName}>
              <ItemIcon item={item} size={16} selected={isSelected(item.key)} />
              <ItemLabel item={item} className={styles.detailsName} />
            </td>
            <td className={`${styles.colSize} ${styles.sizeCell}`}>{item.sizeText}</td>
            <td className={styles.colType}>{item.typeLabel}</td>
            <td className={styles.colDate}>{item.modifiedText}</td>
          </tr>
        ))}
      </tbody>
      {items.length === 0 && (
        <tbody>
          <tr>
            <td className={styles.emptyCell} colSpan={4}>
              Ce dossier est vide.
            </td>
          </tr>
        </tbody>
      )}
    </table>
  );
};

// ---------------------------------------------------------------------------
// Vue Liste
// ---------------------------------------------------------------------------
const ListView: React.FC = () => {
  const { items, isSelected, handleItemMouse, handleItemDouble, handleItemContext } = useExplorerView();
  return (
    <div className={styles.listView}>
      {items.map((item) => (
        <div
          key={item.key}
          data-itemkey={item.key}
          className={`${styles.listItem} ${isSelected(item.key) ? styles.itemSelected : ''}`}
          onMouseDown={(e) => handleItemMouse(e, item)}
          onDoubleClick={() => handleItemDouble(item)}
          onContextMenu={(e) => handleItemContext(e, item)}
        >
          <ItemIcon item={item} size={16} selected={isSelected(item.key)} />
          <ItemLabel item={item} className={styles.listLabel} />
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Cellules à grille (Icônes / Mosaïques / Miniatures)
// ---------------------------------------------------------------------------
const IconCell: React.FC<{ item: ExplorerItem }> = ({ item }) => {
  const { isSelected, handleItemMouse, handleItemDouble, handleItemContext } = useExplorerView();
  return (
    <div
      data-itemkey={item.key}
      className={`${styles.iconItem} ${isSelected(item.key) ? styles.itemSelected : ''}`}
      onMouseDown={(e) => handleItemMouse(e, item)}
      onDoubleClick={() => handleItemDouble(item)}
      onContextMenu={(e) => handleItemContext(e, item)}
    >
      <ItemIcon item={item} size={32} selected={isSelected(item.key)} />
      <div className={styles.iconLabelWrap}>
        <ItemLabel item={item} className={styles.iconLabel} />
      </div>
    </div>
  );
};

const TileCell: React.FC<{ item: ExplorerItem }> = ({ item }) => {
  const { isSelected, handleItemMouse, handleItemDouble, handleItemContext } = useExplorerView();
  return (
    <div
      data-itemkey={item.key}
      className={`${styles.tileItem} ${isSelected(item.key) ? styles.itemSelected : ''}`}
      onMouseDown={(e) => handleItemMouse(e, item)}
      onDoubleClick={() => handleItemDouble(item)}
      onContextMenu={(e) => handleItemContext(e, item)}
    >
      <ItemIcon item={item} size={48} selected={isSelected(item.key)} />
      <div className={styles.tileText}>
        <ItemLabel item={item} className={styles.tileName} />
        <span className={styles.tileSecondary}>{item.secondary ?? item.typeLabel}</span>
      </div>
    </div>
  );
};

const ThumbCell: React.FC<{ item: ExplorerItem }> = ({ item }) => {
  const { isSelected, handleItemMouse, handleItemDouble, handleItemContext } = useExplorerView();
  return (
    <div
      data-itemkey={item.key}
      className={`${styles.thumbItem} ${isSelected(item.key) ? styles.itemSelected : ''}`}
      onMouseDown={(e) => handleItemMouse(e, item)}
      onDoubleClick={() => handleItemDouble(item)}
      onContextMenu={(e) => handleItemContext(e, item)}
    >
      <div className={styles.thumbFrame}>
        <ItemIcon item={item} size={48} selected={isSelected(item.key)} />
      </div>
      <div className={styles.iconLabelWrap}>
        <ItemLabel item={item} className={styles.iconLabel} />
      </div>
    </div>
  );
};

const GridView: React.FC<{ mode: 'icons' | 'tiles' | 'thumbnails' }> = ({ mode }) => {
  const { items, groups } = useExplorerView();
  const Cell = mode === 'tiles' ? TileCell : mode === 'thumbnails' ? ThumbCell : IconCell;
  const gridClass = mode === 'tiles' ? styles.tileGrid : mode === 'thumbnails' ? styles.thumbGrid : styles.iconGrid;

  const renderItems = (list: ExplorerItem[]) => (
    <div className={gridClass}>
      {list.map((item) => (
        <Cell key={item.key} item={item} />
      ))}
    </div>
  );

  if (groups) {
    return (
      <div className={styles.groupsWrap}>
        {groups.map((group) => (
          <section key={group.title} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            {renderItems(group.items)}
          </section>
        ))}
      </div>
    );
  }
  return renderItems(items);
};

// ---------------------------------------------------------------------------
// Contexte de vue (mutualise les gestionnaires souris)
// ---------------------------------------------------------------------------
interface ViewHelpers {
  items: ExplorerItem[];
  groups: ReturnType<typeof useExplorer>['groups'];
  isSelected: (k: string) => boolean;
  sortKey: ReturnType<typeof useExplorer>['sortKey'];
  sortDir: ReturnType<typeof useExplorer>['sortDir'];
  setSort: (k: SortKey) => void;
  state: ReturnType<typeof useExplorer>['state'];
  handleItemMouse: (e: React.MouseEvent, item: ExplorerItem) => void;
  handleItemDouble: (item: ExplorerItem) => void;
  handleItemContext: (e: React.MouseEvent, item: ExplorerItem) => void;
}

const ViewCtx = React.createContext<ViewHelpers | null>(null);
const useExplorerView = (): ViewHelpers => {
  const ctx = React.useContext(ViewCtx);
  if (!ctx) throw new Error('View helpers indisponibles');
  return ctx;
};

// ---------------------------------------------------------------------------
// Zone de contenu principale
// ---------------------------------------------------------------------------
interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const ContentView: React.FC = () => {
  const explorer = useExplorer();
  const {
    items,
    groups,
    state,
    isSelected,
    sortKey,
    sortDir,
    setSort,
    clickSelect,
    open,
    clearSelection,
    selectAll,
    beginRename,
    deleteSelection,
    cut,
    copy,
    paste,
    goUp,
    openContextMenu,
    selectKeys,
  } = explorer;

  const innerRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);

  const handleItemMouse = useCallback(
    (e: React.MouseEvent, item: ExplorerItem) => {
      if (e.button === 2) {
        if (!isSelected(item.key)) clickSelect(item.key, { ctrlKey: false, shiftKey: false, metaKey: false });
        return;
      }
      e.stopPropagation();
      if (state.renaming) return;
      clickSelect(item.key, e);
    },
    [isSelected, clickSelect, state.renaming],
  );

  const handleItemDouble = useCallback((item: ExplorerItem) => open(item), [open]);

  const handleItemContext = useCallback(
    (e: React.MouseEvent, item: ExplorerItem) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isSelected(item.key)) selectKeys([item.key]);
      openContextMenu(e.clientX, e.clientY, item);
    },
    [isSelected, selectKeys, openContextMenu],
  );

  // --- Sélection au lasso (rubber-band) ----------------------------------
  const runMarquee = useCallback(
    (clientX: number, clientY: number) => {
      const start = marqueeStart.current;
      const inner = innerRef.current;
      if (!start || !inner) return;
      const clientRect = {
        left: Math.min(start.x, clientX),
        top: Math.min(start.y, clientY),
        right: Math.max(start.x, clientX),
        bottom: Math.max(start.y, clientY),
      };
      // Rectangle affiché (coordonnées relatives au contenu, défilement inclus).
      const box = inner.getBoundingClientRect();
      setMarquee({
        left: clientRect.left - box.left,
        top: clientRect.top - box.top,
        width: clientRect.right - clientRect.left,
        height: clientRect.bottom - clientRect.top,
      });
      // Test d'intersection avec chaque élément.
      const hits: string[] = [];
      inner.querySelectorAll<HTMLElement>('[data-itemkey]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const intersect = !(r.right < clientRect.left || r.left > clientRect.right || r.bottom < clientRect.top || r.top > clientRect.bottom);
        if (intersect) hits.push(el.dataset.itemkey as string);
      });
      selectKeys(hits);
    },
    [selectKeys],
  );

  const handleBackgroundMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const onItem = (e.target as HTMLElement).closest('[data-itemkey]');
      if (onItem) return; // clic sur un élément : géré par l'élément
      if (state.renaming) return;
      if (!e.ctrlKey) clearSelection();
      marqueeStart.current = { x: e.clientX, y: e.clientY };
      const onMove = (ev: MouseEvent) => runMarquee(ev.clientX, ev.clientY);
      const onUp = () => {
        marqueeStart.current = null;
        setMarquee(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [clearSelection, runMarquee, state.renaming],
  );

  const handleBackgroundContext = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-itemkey]')) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, null);
    },
    [openContextMenu],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (state.renaming) return;
      const keys = items.map((it) => it.key);
      const selected = state.selection;
      const currentIndex = selected.length ? keys.indexOf(selected[selected.length - 1]) : -1;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectAll();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        copy();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        cut();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        paste();
        return;
      }
      switch (e.key) {
        case 'Enter':
          if (selected.length === 1) {
            const item = items.find((it) => it.key === selected[0]);
            if (item) open(item);
          }
          break;
        case 'F2':
          if (selected.length === 1) beginRename(selected[0]);
          break;
        case 'Delete':
          deleteSelection();
          break;
        case 'Backspace':
          e.preventDefault();
          goUp();
          break;
        case 'ArrowUp':
        case 'ArrowLeft': {
          e.preventDefault();
          if (keys.length === 0) break;
          selectKeys([keys[currentIndex <= 0 ? 0 : currentIndex - 1]]);
          break;
        }
        case 'ArrowDown':
        case 'ArrowRight': {
          e.preventDefault();
          if (keys.length === 0) break;
          selectKeys([keys[currentIndex < 0 ? 0 : Math.min(keys.length - 1, currentIndex + 1)]]);
          break;
        }
        case 'Home':
          if (keys.length) selectKeys([keys[0]]);
          break;
        case 'End':
          if (keys.length) selectKeys([keys[keys.length - 1]]);
          break;
        default:
          break;
      }
    },
    [state.renaming, state.selection, items, selectAll, copy, cut, paste, open, beginRename, deleteSelection, goUp, selectKeys],
  );

  const helpers: ViewHelpers = {
    items,
    groups,
    isSelected,
    sortKey,
    sortDir,
    setSort,
    state,
    handleItemMouse,
    handleItemDouble,
    handleItemContext,
  };

  const mode = state.viewMode;

  return (
    <ViewCtx.Provider value={helpers}>
      <OverlayScrollbarsComponent
        className={`overlayscrollbars-react ${styles.contentScroll}`}
        options={{ scrollbars: { autoHide: 'never', clickScroll: true } }}
        defer
      >
        <div
          ref={innerRef}
          className={styles.contentInner}
          tabIndex={0}
          onMouseDown={handleBackgroundMouseDown}
          onContextMenu={handleBackgroundContext}
          onKeyDown={handleKeyDown}
        >
          {mode === 'details' && <DetailsView />}
          {mode === 'list' && <ListView />}
          {mode === 'icons' && <GridView mode="icons" />}
          {mode === 'tiles' && <GridView mode="tiles" />}
          {mode === 'thumbnails' && <GridView mode="thumbnails" />}
          {marquee && (
            <div
              className={styles.marquee}
              style={{ left: marquee.left, top: marquee.top, width: marquee.width, height: marquee.height }}
            />
          )}
        </div>
      </OverlayScrollbarsComponent>
    </ViewCtx.Provider>
  );
};
