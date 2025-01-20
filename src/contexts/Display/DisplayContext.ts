import React from 'react';

export type DisplayContextType = {
  width: number;
  height: number;
};

// Default value : 640×480
export const DisplayContext = React.createContext<DisplayContextType>({
  width: 640,
  height: 480,
});
