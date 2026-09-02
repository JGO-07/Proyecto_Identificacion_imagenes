import { eq } from 'drizzle-orm';
import { imageSize } from 'image-size';
import { unprocessable } from '../api/errors.js';
import { db } from '../db/index.js';
import { images } from '../db/schema.js';
import type { ImageRow } from '../db/types.js';
import { env } from '../lib/env.js';
import type { Pagination } from '../schemas/common.js';
import { type ImageCreate, type ImageUpdate, uploadFileSchema } from '../schemas/image.js';
import { ensureBucket, minioClient } from '../storage/minio.js';

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
