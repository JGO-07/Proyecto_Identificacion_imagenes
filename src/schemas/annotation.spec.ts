import { describe, expect, it } from 'vitest';
import { annotationCreateSchema } from './annotation.js';

const validInput = {
  imageId: 1,
  categoryId: 2,
  x: 10,
  y: 20,
  width: 100,
  height: 50,
};

describe('annotationCreateSchema', () => {
  it('acepta una anotación válida y aplica isCrowd = 0 por defecto (RN-01)', () => {
    const parsed = annotationCreateSchema.parse(validInput);
    expect(parsed.isCrowd).toBe(0);
  });

  it('rechaza una anotación sin categoría (RN-02)', () => {
    const { categoryId, ...withoutCategory } = validInput;
    void categoryId;
    expect(annotationCreateSchema.safeParse(withoutCategory).success).toBe(false);
  });

  it('rechaza ancho o alto no positivos (RN-01)', () => {
    expect(annotationCreateSchema.safeParse({ ...validInput, width: 0 }).success).toBe(false);
    expect(annotationCreateSchema.safeParse({ ...validInput, height: -1 }).success).toBe(false);
  });

  it('rechaza coordenadas negativas (RN-01)', () => {
    expect(annotationCreateSchema.safeParse({ ...validInput, x: -5 }).success).toBe(false);
  });

  it('ignora un campo area enviado por el cliente (RN-03)', () => {
    const parsed = annotationCreateSchema.parse({ ...validInput, area: 999999 });
    expect(parsed).not.toHaveProperty('area');
  });

  it('solo admite isCrowd 0 o 1', () => {
    expect(annotationCreateSchema.safeParse({ ...validInput, isCrowd: 2 }).success).toBe(false);
  });
});
