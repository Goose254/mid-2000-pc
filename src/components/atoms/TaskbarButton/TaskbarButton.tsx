import './TaskbarButton.css';

interface TaskbarButtonProps {
  window: {
    id: string;
    title: string;
    icon?: React.ReactElement;
    isMinimized: boolean;
    isActive: boolean;
  },
  onMouseDown: (id: string) => void;
}

export const TaskbarButton: React.FC<TaskbarButtonProps> = ({ window, onMouseDown }) => {
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    //e.stopPropagation();
    onMouseDown(id);
  }

  return (
    <div
      onMouseDown={(e) => handleMouseDown(e, window.id)}
      className={`taskbar-button ${window.isActive ? 'active' : ''}`}
      data-window-id={window.id}
    >
      <div className="taskbar-button-content">
        {window.icon && (
        <div style={{ marginRight: 4 }}>{window.icon}</div>
        )}
        <span>{window.title}</span>
      </div>
    </div>
  )
};