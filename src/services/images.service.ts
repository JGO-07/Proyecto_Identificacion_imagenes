import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { images } from '../db/schema.js';
import type { ImageRow } from '../db/types.js';
import type { Pagination } from '../schemas/common.js';
import type { ImageCreate, ImageUpdate } from '../schemas/image.js';

export async function listImages({ limit, offset }: Pagination): Promise<ImageRow[]> {
  return db.select().from(images).limit(limit).offset(offset).orderBy(images.id);
}

export async function getImage(id: number): Promise<ImageRow | null> {
  const rows = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createImage(input: ImageCreate): Promise<ImageRow> {
  const [inserted] = await db.insert(images).values(input).$returningId();
  const created = await getImage(inserted.id);
  if (!created) {
    throw new Error('No se pudo recuperar la imagen recién creada');
  }
  return created;
}

export async function updateImageStatus(id: number, input: ImageUpdate): Promise<ImageRow | null> {
  const [result] = await db.update(images).set(input).where(eq(images.id, id));
  if (result.affectedRows === 0) {
    return null;
  }
  return getImage(id);
}

export async function deleteImage(id: number): Promise<boolean> {
  const [result] = await db.delete(images).where(eq(images.id, id));
  return result.affectedRows > 0;
}
