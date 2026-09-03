export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BoundingBox extends Point, Size {}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function toImagePoint(point: Point, scale: number): Point {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new RangeError('La escala del canvas debe ser mayor que cero');
  }

  return {
    x: Math.round(point.x / scale),
    y: Math.round(point.y / scale),
  };
}

export function clampBox(box: BoundingBox, imageSize: Size): BoundingBox {
  const width = clamp(box.width, 0, imageSize.width);
  const height = clamp(box.height, 0, imageSize.height);

  return {
    x: clamp(box.x, 0, imageSize.width - width),
    y: clamp(box.y, 0, imageSize.height - height),
    width,
    height,
  };
}

export function createBoxFromPoints(
  start: Point,
  end: Point,
  imageSize: Size,
  minimumSize = 10,
): BoundingBox | null {
  const startX = clamp(start.x, 0, imageSize.width);
  const startY = clamp(start.y, 0, imageSize.height);
  const endX = clamp(end.x, 0, imageSize.width);
  const endY = clamp(end.y, 0, imageSize.height);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  if (width < minimumSize || height < minimumSize) {
    return null;
  }

  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width,
    height,
  };
}
