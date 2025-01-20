import React from 'react';
import { DisplayContext, DisplayContextType } from './DisplayContext';

interface DisplayProviderProps {
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

/**
 * Si on veut changer la taille de référence
 * globalement (par ex. 800×600), on peut le faire ici.
 * Sinon, les valeurs par défaut (640×480) resteront utilisées.
 */
const DisplayProvider: React.FC<DisplayProviderProps> = ({
  width = 640,
  height = 480,
  children,
}) => {
  const contextValue: DisplayContextType = { width, height };

  return (
    <DisplayContext.Provider value={contextValue}>
      {children}
    </DisplayContext.Provider>
  );
};

export default DisplayProvider;
