import { useEffect, useRef, useState } from 'react';
import styles from './DesktopIcon.module.scss';
import ShortcutOverlayIcon from '@/assets/ui/shortcut-overlay-xp.png';

interface DesktopIconProps {
  icon: React.ReactElement;
  label: string;
  shortcut?: boolean;
  onDoubleClick: () => void;
  onMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  icon,
  label,
  shortcut = false,
  onDoubleClick,
  onMouseDown,
  style,
  isDragging = false,
}) => {
  const [active, setActive] = useState<boolean>(false);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const iconSrc = icon?.props?.src;

  useEffect(() => {
    if (isDragging) {
      setActive(false);
    }
  }, [isDragging]);

  useEffect(() => {
    const handleClickOutsideIcon = (e: MouseEvent) => {
      if (iconRef.current && !iconRef.current.contains(e.target as Node)) {
        setActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideIcon);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideIcon);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      return;
    }

    switch (e.detail) {
      case 1:
        setActive(true);
        break;
      case 2:
        onDoubleClick();
        setActive(false);
        break;
    }
  };

  return (
    <div
      ref={iconRef}
      className={`${styles.desktopIcon} ${active || isDragging ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onDragStart={(event) => event.preventDefault()}
      style={style}
    >
      <div className={styles.desktopIconIconWrapper}>
        <div className={styles.desktopIconIcon}>{icon}</div>
        {(active || isDragging) && (
          <div
            className={styles.desktopIconIconOverlay}
            style={{ "--icon-image": `url(${iconSrc})` } as React.CSSProperties}
          ></div>
        )}
        {shortcut && (
          <div className={styles.desktopIconShortcutIndicator}>
            <img src={ShortcutOverlayIcon} alt="" aria-hidden="true" className={styles.desktopIconShortcutImage} />
          </div>
        )}
      </div>
      <div className={styles.desktopIconLabelWrapper}>
        <span className={styles.desktopIconLabel}>{label}</span>
      </div>
    </div>
  );
};
