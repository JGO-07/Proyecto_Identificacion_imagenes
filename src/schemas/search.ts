import { z } from 'zod';
import { paginationSchema } from './common.js';

/** Query de `GET /api/search`: `q` obligatorio + paginación. */
export const searchQuerySchema = paginationSchema.extend({
  q: z.string().trim().min(1, 'Falta el parámetro de búsqueda "q"'),
});
export type SearchQuery = z.infer<typeof searchQuerySchema>;
