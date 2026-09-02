import { and, count, eq } from 'drizzle-orm';
import { notFound, unprocessable } from '../api/errors.js';
import { db } from '../db/index.js';
import { annotations } from '../db/schema.js';
import type { AnnotationRow } from '../db/types.js';
import { computeArea, isWithinBounds } from '../lib/geometry.js';
import { shouldPromoteOnFirstAnnotation } from '../lib/image-status.js';
import type {
  AnnotationCreate,
  AnnotationListQuery,
  AnnotationUpdate,
} from '../schemas/annotation.js';
import { getCategory } from './categories.service.js';
import { getImage, updateImageStatus } from './images.service.js';

export async function listAnnotations(query: AnnotationListQuery): Promise<AnnotationRow[]> {
  const { limit, offset, imageId } = query;
  const base = db.select().from(annotations).$dynamic();
  const filtered = imageId ? base.where(eq(annotations.imageId, imageId)) : base;
  return filtered.limit(limit).offset(offset).orderBy(annotations.id);
}

/** Total de anotaciones (opcionalmente de una imagen), para la paginación. */
export async function countAnnotations(imageId?: number): Promise<number> {
  const base = db.select({ total: count() }).from(annotations).$dynamic();
  const rows = await (imageId ? base.where(eq(annotations.imageId, imageId)) : base);
  return Number(rows[0]?.total ?? 0);
}

export async function getAnnotation(id: number): Promise<AnnotationRow | null> {
  const rows = await db.select().from(annotations).where(eq(annotations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createAnnotation(input: AnnotationCreate): Promise<AnnotationRow> {
  const image = await getImage(input.imageId);
  if (!image) {
    throw notFound(`La imagen ${input.imageId} no existe`);
  }

  // RN-02: ninguna caja sin una clase válida.
  const category = await getCategory(input.categoryId);
  if (!category) {
    throw unprocessable('CATEGORY_NOT_FOUND', `La categoría ${input.categoryId} no existe`);
  }

  // RN-01: la caja debe caber dentro de la imagen.
  if (!isWithinBounds(input, image)) {
    throw unprocessable(
      'BBOX_OUT_OF_BOUNDS',
      'La bounding box queda fuera de las dimensiones de la imagen',
    );
  }

  // RN-03: el área se calcula en el servidor.
  const area = computeArea(input.width, input.height);

  const [inserted] = await db
    .insert(annotations)
    .values({ ...input, area })
    .$returningId();

  const created = await getAnnotation(inserted.id);
  if (!created) {
    throw new Error('No se pudo recuperar la anotación recién creada');
  }

  // RN-05: la primera anotación mueve la imagen de 'pending' a 'in_progress'.
  if (shouldPromoteOnFirstAnnotation(image.status)) {
    await updateImageStatus(image.id, { status: 'in_progress' });
  }

  return created;
}

export async function updateAnnotation(
  id: number,
  input: AnnotationUpdate,
): Promise<AnnotationRow | null> {
  const current = await getAnnotation(id);
  if (!current) {
    return null;
  }

  if (input.categoryId !== undefined) {
    const category = await getCategory(input.categoryId);
    if (!category) {
      throw unprocessable('CATEGORY_NOT_FOUND', `La categoría ${input.categoryId} no existe`);
    }
  }

  const next = {
    x: input.x ?? current.x,
    y: input.y ?? current.y,
    width: input.width ?? current.width,
    height: input.height ?? current.height,
  };

  const image = await getImage(current.imageId);
  if (image && !isWithinBounds(next, image)) {
    throw unprocessable(
      'BBOX_OUT_OF_BOUNDS',
      'La bounding box queda fuera de las dimensiones de la imagen',
    );
  }

  const area = computeArea(next.width, next.height);
  const [result] = await db
    .update(annotations)
    .set({ ...input, ...next, area })
    .where(eq(annotations.id, id));

  if (result.affectedRows === 0) {
    return null;
  }
  return getAnnotation(id);
}

export async function deleteAnnotation(id: number): Promise<boolean> {
  const [result] = await db.delete(annotations).where(eq(annotations.id, id));
  return result.affectedRows > 0;
}

export async function countAnnotationsByImage(imageId: number): Promise<number> {
  const rows = await db
    .select({ id: annotations.id })
    .from(annotations)
    .where(and(eq(annotations.imageId, imageId)));
  return rows.length;
}
