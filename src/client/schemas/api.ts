import { z } from 'zod';

// Estos contratos se mantienen libres de dependencias del servidor para que
// Drizzle, MariaDB y MinIO no formen parte del bundle del navegador.
export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const uploadFileInputSchema = z.object({
  mimeType: z.enum(ACCEPTED_MIME_TYPES, {
    message: 'Formato no soportado. Usa JPEG, PNG o WebP.',
  }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_BYTES, 'El archivo supera el máximo de 10 MB.'),
});

export const annotationCreateInputSchema = z.object({
  imageId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  isCrowd: z.union([z.literal(0), z.literal(1)]).default(0),
});

export const annotationUpdateInputSchema = annotationCreateInputSchema
  .omit({ imageId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const imageStatusSchema = z.enum(['pending', 'in_progress', 'completed']);

const isoDateSchema = z.string().min(1);

export const apiImageSchema = z.object({
  id: z.number().int().positive(),
  fileName: z.string().min(1),
  originalName: z.string().min(1),
  storagePath: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  status: imageStatusSchema,
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const apiCategorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  color: z.custom<`#${string}`>((value) =>
    typeof value === 'string' ? /^#[0-9A-Fa-f]{6}$/.test(value) : false,
  ),
  createdAt: isoDateSchema,
});

export const apiAnnotationSchema = z.object({
  id: z.number().int().positive(),
  imageId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  area: z.number().positive(),
  isCrowd: z.union([z.literal(0), z.literal(1)]),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
});

export const paginationSchema = z.object({
  limit: z.number().int().positive(),
  offset: z.number().int().min(0),
  total: z.number().int().min(0).optional(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

export const imageResponseSchema = z.object({ data: apiImageSchema });
export const imageListResponseSchema = z.object({
  data: z.array(apiImageSchema),
  pagination: paginationSchema,
});
export const categoryListResponseSchema = z.object({
  data: z.array(apiCategorySchema),
  pagination: paginationSchema,
});
export const annotationResponseSchema = z.object({ data: apiAnnotationSchema });
export const annotationListResponseSchema = z.object({
  data: z.array(apiAnnotationSchema),
  pagination: paginationSchema,
});
