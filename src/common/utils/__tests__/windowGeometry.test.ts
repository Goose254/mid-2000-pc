import { describe, expect, it } from 'vitest';
import { MIN_WINDOW_SIZE, ResizePole, resizeGeometry } from '../windowGeometry';

const start = { x: 100, y: 100, width: 600, height: 400 };
const right = (g: { x: number; width: number }) => g.x + g.width;
const bottom = (g: { y: number; height: number }) => g.y + g.height;

describe('resizeGeometry', () => {
  it('agrandit par le bord droit ou bas sans déplacer la fenêtre', () => {
    expect(resizeGeometry(start, 'e', 50, 999)).toEqual({ x: 100, y: 100, width: 650, height: 400 });
    expect(resizeGeometry(start, 's', 999, 30)).toEqual({ x: 100, y: 100, width: 600, height: 430 });
    expect(resizeGeometry(start, 'se', 50, 30)).toEqual({ x: 100, y: 100, width: 650, height: 430 });
  });

  it('déplace l\'origine quand on tire le bord gauche ou haut', () => {
    expect(resizeGeometry(start, 'w', -50, 999)).toEqual({ x: 50, y: 100, width: 650, height: 400 });
    expect(resizeGeometry(start, 'n', 999, -30)).toEqual({ x: 100, y: 70, width: 600, height: 430 });
    expect(resizeGeometry(start, 'nw', 20, 10)).toEqual({ x: 120, y: 110, width: 580, height: 390 });
  });

  it('combine les deux axes dans les coins', () => {
    expect(resizeGeometry(start, 'ne', 40, -20)).toEqual({ x: 100, y: 80, width: 640, height: 420 });
    expect(resizeGeometry(start, 'sw', -40, 20)).toEqual({ x: 60, y: 100, width: 640, height: 420 });
  });

  it('ne change rien sans déplacement de la souris', () => {
    for (const pole of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as ResizePole[]) {
      expect(resizeGeometry(start, pole, 0, 0)).toEqual(start);
    }
  });

  it('ne descend jamais sous la taille minimale', () => {
    expect(resizeGeometry(start, 'e', -5000, 0).width).toBe(MIN_WINDOW_SIZE.width);
    expect(resizeGeometry(start, 's', 0, -5000).height).toBe(MIN_WINDOW_SIZE.height);
    expect(resizeGeometry(start, 'nw', 5000, 5000)).toMatchObject({ ...MIN_WINDOW_SIZE });
  });

  it('garde le bord opposé fixe une fois la taille minimale atteinte', () => {
    for (const dx of [550, 900, 5000]) {
      const fromWest = resizeGeometry(start, 'w', dx, 0);
      expect(right(fromWest)).toBe(right(start));
      expect(fromWest.width).toBe(MIN_WINDOW_SIZE.width);
    }
    const fromNorth = resizeGeometry(start, 'n', 0, 5000);
    expect(bottom(fromNorth)).toBe(bottom(start));

    const fromEast = resizeGeometry(start, 'e', -5000, 0);
    expect(fromEast.x).toBe(start.x);
  });

  it('accepte une taille minimale sur mesure', () => {
    expect(resizeGeometry(start, 'se', -5000, -5000, { width: 200, height: 150 })).toEqual({
      x: 100,
      y: 100,
      width: 200,
      height: 150,
    });
  });
});
