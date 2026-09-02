import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { annotations, categories, images } from '../db/schema.js';

/**
 * Esquemas Zod generados directamente del esquema Drizzle final
 * (`src/db/schema.ts`). Los esquemas de request de cada recurso se derivan de
 * estos con `.omit()` / `.extend()`, y los tipos salen por `z.infer`. No hay
 * interfaces duplicadas a mano.
 */

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/** Filas tal cual salen de la base (SELECT). */
export const categoryRowSchema = createSelectSchema(categories);
export const imageRowSchema = createSelectSchema(images);
export const annotationRowSchema = createSelectSchema(annotations);

/** Formas de inserción (INSERT) con los refinamientos de negocio aplicados. */
export const categoryInsertSchema = createInsertSchema(categories, {
  name: (schema) => schema.trim().min(1).max(100),
  color: (schema) =>
    schema.regex(HEX_COLOR, 'El color debe ser hexadecimal de 6 dígitos, ej. #3B82F6'),
});

export const imageInsertSchema = createInsertSchema(images, {
  fileName: (schema) => schema.min(1).max(255),
  originalName: (schema) => schema.min(1).max(255),
  storagePath: (schema) => schema.min(1),
  sizeBytes: (schema) => schema.positive(),
  width: (schema) => schema.positive(),
  height: (schema) => schema.positive(),
});

export const annotationInsertSchema = createInsertSchema(annotations, {
  x: (schema) => schema.min(0),
  y: (schema) => schema.min(0),
  width: (schema) => schema.positive(),
  height: (schema) => schema.positive(),
  area: (schema) => schema.positive(),
});
