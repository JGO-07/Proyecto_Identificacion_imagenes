import { z } from 'zod';

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/** Alta de categoría. `color` por defecto azul de la UI. */
export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
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
