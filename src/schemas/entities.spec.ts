import { describe, expect, it } from 'vitest';
import {
  annotationInsertSchema,
  categoryInsertSchema,
  categoryRowSchema,
  imageInsertSchema,
} from './entities.js';

describe('esquemas generados desde Drizzle (drizzle-zod)', () => {
  it('categoryRowSchema valida una fila completa', () => {
    const row = {
      id: 1,
      name: 'car',
      color: '#EF4444',
      createdAt: new Date(),
    };
    expect(categoryRowSchema.safeParse(row).success).toBe(true);
  });

  it('categoryInsertSchema rechaza un color no hexadecimal', () => {
    expect(categoryInsertSchema.safeParse({ name: 'car', color: 'rojo' }).success).toBe(false);
  });

  it('categoryInsertSchema exige name', () => {
    expect(categoryInsertSchema.safeParse({ color: '#000000' }).success).toBe(false);
  });

  it('imageInsertSchema rechaza dimensiones no positivas', () => {
    const base = {
      fileName: 'a.jpg',
      originalName: 'a.jpg',
      storagePath: 'uploads/a.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 100,
      width: 0,
      height: 10,
    };
    expect(imageInsertSchema.safeParse(base).success).toBe(false);
  });

  it('annotationInsertSchema rechaza coordenadas negativas', () => {
    const base = {
      imageId: 1,
      categoryId: 1,
      x: -1,
      y: 0,
      width: 10,
      height: 10,
      area: 100,
    };
    expect(annotationInsertSchema.safeParse(base).success).toBe(false);
  });
});
