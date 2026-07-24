import React, { useEffect, useRef } from 'react';
import { FloatingMenu } from '@/components/molecules/FloatingMenu/FloatingMenu';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Menu contextuel (clic droit) réutilisable dans les onglets du Gestionnaire des
 * tâches. Reprend le mécanisme du menu contextuel du Bureau (`DesktopContextMenu`)
 * : un `FloatingMenu` positionné en absolu, refermé au clic extérieur, au clic
 * droit ailleurs ou sur Échap.
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    // `mousedown` couvre clic gauche ET clic droit (le navigateur émet aussi
    // `contextmenu`, mais `mousedown` se déclenche avant et suffit à refermer).
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div ref={ref} style={{ position: 'fixed', top: y, left: x, zIndex: 10000 }}>
      <FloatingMenu>{children}</FloatingMenu>
    </div>
  );
};
