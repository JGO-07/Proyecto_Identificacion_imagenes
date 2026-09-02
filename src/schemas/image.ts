import { z } from 'zod';
import { IMAGE_STATUSES } from '../db/types.js';
import { imageInsertSchema } from './entities.js';

/** Tipos MIME aceptados para carga de imágenes (RN-08). */
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Tamaño máximo de archivo: 10 MB (RN-08). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Registro de metadatos de una imagen ya subida a MinIO, derivado del esquema
 * de inserción generado desde Drizzle. La subida binaria la resuelve el
 * endpoint `POST /api/images/upload`.
 */
export const imageCreateSchema = imageInsertSchema
  .omit({ id: true, status: true, createdAt: true, updatedAt: true })
  .extend({
    mimeType: z.enum(ACCEPTED_MIME_TYPES),
    sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
  });
export type ImageCreate = z.infer<typeof imageCreateSchema>;

/** Cambio de estado de anotación de una imagen. */
export const imageUpdateSchema = z.object({
  status: z.enum(IMAGE_STATUSES),
});
export type ImageUpdate = z.infer<typeof imageUpdateSchema>;

/** Validación del archivo recibido en la carga, previa a subir a MinIO (RN-08). */
export const uploadFileSchema = z.object({
  mimeType: z.enum(ACCEPTED_MIME_TYPES, {
    message: 'Formato no soportado. Usa JPEG, PNG o WebP.',
  }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_BYTES, 'El archivo supera el máximo de 10 MB.'),
});
export type UploadFile = z.infer<typeof uploadFileSchema>;
