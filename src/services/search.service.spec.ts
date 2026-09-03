import { describe, expect, it } from 'vitest';
import { buildImageSearch, buildImageSearchCount } from './search.service.js';

const page = { limit: 20, offset: 0 };

describe('búsqueda resuelta en SQL (RN-06)', () => {
  it('AND genera GROUP BY + HAVING COUNT(DISTINCT ...) en una subconsulta', () => {
    const { sql } = buildImageSearch({ operator: 'AND', terms: ['car', 'person'] }, page).toSQL();
    expect(sql).toMatch(/group by/i);
    expect(sql).toMatch(/having count\(distinct/i);
    expect(sql).toMatch(/in \(select/i);
  });

  it('OR genera GROUP BY sin HAVING', () => {
    const { sql } = buildImageSearch({ operator: 'OR', terms: ['car', 'person'] }, page).toSQL();
    expect(sql).toMatch(/group by/i);
    expect(sql).not.toMatch(/having/i);
  });

  it('la consulta de conteo comparte la subconsulta y no lleva LIMIT', () => {
    const { sql } = buildImageSearchCount({ operator: 'AND', terms: ['car'] }).toSQL();
    expect(sql).toMatch(/count\(\*\)/i);
    expect(sql).toMatch(/in \(select/i);
    expect(sql).not.toMatch(/limit/i);
  });

  it('los términos viajan como parámetros, no interpolados como texto', () => {
    const { params } = buildImageSearch(
      { operator: 'AND', terms: ['car', 'person'] },
      page,
    ).toSQL();
    expect(params).toContain('car');
    expect(params).toContain('person');
  });
});
