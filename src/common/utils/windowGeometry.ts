/**
 * Géométrie des fenêtres : calculs purs, sans store ni DOM.
 */

/** Bord ou coin par lequel on redimensionne une fenêtre. */
export type ResizePole = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface WindowGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Plus petite taille qu'un redimensionnement à la souris peut donner à une
 * fenêtre : la barre de titre (30 px) et la bordure basse (4 px) en hauteur,
 * l'icône, un bout de titre et les trois boutons en largeur. En dessous, la
 * fenêtre ne pourrait plus être ni déplacée ni fermée.
 */
export const MIN_WINDOW_SIZE = { width: 123, height: 34 } as const;

/**
 * Géométrie d'une fenêtre pendant un redimensionnement.
 *
 * `start` est la géométrie au début du geste, `dx` / `dy` le déplacement de la
 * souris depuis ce début. La taille est bornée par `minSize` ; le bord opposé
 * à celui que l'on tire ne bouge jamais, même quand la borne est atteinte
 * (tirer le bord gauche vers la droite ne fait pas glisser la fenêtre).
 */
export const resizeGeometry = (
  start: WindowGeometry,
  pole: ResizePole,
  dx: number,
  dy: number,
  minSize: { width: number; height: number } = MIN_WINDOW_SIZE
): WindowGeometry => {
  const fromWest = pole.includes('w');
  const fromEast = pole.includes('e');
  const fromNorth = pole.includes('n');
  const fromSouth = pole.includes('s');

  const width = Math.max(minSize.width, start.width + (fromEast ? dx : fromWest ? -dx : 0));
  const height = Math.max(minSize.height, start.height + (fromSouth ? dy : fromNorth ? -dy : 0));

  return {
    x: fromWest ? start.x + start.width - width : start.x,
    y: fromNorth ? start.y + start.height - height : start.y,
    width,
    height,
  };
};
