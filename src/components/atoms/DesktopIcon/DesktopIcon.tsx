import { useEffect, useRef, useState } from 'react';
import styles from './DesktopIcon.module.scss';

interface DesktopIconProps {
  icon: React.ReactElement;
  label: string;
  onDoubleClick: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onDoubleClick }) => {
  const [active, setActive] = useState<boolean>(false);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const iconSrc = icon?.props?.src;

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
    switch (e.detail) {
      case 1:
        setActive(true);
        break;
      case 2:
        onDoubleClick();
        break;
    }
  };

  return (
    <div
      ref={iconRef}
      className={`${styles.desktopIcon} ${active ? styles.active : ''}`}
      onClick={handleClick}
    >
      <div className={styles.desktopIconIconWrapper}>
        <div className={styles.desktopIconIcon}>{icon}</div>
        {active && (
          <div
            className={styles.desktopIconIconOverlay}
            style={{ "--icon-image": `url(${iconSrc})` } as React.CSSProperties}
          ></div>
        )}
      </div>
      <div className={styles.desktopIconLabelWrapper}>
        <span className={styles.desktopIconLabel}>{label}</span>
      </div>
    </div>
  );
};
