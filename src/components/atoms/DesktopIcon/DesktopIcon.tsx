import './DesktopIcon.css';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, onClick }) => (
  <div 
    className="desktop-icon"
    onClick={onClick}
  >
    <div className="desktop-icon-icon">{icon}</div>
    <div className="desktop-icon-label">{label}</div>
  </div>
);