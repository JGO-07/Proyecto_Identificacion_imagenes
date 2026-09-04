import { describe, expect, it } from 'vitest';
import type { AnnotationRow, CategoryRow, ImageRow } from '../db/types.js';
import { mapToCoco } from './coco-export.service.js';

const baseImage: ImageRow = {
  id: 1,
  fileName: 'img_auto_0.jpg',
  originalName: 'img_auto_0.jpg',
  storagePath: 'uploads/img_auto_0.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 1000,
  width: 1024,
  height: 682,
  status: 'pending',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const baseCategory: CategoryRow = {
  id: 10,
  name: 'car',
  color: '#EF4444',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

const baseAnnotation: AnnotationRow = {
  id: 100,
  imageId: 1,
  categoryId: 10,
  x: 100,
  y: 80,
  width: 300,
  height: 200,
  area: 60000,
  isCrowd: 0,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('exportación COCO (mapToCoco)', () => {
  it('produce la estructura oficial con ids consistentes entre secciones', () => {
    const dataset = mapToCoco({
      images: [baseImage],
      annotations: [baseAnnotation],
      categories: [baseCategory],
    });

    expect(Object.keys(dataset).sort()).toEqual(['annotations', 'categories', 'images']);
    expect(dataset.images[0]).toEqual({
      id: 1,
      file_name: 'img_auto_0.jpg',
      width: 1024,
      height: 682,
    });
    expect(dataset.categories[0]).toEqual({ id: 10, name: 'car' });
    expect(dataset.annotations[0]).toMatchObject({
      id: 100,
      image_id: 1,
      category_id: 10,
      iscrowd: 0,
    });

    const imageIds = new Set(dataset.images.map((i) => i.id));
    const categoryIds = new Set(dataset.categories.map((c) => c.id));
    for (const annotation of dataset.annotations) {
      expect(imageIds.has(annotation.image_id)).toBe(true);
      expect(categoryIds.has(annotation.category_id)).toBe(true);
    }
  });

  it('no produce ids duplicados', () => {
    const dataset = mapToCoco({
      images: [baseImage, { ...baseImage, id: 2 }],
      annotations: [],
      categories: [baseCategory],
    });
    expect(new Set(dataset.images.map((i) => i.id)).size).toBe(dataset.images.length);
  });

  it('la bbox tiene exactamente 4 coordenadas absolutas y el área es width*height', () => {
    const dataset = mapToCoco({
      images: [baseImage],
      annotations: [baseAnnotation],
      categories: [baseCategory],
    });

    const annotation = dataset.annotations[0];
    expect(annotation.bbox).toHaveLength(4);
    for (const coord of annotation.bbox) {
      expect(typeof coord).toBe('number');
      expect(coord).toBeGreaterThan(0);
    }
    expect(annotation.area).toBe(annotation.bbox[2] * annotation.bbox[3]);
    expect(annotation.area).toBeCloseTo(baseAnnotation.area);
  });

  it('falla si se invierten las dimensiones (width/height swap) — mutación', () => {
    const swapped = { ...baseAnnotation, width: 200, height: 300 };
    const dataset = mapToCoco({
      images: [baseImage],
      annotations: [swapped],
      categories: [baseCategory],
    });
    const annotation = dataset.annotations[0];

    // La bbox debe conservar el orden absoluto [x, y, width, height].
    expect(annotation.bbox).toEqual([swapped.x, swapped.y, swapped.width, swapped.height]);
    // El área debe corresponder a esas dimensiones reales, nunca al par invertido.
    expect(annotation.area).toBe(swapped.width * swapped.height);
  });

  it('lanza error si una anotación referencia una imagen inexistente — mutación', () => {
    expect(() =>
      mapToCoco({
        images: [baseImage],
        annotations: [{ ...baseAnnotation, imageId: 999 }, baseAnnotation],
        categories: [baseCategory],
      }),
    ).toThrow(/imagen inexistente/i);
  });

  it('lanza error si una anotación referencia una categoría inexistente — mutación', () => {
    expect(() =>
      mapToCoco({
        images: [baseImage],
        annotations: [{ ...baseAnnotation, categoryId: 999 }],
        categories: [baseCategory],
      }),
    ).toThrow(/categoría inexistente/i);
  });
});
