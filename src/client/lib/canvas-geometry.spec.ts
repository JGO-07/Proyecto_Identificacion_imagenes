import { describe, expect, it } from 'vitest';
import { clampBox, createBoxFromPoints, toImagePoint } from './canvas-geometry.js';

const imageSize = { width: 1920, height: 1080 };

describe('geometría del canvas', () => {
  it('convierte una posición visual a píxeles absolutos de la imagen', () => {
    expect(toImagePoint({ x: 75, y: 40 }, 0.5)).toEqual({ x: 150, y: 80 });
  });

  it('crea una caja aunque el usuario dibuje de derecha a izquierda', () => {
    expect(createBoxFromPoints({ x: 400, y: 300 }, { x: 100, y: 120 }, imageSize)).toEqual({
      x: 100,
      y: 120,
      width: 300,
      height: 180,
    });
  });

  it('no crea cajas accidentales menores al tamaño mínimo', () => {
    expect(createBoxFromPoints({ x: 100, y: 100 }, { x: 104, y: 103 }, imageSize, 10)).toBeNull();
  });

  it('mantiene una caja dentro de los límites de la imagen', () => {
    expect(clampBox({ x: 1800, y: 1000, width: 300, height: 200 }, imageSize)).toEqual({
      x: 1620,
      y: 880,
      width: 300,
      height: 200,
    });
  });

  it('limita cajas más grandes que la imagen completa', () => {
    expect(clampBox({ x: -20, y: -30, width: 2200, height: 1400 }, imageSize)).toEqual({
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
    });
  });
});
