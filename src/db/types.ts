import type { annotations, categories, images } from './schema.js';

/**
 * Tipos de fila inferidos directamente del esquema Drizzle. No se declaran
 * interfaces duplicadas a mano en ninguna capa.
 */
export type CategoryRow = typeof categories.$inferSelect;
export type NewCategoryRow = typeof categories.$inferInsert;

export type ImageRow = typeof images.$inferSelect;
export type NewImageRow = typeof images.$inferInsert;

export type AnnotationRow = typeof annotations.$inferSelect;
export type NewAnnotationRow = typeof annotations.$inferInsert;

export const IMAGE_STATUSES = ['pending', 'in_progress', 'completed'] as const;
export type ImageStatus = (typeof IMAGE_STATUSES)[number];
