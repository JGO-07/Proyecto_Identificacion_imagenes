import { describe, expect, it } from 'vitest';
import {
  buildAnnotationTotal,
  buildImageStatusCounts,
  buildObjectsByCategory,
  computeProgressPct,
} from './dashboard.service.js';

describe('computeProgressPct (RN-04)', () => {
  it('devuelve 0 cuando no hay imágenes', () => {
    expect(computeProgressPct(0, 0)).toBe(0);
  });

  it('redondea el porcentaje de completadas', () => {
    expect(computeProgressPct(3, 1)).toBe(33);
  });

  it('devuelve 100 cuando todas están completas', () => {
    expect(computeProgressPct(4, 4)).toBe(100);
  });
});

describe('métricas calculadas en SQL, no valores fijos (RN-04)', () => {
  it('el conteo por estado usa GROUP BY y COUNT(*)', () => {
    const { sql } = buildImageStatusCounts().toSQL();
    expect(sql).toMatch(/group by/i);
    expect(sql).toMatch(/count\(\*\)/i);
  });

  it('los objetos por clase agrupan por categoría con INNER JOIN y orden descendente', () => {
    const { sql } = buildObjectsByCategory().toSQL();
    expect(sql).toMatch(/inner join/i);
    expect(sql).toMatch(/group by/i);
    expect(sql).toMatch(/order by count\(\*\) desc/i);
  });

  it('el total de anotaciones es un COUNT(*)', () => {
    const { sql } = buildAnnotationTotal().toSQL();
    expect(sql).toMatch(/select count\(\*\) from `annotations`/i);
  });
});
