import React, { useEffect, useRef } from 'react';
import styles from './content.module.scss';
import { getBaseName } from '@/common/fs';

interface RenameInputProps {
  /** Clé (= chemin) de l'élément renommé. */
  itemKey: string;
  onCommit: (key: string, newName: string) => void;
  onCancel: () => void;
  className?: string;
}

/**
 * Champ d'édition inline du renommage (F2 / clic lent), fidèle à XP :
 * pré-sélectionne le nom SANS l'extension, valide sur Entrée ou perte de focus,
 * annule sur Échap.
 */
export const RenameInput: React.FC<RenameInputProps> = ({ itemKey, onCommit, onCancel, className }) => {
  const ref = useRef<HTMLInputElement>(null);
  const committed = useRef(false);
  const name = getBaseName(itemKey);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    input.focus();
    // Sélectionne le radical (avant la dernière extension), comme l'Explorateur XP.
    const dot = name.lastIndexOf('.');
    if (dot > 0) input.setSelectionRange(0, dot);
    else input.select();
  }, [name]);

  const commit = () => {
    if (committed.current) return;
    committed.current = true;
    onCommit(itemKey, ref.current?.value ?? name);
  };

  return (
    <input
      ref={ref}
      className={`${styles.renameInput} ${className ?? ''}`}
      defaultValue={name}
      spellCheck={false}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          committed.current = true;
          onCancel();
        }
      }}
    />
  );
};
