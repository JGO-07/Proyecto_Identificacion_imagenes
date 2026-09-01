/**
 * Reglas geométricas de una bounding box. Funciones puras, sin dependencia de
 * base de datos, para que las reglas críticas de anotación sean testeables de
 * forma aislada (ver `geometry.spec.ts`).
 */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

/** Área en píxeles cuadrados. Compatible directo con el campo `area` de COCO. */
export function computeArea(width: number, height: number): number {
  return width * height;
}

/**
 * RN-01: una caja es válida solo si tiene tamaño positivo y queda completamente
 * contenida dentro de las dimensiones de la imagen.
 */
export function isWithinBounds(box: Box, image: Dimensions): boolean {
  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.width > 0 &&
    box.height > 0 &&
    box.x + box.width <= image.width &&
    box.y + box.height <= image.height
  );
}
