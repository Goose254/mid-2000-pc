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
  /** Valeur courante (0..max). */
  value: number;
  max?: number;
  color?: string;
  className?: string;
}

/** Jauge verticale (valeur instantanée), style XP. */
export const GaugeCanvas: React.FC<GaugeCanvasProps> = ({
  value,
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

    // Barre de remplissage
    const ratio = Math.max(0, Math.min(1, value / max));
    const barHeight = ratio * h;
    ctx.fillStyle = color;
    ctx.fillRect(0, h - barHeight, w, barHeight);

    // Lignes de grille horizontales par-dessus
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = h; y >= 0; y -= GRID_CELL) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
  };

  // Redessine à chaque changement de valeur.
  useEffect(() => {
    drawRef.current();
  }, [value, max, color]);

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

  return <canvas ref={canvasRef} width={60} height={90} className={className} />;
};
