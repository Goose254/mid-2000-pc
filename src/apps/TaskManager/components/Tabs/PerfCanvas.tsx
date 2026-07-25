import React, { useEffect, useRef } from 'react';

import { HISTORY_LENGTH } from '../../stores/taskManagerStore';

/**
 * Composants canvas du Gestionnaire des tâches (style XP : fond noir, tracé
 * vert, grille sombre). Réutilisés par les onglets Performances et Mise en
 * réseau. Le projet maîtrise déjà le canvas pour les écrans BIOS/boot ; on suit
 * la même approche (dessin impératif dans un `useEffect`).
 */

const BACKGROUND = '#000000';
const GRID_COLOR = '#0b5f0b';
const GRID_CELL = 12;

// Jauge LED (valeur instantanée) : vert vif pour les cellules allumées, damier
// vert sombre/noir pour les cellules éteintes.
const GAUGE_ON = '#00ff00';
const GAUGE_OFF_DOT = '#0a3a0a';

interface GraphCanvasProps {
  /** Historique des valeurs (0..max), le plus récent en fin de tableau. */
  history: number[];
  /** Compteur de tick : fait défiler la grille vers la gauche. */
  tick: number;
  /** Valeur maximale de l'axe (100 par défaut). */
  max?: number;
  /** Couleur du tracé. */
  color?: string;
  className?: string;
}

/** Courbe défilante remplie (historique d'utilisation). */
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  history,
  tick,
  max = 100,
  color = '#00ff00',
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<() => void>(() => {});

  drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, w, h);

    // Grille défilante
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const offset = (tick * 2) % GRID_CELL;
    for (let x = w - offset; x >= 0; x -= GRID_CELL) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = h; y >= 0; y -= GRID_CELL) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();

    // Tracé (ancré à droite : les valeurs récentes arrivent par la droite)
    const count = history.length;
    if (count >= 1) {
      const stepX = w / (HISTORY_LENGTH - 1);
      const toX = (index: number) => w - (count - 1 - index) * stepX;
      const toY = (value: number) => h - Math.max(0, Math.min(1, value / max)) * (h - 1);

      // Remplissage sous la courbe (vert sombre)
      ctx.beginPath();
      ctx.moveTo(toX(0), h);
      history.forEach((value, index) => ctx.lineTo(toX(index), toY(value)));
      ctx.lineTo(toX(count - 1), h);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 200, 0, 0.25)';
      ctx.fill();

      // Ligne
      ctx.beginPath();
      history.forEach((value, index) => {
        const x = toX(index);
        const y = toY(value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  // Redessine à chaque rendu (donc à chaque tick du store).
  useEffect(() => {
    drawRef.current();
  });

  // Ajuste la résolution du canvas à sa taille CSS réelle (tracé net).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const width = canvas.clientWidth || canvas.width;
      const height = canvas.clientHeight || canvas.height;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      drawRef.current();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return <canvas ref={canvasRef} width={300} height={90} className={className} />;
};

interface GaugeCanvasProps {
  /** Valeur courante servant au remplissage (0..max). */
  value: number;
  max?: number;
  /** Texte affiché en vert DANS la boîte (ex: « 10 % » ou « 207 Mo »). */
  label: string;
  className?: string;
}

/**
 * Jauge LED verticale à deux colonnes (valeur instantanée), fidèle au
 * Gestionnaire des tâches XP : boîte noire (à bezel côté CSS) contenant le
 * texte en vert et deux colonnes de cellules empilées de hauteur fixe. Une
 * cellule allumée est verte pleine ; une cellule éteinte affiche un damier fin
 * vert sombre / noir. Le remplissage part du bas, proportionnel à la valeur.
 */
export const GaugeCanvas: React.FC<GaugeCanvasProps> = ({
  value,
  max = 100,
  label,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const patternRef = useRef<CanvasPattern | null>(null);
  const drawRef = useRef<() => void>(() => {});

  drawRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Motif mosaïque des cellules éteintes : damier 1px vert sombre / noir.
    if (!patternRef.current) {
      const off = document.createElement('canvas');
      off.width = 2;
      off.height = 2;
      const octx = off.getContext('2d');
      if (octx) {
        octx.fillStyle = '#000000';
        octx.fillRect(0, 0, 2, 2);
        octx.fillStyle = GAUGE_OFF_DOT;
        octx.fillRect(0, 0, 1, 1);
        octx.fillRect(1, 1, 1, 1);
        patternRef.current = ctx.createPattern(off, 'repeat');
      }
    }

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, w, h);

    // Bargraph LED à deux colonnes, avec du padding interne (la boîte noire
    // remplit la section, l'espace est reporté à l'intérieur autour des LED).
    // Le texte est réservé dans une bande en bas de la boîte.
    const padX = 24;
    const ledTop = 8;
    const textH = 24;
    const ledBottom = h - textH;
    const colGap = 1;
    const cellH = 3;
    const cellGap = 1;
    const slot = cellH + cellGap;
    const areaH = ledBottom - ledTop;
    const numCells = Math.max(1, Math.floor(areaH / slot));
    const ratio = Math.max(0, Math.min(1, value / max));
    const litCells = Math.round(ratio * numCells);
    const colW = Math.max(1, Math.floor((w - padX * 2 - colGap) / 2));

    for (let col = 0; col < 2; col++) {
      const x = padX + col * (colW + colGap);
      for (let i = 0; i < numCells; i++) {
        const y = ledBottom - (i + 1) * slot + cellGap;
        if (i < litCells) {
          ctx.fillStyle = GAUGE_ON;
          ctx.fillRect(x, y, colW, cellH);
        } else if (patternRef.current) {
          ctx.fillStyle = patternRef.current;
          ctx.fillRect(x, y, colW, cellH);
        }
      }
    }

    // Texte (%/Mo) en vert, SOUS la jauge (non gras).
    ctx.fillStyle = GAUGE_ON;
    ctx.font = '11px "Tahoma", "Lucida Console", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, Math.round(w / 2), h - 6);
  };

  // Redessine à chaque changement de valeur / libellé.
  useEffect(() => {
    drawRef.current();
  }, [value, max, label]);

  // Ajuste la résolution du canvas à sa taille CSS réelle (re-render au resize
  // du conteneur, pour que la jauge s'étire avec la fenêtre).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const width = canvas.clientWidth || canvas.width;
      const height = canvas.clientHeight || canvas.height;
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      drawRef.current();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return <canvas ref={canvasRef} width={56} height={120} className={className} />;
};
