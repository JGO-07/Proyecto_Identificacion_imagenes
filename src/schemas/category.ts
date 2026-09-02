import { z } from 'zod';
import { HEX_COLOR, categoryInsertSchema } from './entities.js';

/**
 * Alta de categoría, derivada del esquema de inserción generado desde Drizzle.
 * `color` lleva el azul de la UI por defecto.
 */
export const categoryCreateSchema = categoryInsertSchema
  .omit({ id: true, createdAt: true })
  .extend({
    color: z
      .string()
      .regex(HEX_COLOR, 'El color debe ser hexadecimal de 6 dígitos, ej. #3B82F6')
      .default('#3B82F6'),
  });
export type CategoryCreate = z.infer<typeof categoryCreateSchema>;

/** Edición parcial: al menos un campo. */
export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
