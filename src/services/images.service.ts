import type { Readable } from 'node:stream';
import { and, count, eq, exists, gte, lte, sql } from 'drizzle-orm';
import { imageSize } from 'image-size';
import { unprocessable } from '../api/errors.js';
import { db } from '../db/index.js';
import { annotations, images } from '../db/schema.js';
import type { ImageRow, ImageStatus } from '../db/types.js';
import { env } from '../lib/env.js';
import type { Pagination } from '../schemas/common.js';
import { type ImageCreate, type ImageUpdate, uploadFileSchema } from '../schemas/image.js';
import { ensureBucket, minioClient } from '../storage/minio.js';

/** RN-07: filtros combinables por clase, estado y rango de fechas de creación. */
export interface ImageFilters {
  status?: ImageStatus;
  categoryId?: number;
  from?: Date;
  to?: Date;
}

/** Condición WHERE combinada (AND) a partir de los filtros presentes. */
function imageFilterCondition(filters: ImageFilters) {
  const conditions = [];
  if (filters.status) {
    conditions.push(eq(images.status, filters.status));
  }
  if (filters.from) {
    conditions.push(gte(images.createdAt, filters.from));
  }
  if (filters.to) {
    conditions.push(lte(images.createdAt, filters.to));
  }
  if (filters.categoryId !== undefined) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(annotations)
          .where(
            and(eq(annotations.imageId, images.id), eq(annotations.categoryId, filters.categoryId)),
          ),
      ),
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/** Página de imágenes que cumplen los filtros (todo resuelto en SQL). */
export function buildFilteredImages(filters: ImageFilters, { limit, offset }: Pagination) {
  return db
    .select()
    .from(images)
    .where(imageFilterCondition(filters))
    .orderBy(images.id)
    .limit(limit)
    .offset(offset);
}

/** Conteo total con los MISMOS filtros (para una paginación consistente). */
export function buildFilteredImagesCount(filters: ImageFilters) {
  return db.select({ total: count() }).from(images).where(imageFilterCondition(filters));
}

export async function listImages(query: Pagination & ImageFilters): Promise<ImageRow[]> {
  const { limit, offset, ...filters } = query;
  return buildFilteredImages(filters, { limit, offset });
}

/** Total de imágenes (opcionalmente filtrado), para la paginación. */
export async function countImages(filters: ImageFilters = {}): Promise<number> {
  const rows = await buildFilteredImagesCount(filters);
  return Number(rows[0]?.total ?? 0);
}

export async function getImage(id: number): Promise<ImageRow | null> {
  const rows = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface ImageFile {
  body: Readable;
  contentType: string;
  contentLength: number;
}

/**
 * Objeto binario de una imagen, traído de MinIO. El navegador nunca accede a
 * MinIO directamente: `storage_path` es interno y este servicio hace de proxy.
 * Devuelve `null` si la imagen no existe; lanza `422 IMAGE_FILE_MISSING` si la
 * fila existe pero el objeto no está en el bucket.
 */
export async function getImageFile(id: number): Promise<ImageFile | null> {
  const image = await getImage(id);
  if (!image) {
    return null;
  }
  try {
    const body = await minioClient.getObject(env.MINIO_BUCKET_NAME, image.storagePath);
    return { body, contentType: image.mimeType, contentLength: image.sizeBytes };
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'NoSuchKey'
    ) {
      throw unprocessable(
        'IMAGE_FILE_MISSING',
        `La imagen ${id} existe en la base pero su archivo no está en el almacenamiento`,
      );
    }
    throw error;
  }
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

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

/** Reemplaza cualquier carácter fuera de `[a-zA-Z0-9._-]` y acota la longitud. */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.slice(-120) || 'imagen';
}

/**
 * RN-08: carga de una imagen. Valida tipo y tamaño EN EL SERVIDOR, extrae las
 * dimensiones reales del binario, sube el objeto a MinIO y persiste los
 * metadatos en MariaDB. Devuelve un error 422 con mensaje claro (no un 500) si
 * el archivo no es una imagen soportada.
 */
export async function createImageFromUpload({
  buffer,
  originalName,
  mimeType,
}: UploadInput): Promise<ImageRow> {
  const check = uploadFileSchema.safeParse({ mimeType, sizeBytes: buffer.length });
  if (!check.success) {
    throw unprocessable('INVALID_UPLOAD', check.error.issues[0]?.message ?? 'Archivo no válido');
  }

  let width: number | undefined;
  let height: number | undefined;
  try {
    const dimensions = imageSize(buffer);
    width = dimensions.width;
    height = dimensions.height;
  } catch {
    throw unprocessable('UNREADABLE_IMAGE', 'El archivo no es una imagen que se pueda leer');
  }
  if (!width || !height) {
    throw unprocessable(
      'UNREADABLE_IMAGE',
      'No se pudieron determinar las dimensiones de la imagen',
    );
  }

  const fileName = `${Date.now()}_${safeFileName(originalName)}`;
  const storagePath = `uploads/${fileName}`;

  await ensureBucket();
  await minioClient.putObject(env.MINIO_BUCKET_NAME, storagePath, buffer, buffer.length, {
    'Content-Type': mimeType,
  });

  const [inserted] = await db
    .insert(images)
    .values({
      fileName,
      originalName,
      storagePath,
      mimeType,
      sizeBytes: buffer.length,
      width,
      height,
      status: 'pending',
    })
    .$returningId();

  const created = await getImage(inserted.id);
  if (!created) {
    throw new Error('No se pudo recuperar la imagen recién subida');
  }
  return created;
}
