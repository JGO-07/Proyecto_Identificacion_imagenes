import { describe, expect, it } from 'vitest';
import { type Box, type Dimensions, computeArea, isWithinBounds } from './geometry.js';

const image: Dimensions = { width: 640, height: 480 };

describe('computeArea (RN-03)', () => {
  it('devuelve width * height', () => {
    expect(computeArea(10, 20)).toBe(200);
  });

  it('no depende del orden de los argumentos para el resultado numérico', () => {
    expect(computeArea(20, 10)).toBe(computeArea(10, 20));
  });
});

describe('isWithinBounds (RN-01)', () => {
  it('acepta una caja completamente dentro de la imagen', () => {
    const box: Box = { x: 10, y: 10, width: 100, height: 100 };
    expect(isWithinBounds(box, image)).toBe(true);
  });

  it('acepta una caja que toca el borde exacto de la imagen', () => {
    const box: Box = { x: 540, y: 380, width: 100, height: 100 };
    expect(isWithinBounds(box, image)).toBe(true);
  });

  it('rechaza una caja que se sale por la derecha', () => {
    const box: Box = { x: 600, y: 10, width: 100, height: 100 };
    expect(isWithinBounds(box, image)).toBe(false);
  });

  it('rechaza coordenadas negativas', () => {
    const box: Box = { x: -1, y: 10, width: 50, height: 50 };
    expect(isWithinBounds(box, image)).toBe(false);
  });

  it('rechaza ancho o alto no positivos', () => {
    expect(isWithinBounds({ x: 0, y: 0, width: 0, height: 50 }, image)).toBe(false);
    expect(isWithinBounds({ x: 0, y: 0, width: 50, height: -5 }, image)).toBe(false);
  });
});
