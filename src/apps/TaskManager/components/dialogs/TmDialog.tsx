import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './dialogs.module.scss';

import { TitleBar } from '@/components/molecules/TitleBar/TitleBar';
import { Button } from '@/components/atoms/Button/Button';
import { useWindowsStore } from '@/common/stores/windowsStore';

interface TmDialogProps {
  /** Fenêtre parente (le Gestionnaire des tâches) sur laquelle centrer. */
  windowId: string;
  title: string;
  onClose: () => void;
  /** Action de la touche Entrée (validation). */
  onEnter?: () => void;
  children: React.ReactNode;
}

/**
 * Boîte de dialogue modale du Gestionnaire des tâches, rendue via un portail
 * au-dessus de sa fenêtre parente et centrée sur celle-ci. Le chrome (barre de
 * titre + bordures) suit l'état actif/inactif comme n'importe quelle fenêtre du
 * shell. Déplaçable par la barre de titre, fermable par Échap.
 *
 * Reprend l'approche éprouvée des dialogues du Démineur (portail vers #root).
 */
export const TmDialog: React.FC<TmDialogProps> = ({ windowId, title, onClose, onEnter, children }) => {
  const parentWindow = useWindowsStore((state) => state.windows.find((window) => window.id === windowId));
  const [flashesLeft, setFlashesLeft] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (flashesLeft === 0) return;
    const flashTimeout = setTimeout(() => setFlashesLeft(flashesLeft - 1), 60);
    return () => clearTimeout(flashTimeout);
  }, [flashesLeft]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Enter' && onEnter) {
        event.preventDefault();
        onEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onEnter]);

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (backdropRef.current?.contains(event.target as Node)) {
        useWindowsStore.getState().bringToFront(windowId);
      }
    };
    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, [windowId]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragStart.current) return;
      setDragOffset({ x: event.clientX - dragStart.current.x, y: event.clientY - dragStart.current.y });
    };
    const handleMouseUp = () => {
      dragStart.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!parentWindow || parentWindow.isMinimized) return null;

  const isDialogActive = parentWindow.isActive && flashesLeft % 2 === 0;

  const handleBackdropMouseDown = () => setFlashesLeft(5);

  const handleDialogMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    useWindowsStore.getState().bringToFront(windowId);
  };

  const handleDragStart = (event: React.MouseEvent) => {
    dragStart.current = { x: event.clientX - dragOffset.x, y: event.clientY - dragOffset.y };
  };

  return createPortal(
    <div
      ref={backdropRef}
      className={styles.backdrop}
      style={{
        left: parentWindow.position.x,
        top: parentWindow.position.y,
        width: parentWindow.size.width,
        height: parentWindow.size.height,
        zIndex: parentWindow.zIndex + 1,
      }}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className={`${styles.dialog} ${isDialogActive ? '' : styles.inactive}`}
        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }}
        onMouseDown={handleDialogMouseDown}
      >
        <div onMouseDown={handleDragStart}>
          <TitleBar
            options={{
              title,
              isActive: isDialogActive,
              buttons: { close: { visible: true, enabled: true, action: onClose } },
            }}
          />
        </div>
        <div className={styles.dialogContentRow}>
          <div className={styles.dialogLeftBorder}></div>
          <div className={styles.dialogBody}>{children}</div>
          <div className={styles.dialogRightBorder}></div>
        </div>
        <div className={styles.dialogBottomBorder}></div>
      </div>
    </div>,
    document.getElementById('root') ?? document.body
  );
};

/** Icônes système des boîtes de message, dessinées en SVG (aucune ressource externe). */
export const DialogIcon: React.FC<{ kind: 'warning' | 'error' | 'info' }> = ({ kind }) => {
  if (kind === 'warning') {
    // Triangle jaune avec point d'exclamation (avertissement XP).
    return (
      <svg className={styles.msgIcon} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 2 L31 29 L1 29 Z" fill="#ffd21c" stroke="#c99a00" strokeWidth="1" strokeLinejoin="round" />
        <rect x="14.4" y="11" width="3.2" height="10" rx="1" fill="#000" />
        <rect x="14.4" y="23" width="3.2" height="3.2" rx="1" fill="#000" />
      </svg>
    );
  }
  if (kind === 'error') {
    // Cercle rouge avec croix blanche (erreur / accès refusé).
    return (
      <svg className={styles.msgIcon} viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="#e33d3d" stroke="#a01414" strokeWidth="1" />
        <path d="M10 10 L22 22 M22 10 L10 22" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
    );
  }
  // Cercle bleu avec « i » (information).
  return (
    <svg className={styles.msgIcon} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="14" fill="#1a63c4" stroke="#0d3f86" strokeWidth="1" />
      <circle cx="16" cy="9.5" r="2.1" fill="#fff" />
      <rect x="14.2" y="13.5" width="3.6" height="11" rx="1" fill="#fff" />
    </svg>
  );
};

interface MessageBoxProps {
  windowId: string;
  title: string;
  icon: 'warning' | 'error' | 'info';
  message: React.ReactNode;
  /** Bouton principal (validé par Entrée). */
  confirmLabel: string;
  onConfirm: () => void;
  /** Bouton secondaire optionnel (ex. « Non »). */
  cancelLabel?: string;
  onCancel?: () => void;
}

/** Boîte de message XP standard : icône + texte + un ou deux boutons. */
export const MessageBox: React.FC<MessageBoxProps> = ({
  windowId,
  title,
  icon,
  message,
  confirmLabel,
  onConfirm,
  cancelLabel,
  onCancel,
}) => {
  const close = onCancel ?? onConfirm;
  return (
    <TmDialog windowId={windowId} title={title} onClose={close} onEnter={onConfirm}>
      <div className={styles.msgContent}>
        <DialogIcon kind={icon} />
        <div className={styles.msgText}>{message}</div>
      </div>
      <div className={styles.buttonsRow}>
        <Button className={styles.dialogButton} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        {cancelLabel && (
          <Button className={styles.dialogButton} onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
      </div>
    </TmDialog>
  );
};
