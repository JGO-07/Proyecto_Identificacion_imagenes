import { describe, expect, it } from 'vitest';
import { buildFilteredImages, buildFilteredImagesCount } from './images.service.js';

const page = { limit: 20, offset: 0 };

describe('filtros combinables de imágenes resueltos en SQL (RN-07)', () => {
  it('sin filtros no genera WHERE pero sí LIMIT/OFFSET', () => {
    const { sql } = buildFilteredImages({}, { limit: 20, offset: 40 }).toSQL();
    expect(sql).not.toMatch(/where/i);
    expect(sql).toMatch(/limit \?/i);
    expect(sql).toMatch(/offset \?/i);
  });

  it('estado + rango de fechas -> WHERE con status y created_at', () => {
    const { sql } = buildFilteredImages(
      {
        status: 'in_progress',
        from: new Date('2026-01-01T00:00:00Z'),
        to: new Date('2026-02-01T00:00:00Z'),
      },
      page,
    ).toSQL();
    expect(sql).toMatch(/`status` = \?/i);
    expect(sql).toMatch(/`created_at` >= \?/i);
    expect(sql).toMatch(/`created_at` <= \?/i);
  });

  it('filtro por categoría -> subconsulta EXISTS sobre annotations', () => {
    const { sql } = buildFilteredImages({ categoryId: 3 }, page).toSQL();
    expect(sql).toMatch(/exists \(select/i);
    expect(sql).toMatch(/`annotations`/i);
  });

  it('el conteo total usa el MISMO WHERE y no lleva LIMIT', () => {
    const filters = { status: 'completed' as const };
    const countSql = buildFilteredImagesCount(filters).toSQL().sql;
    expect(countSql).toMatch(/count\(\*\)/i);
    expect(countSql).toMatch(/`status` = \?/i);
    expect(countSql).not.toMatch(/limit/i);
  });
});
