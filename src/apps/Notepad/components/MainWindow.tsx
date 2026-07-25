import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './notepad.module.scss';

import { WindowToolbar } from '@/components/atoms/WindowToolbar/WindowToolbar';
import { WindowToolbarMenuButton } from '@/components/atoms/WindowToolbarMenuButton/WindowToolbarMenuButton';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';
import { MenuItem } from '@/components/atoms/MenuItem/MenuItem';
import { MenuSeparator } from '@/components/atoms/MenuSeparator/MenuSeparator';

import { useWindowsStore } from '@/common/stores/windowsStore';
import { childPath, useFsStore } from '@/common/fs';

const closeMenu = () => (document.activeElement as HTMLElement | null)?.blur();

interface NotepadProps {
  windowId: string;
  initialPath: string | null;
  initialName: string;
}

interface ItemProps {
  label: string;
  info?: string;
  disabled?: boolean;
  iconElement?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}

const Item: React.FC<ItemProps> = ({ label, info, disabled, iconElement, onClick, children }) => (
  <MenuItem
    label={label}
    info={info}
    iconElement={iconElement}
    aria-disabled={disabled || undefined}
    onClick={disabled ? undefined : children ? undefined : () => { onClick?.(); closeMenu(); }}
  >
    {children}
  </MenuItem>
);

