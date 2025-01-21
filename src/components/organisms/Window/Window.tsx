import React, { useState, useEffect, useRef } from 'react';
import { TitleBar } from '../../molecules/TitleBar/TitleBar';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onClose?: () => void;
}

export const Window: React.FC<WindowProps> = ({
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 400, height: 300 },
  onClose
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [beforeMaximized, setBeforeMaximized] = useState({ position, size });
  
  const dragStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  const handleMaximize = () => {
    if (!isMaximized) {
      setBeforeMaximized({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 40 }); // 40px for taskbar
      setIsMaximized(true);
    } else {
      setPosition(beforeMaximized.position);
      setSize(beforeMaximized.size);
      setIsMaximized(false);
    }
  };

  const handleMinimize = () => {
    // Implement minimize animation
  };

  const style = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    width: `${size.width}px`,
    height: `${size.height}px`,
  };

  return (
    <div
      ref={windowRef}
      className="absolute bg-[#ECE9D8] shadow-xl border border-gray-400 flex flex-col"
      style={style}
    >
      <div onMouseDown={handleMouseDown}>
        <TitleBar
          title={title}
          onMinimize={handleMinimize}
          onMaximize={handleMaximize}
          onClose={onClose || (() => {})}
        />
      </div>
      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
      {!isMaximized && (
        <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsResizing(true);
          }}
        />
      )}
    </div>
  );
};