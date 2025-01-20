import React, { useContext, useEffect, useState } from 'react';
import { DisplayContext } from '../../contexts/Display/DisplayContext';

interface DisplayProps {
  width?: number;
  height?: number;
  children?: React.ReactNode;
}

/**
 * Composant qui calcule le scale et
 * centre automatiquement le contenu
 * en fonction de la taille de la fenêtre.
 */
const Display: React.FC<DisplayProps> = ({
  width,
  height,
  children,
}) => {
  // Récupère la taille par défaut depuis le contexte
  const { width: ctxWidth, height: ctxHeight } = useContext(DisplayContext);

  // Si `width` ou `height` sont passés en props,
  // ils écrasent les valeurs du contexte.
  const baseWidth = width ?? ctxWidth;
  const baseHeight = height ?? ctxHeight;

  const [scale, setScale] = useState(1);

  useEffect(() => {
    function handleResize() {
      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);
    }

    // Initialiser l'échelle une première fois,
    // puis écouter les redimensionnements
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [baseWidth, baseHeight]);

  return (
    // Conteneur plein écran qui centre le contenu
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    >
      {/* L'élément "fixe" qui sera scaled */}
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          //imageRendering: 'pixelated',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Display;
