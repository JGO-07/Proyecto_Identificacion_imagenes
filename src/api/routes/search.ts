import { Hono } from 'hono';
import { SearchQueryError, parseSearchQuery } from '../../lib/search-query.js';
import { searchQuerySchema } from '../../schemas/search.js';
import * as service from '../../services/search.service.js';
import { AppError } from '../errors.js';

export const searchRoutes = new Hono();

/**
 * RN-06: `GET /api/search?q=car AND person`.
 * El `q` se analiza aquí y la búsqueda se resuelve en SQL en el servicio.
 */
searchRoutes.get('/', async (c) => {
  const { q, limit, offset } = searchQuerySchema.parse(c.req.query());

  let parsed: ReturnType<typeof parseSearchQuery>;
  try {
    parsed = parseSearchQuery(q);
  } catch (error) {
    if (error instanceof SearchQueryError) {
      throw new AppError(400, 'INVALID_SEARCH_QUERY', error.message);
    }
    throw error;
  }

  const { data, total } = await service.searchImages(parsed, { limit, offset });
  return c.json({ data, pagination: { limit, offset, total }, query: parsed });
});
