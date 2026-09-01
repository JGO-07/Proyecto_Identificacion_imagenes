import { z } from 'zod';
import { paginationSchema } from './common.js';

/**
 * Alta de una bounding box. `area` NO se acepta del cliente: se calcula en el
 * servidor como `width * height` para garantizar coherencia con COCO (RN-03).
 * La validación de que la caja cae dentro de la imagen y de que la categoría
 * existe se hace en la capa de servicio (RN-01, RN-02).
 */
export const annotationCreateSchema = z.object({
  imageId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  isCrowd: z.union([z.literal(0), z.literal(1)]).default(0),
});
export type AnnotationCreate = z.infer<typeof annotationCreateSchema>;

/** Edición de una caja existente. No se permite mover la anotación de imagen. */
export const annotationUpdateSchema = annotationCreateSchema
  .omit({ imageId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });
export type AnnotationUpdate = z.infer<typeof annotationUpdateSchema>;

/** Listado de anotaciones, opcionalmente filtrado por imagen. */
export const annotationListQuerySchema = paginationSchema.extend({
  imageId: z.coerce.number().int().positive().optional(),
});
export type AnnotationListQuery = z.infer<typeof annotationListQuerySchema>;
