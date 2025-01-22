import { useEffect, useRef, useState } from 'react';
import './DesktopIcon.css';

interface DesktopIconProps {
  icon: React.ReactElement;
  label: string;
  onDoubleClick: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onDoubleClick }) => {
  const [active, setActive] = useState<boolean>(false);
  const iconRef = useRef<HTMLDivElement | null>(null)
  const iconSrc = icon?.props?.src;

  useEffect(() => {
    const handleClickOutsideIcon = (e: MouseEvent) => {
      if (
        iconRef.current && !iconRef.current.contains(e.target as Node)
      ) {
        setActive(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideIcon)

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideIcon)
    }
  }, [iconRef])

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
    <div ref={iconRef} className={`desktop-icon ${active ? 'active' : ''}`} onClick={handleClick}>
      <div className="desktop-icon-icon-wrapper">
        <div className="desktop-icon-icon">{icon}</div>
        {active ? <div className="desktop-icon-icon-overlay" style={{ "--icon-image": `url(${iconSrc})` } as React.CSSProperties}></div> : ''}
      </div>
      <div className="desktop-icon-label-wrapper">
        <span className="desktop-icon-label">{label}</span>
      </div>
    </div>
  )
};