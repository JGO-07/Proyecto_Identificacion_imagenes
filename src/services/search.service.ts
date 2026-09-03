import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { annotations, categories, images } from '../db/schema.js';
import type { ImageRow } from '../db/types.js';
import type { ParsedSearchQuery } from '../lib/search-query.js';
import type { Pagination } from '../schemas/common.js';

/**
 * RN-06: subconsulta con los `image_id` que satisfacen la búsqueda.
 *  - OR  -> la imagen tiene una anotación de alguna de las clases.
 *  - AND -> la imagen tiene anotaciones de TODAS las clases (`HAVING COUNT(DISTINCT)`).
 * Todo se resuelve en SQL; nunca se traen filas a memoria para filtrarlas.
 */
function matchingImageIds({ operator, terms }: ParsedSearchQuery) {
  const grouped = db
    .select({ imageId: annotations.imageId })
    .from(annotations)
    .innerJoin(categories, eq(categories.id, annotations.categoryId))
    .where(inArray(categories.name, terms))
    .groupBy(annotations.imageId);

  return operator === 'AND'
    ? grouped.having(sql`count(distinct ${categories.name}) = ${terms.length}`)
    : grouped;
}

/** Página de imágenes que cumplen la búsqueda. */
export function buildImageSearch(parsed: ParsedSearchQuery, { limit, offset }: Pagination) {
  return db
    .select()
    .from(images)
    .where(inArray(images.id, matchingImageIds(parsed)))
    .orderBy(images.id)
    .limit(limit)
    .offset(offset);
}

/** Conteo total de imágenes que cumplen la búsqueda (misma subconsulta, sin LIMIT). */
export function buildImageSearchCount(parsed: ParsedSearchQuery) {
  return db
    .select({ total: sql<number>`count(*)` })
    .from(images)
    .where(inArray(images.id, matchingImageIds(parsed)));
}

export async function searchImages(
  parsed: ParsedSearchQuery,
  page: Pagination,
): Promise<{ data: ImageRow[]; total: number }> {
  const [data, countRows] = await Promise.all([
    buildImageSearch(parsed, page),
    buildImageSearchCount(parsed),
  ]);
  return { data, total: Number(countRows[0]?.total ?? 0) };
}
