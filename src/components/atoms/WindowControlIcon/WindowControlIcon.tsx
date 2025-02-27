import React from 'react';

interface WindowControlIconProps extends React.HTMLAttributes<HTMLDivElement> {
  type: 'close' | 'minimize' | 'maximize' | 'restore';
}

export const WindowControlIcon: React.FC<WindowControlIconProps> = ({
  type,
}) => {
  switch (type) {
    case 'close':
      return (
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <path d="m4 4 9 9m0-9-9.136 9.147" strokeWidth="2" stroke="#000" fill="none"/>
        </svg>
      );
    case 'minimize':
      return (
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <path strokeWidth="2" stroke="#000" fill="none" d="M4 12h7"/>
        </svg>
      );
    case 'maximize':
      return (
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#000">
            <path strokeWidth="2" d="M3 4h10"/>
            <path d="M3.5 4v9m9-9v9M3 12.5h10"/>
          </g>
        </svg>
      );
    case 'restore':
      return (
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#000" fill="none">
            <path strokeWidth="2" d="M5 5h8M3 8h8"/>
            <path d="M5.5 5v3m7-3v5m-2-2v5m-7-5v5m-.5-.5h8m-1-3h3"/>
          </g>
        </svg>
      );
  }
};