/** Fenêtre du Bloc-notes, fidèle à Windows XP. */
export const NotepadMainWindow: React.FC<NotepadProps> = ({ windowId, initialPath, initialName }) => {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const initialContent = useMemo(() => {
    if (!initialPath) return '';
    try {
      return useFsStore.getState().readFile(initialPath);
    } catch {
      return '';
    }
  }, [initialPath]);

  const [text, setText] = useState(initialContent);
  const [path, setPath] = useState<string | null>(initialPath);
  const [name, setName] = useState(initialName);
  const [wrap, setWrap] = useState(false);
  const [showStatus, setShowStatus] = useState(true);
  const [caret, setCaret] = useState({ ln: 1, col: 1 });

  // Titre de la fenêtre : « <nom> - Bloc-notes ».
  useEffect(() => {
    useWindowsStore.getState().updateWindow(windowId, { title: `${name} - Bloc-notes` });
  }, [windowId, name]);

  const updateCaret = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const before = ta.value.slice(0, ta.selectionStart);
    const lines = before.split('\n');
    setCaret({ ln: lines.length, col: lines[lines.length - 1].length + 1 });
  }, []);

  const focusTa = () => taRef.current?.focus();

  const doSaveTo = (targetPath: string) => {
    try {
      useFsStore.getState().writeFile(targetPath, text);
      setPath(targetPath);
    } catch {
      /* ignore */
    }
  };

  const save = () => {
    if (path) doSaveTo(path);
    else saveAs();
  };

  const saveAs = () => {
    // Simplifié : enregistre dans « Mes documents » sous le nom courant (.txt).
    const base = name === 'Sans titre' ? 'Sans titre' : name.replace(/\.txt$/i, '');
    const fileName = `${base}.txt`;
    const dir = 'C:\\Mes documents';
    const target = childPath(dir, fileName);
    doSaveTo(target);
    setName(fileName);
  };

  const newDoc = () => {
    setText('');
    setPath(null);
    setName('Sans titre');
    focusTa();
  };

  const insertDateTime = () => {
    const ta = taRef.current;
    if (!ta) return;
    const now = new Date();
    const p2 = (n: number) => String(n).padStart(2, '0');
    const stamp = `${p2(now.getHours())}:${p2(now.getMinutes())} ${p2(now.getDate())}/${p2(now.getMonth() + 1)}/${now.getFullYear()}`;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = text.slice(0, start) + stamp + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + stamp.length;
      updateCaret();
    });
  };

  const exec = (cmd: string) => {
    focusTa();
    try {
      document.execCommand(cmd);
    } catch {
      /* certaines commandes (coller) peuvent être bloquées par le navigateur */
    }
  };

  const selectAll = () => {
    const ta = taRef.current;
    if (ta) {
      ta.focus();
      ta.select();
    }
  };

  const quit = () => useWindowsStore.getState().closeWindow(windowId);

  const check = (on: boolean) => (on ? <span className={styles.menuCheck}>✓</span> : <span className={styles.menuBlank} />);

  return (
    <div className={styles.notepad}>
      <WindowToolbar variant="plain" lastToolbar>
        <WindowToolbarMenuButton label="Fichier">
          <FloatingMenu>
            <Item label="Nouveau" info="Ctrl+N" onClick={newDoc} />
            <Item label="Ouvrir..." info="Ctrl+O" disabled />
            <Item label="Enregistrer" info="Ctrl+S" onClick={save} />
            <Item label="Enregistrer sous..." onClick={saveAs} />
            <MenuSeparator />
            <Item label="Mise en page..." disabled />
            <Item label="Imprimer..." info="Ctrl+P" disabled />
            <MenuSeparator />
            <Item label="Quitter" onClick={quit} />
          </FloatingMenu>
        </WindowToolbarMenuButton>

        <WindowToolbarMenuButton label="Edition">
          <FloatingMenu>
            <Item label="Annuler" info="Ctrl+Z" onClick={() => exec('undo')} />
            <MenuSeparator />
            <Item label="Couper" info="Ctrl+X" onClick={() => exec('cut')} />
            <Item label="Copier" info="Ctrl+C" onClick={() => exec('copy')} />
            <Item label="Coller" info="Ctrl+V" onClick={() => exec('paste')} />
            <Item label="Supprimer" info="Suppr" onClick={() => exec('delete')} />
            <MenuSeparator />
            <Item label="Rechercher..." info="Ctrl+F" disabled />
            <Item label="Rechercher suivant" info="F3" disabled />
            <Item label="Remplacer..." info="Ctrl+H" disabled />
            <Item label="Atteindre..." info="Ctrl+G" disabled />
            <MenuSeparator />
            <Item label="Sélectionner tout" info="Ctrl+A" onClick={selectAll} />
            <Item label="Heure/Date" info="F5" onClick={insertDateTime} />
          </FloatingMenu>
        </WindowToolbarMenuButton>

        <WindowToolbarMenuButton label="Format">
          <FloatingMenu>
            <Item label="Retour à la ligne automatique" iconElement={check(wrap)} onClick={() => setWrap((w) => !w)} />
            <Item label="Police..." disabled />
          </FloatingMenu>
        </WindowToolbarMenuButton>

        <WindowToolbarMenuButton label="Affichage">
          <FloatingMenu>
            <Item
              label="Barre d'état"
              iconElement={check(showStatus)}
              disabled={wrap}
              onClick={() => setShowStatus((s) => !s)}
            />
          </FloatingMenu>
        </WindowToolbarMenuButton>

        <WindowToolbarMenuButton label="?">
          <FloatingMenu>
            <Item label="Rubriques d'aide" disabled />
            <MenuSeparator />
            <Item label="À propos du Bloc-notes" disabled />
          </FloatingMenu>
        </WindowToolbarMenuButton>
      </WindowToolbar>

      <textarea
        ref={taRef}
        className={`${styles.textArea} ${wrap ? styles.wrap : ''}`}
        value={text}
        spellCheck={false}
        wrap={wrap ? 'soft' : 'off'}
        onChange={(e) => {
          setText(e.target.value);
          updateCaret();
        }}
        onKeyUp={updateCaret}
        onClick={updateCaret}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            save();
          } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
            e.preventDefault();
            newDoc();
          } else if (e.key === 'F5') {
            e.preventDefault();
            insertDateTime();
          }
        }}
      />

      {showStatus && !wrap && (
        <div className={styles.statusBar}>
          <div className={styles.statusPanel}>
            Ln {caret.ln}, Col {caret.col}
          </div>
        </div>
      )}
    </div>
  );
};
