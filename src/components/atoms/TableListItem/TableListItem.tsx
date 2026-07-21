import React, { useEffect, useRef, useState } from 'react';
import styles from './TableListItem.module.scss';

interface TableListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactElement
  label: string
  onDoubleClick?: () => void;
  onActive?: () => void;
  onInactive?: () => void;
}

export const TableListItem: React.FC<TableListItemProps> = ({
  icon,
  label,
  onDoubleClick,
  onActive,
  onInactive,
  ...props
}) => {
  const [active, setActive] = useState<boolean>(false);
  const iconRef = useRef<HTMLDivElement | null>(null);
  const iconSrc = icon?.props?.src;

  useEffect(() => {
    const handleClickOutsideIcon = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (
        iconRef.current &&
        !iconRef.current.contains(e.target as Node) &&
        !target.classList.contains('blockOutsideClick')) {
        if (onInactive) onInactive();
        setActive(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutsideIcon);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideIcon);
    };
  }, [onInactive]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    switch (e.detail) {
      case 1:
        if (onActive) onActive();
        setActive(true);
        break;
      case 2:
        if (onDoubleClick) onDoubleClick();
        setActive(false);
        break;
    }
  };

  return (
    <>
    <div
      ref={iconRef}
      className={`${styles.tableListItem} ${active ? styles.active : ''}`}
      onClick={handleClick}
      style={{ display: 'grid', gridTemplateColumns: 'auto 1fr' }} {...props}
    >
      <div className={styles.tableListItemIconWrapper}>
        <div className={styles.tableListItemIcon}>{icon}</div>
        {active && (
          <div
            className={styles.tableListItemIconOverlay}
            style={{ "--icon-image": `url(${iconSrc})` } as React.CSSProperties}
          ></div>
        )}
      </div>
      <div className={styles.tableListItemLabelWrapper}>
        <span className={styles.tableListItemLabel}>{label}</span>
      </div>
    </div>
    </>
  );
};
