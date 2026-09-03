import { count, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { annotations, categories, images } from '../db/schema.js';
import { IMAGE_STATUSES, type ImageStatus } from '../db/types.js';

export interface ObjectsByCategory {
  categoryId: number;
  name: string;
  color: string;
  count: number;
}

export interface DashboardMetrics {
  images: {
    total: number;
    byStatus: Record<ImageStatus, number>;
    progressPct: number;
  };
  annotations: { total: number };
  objectsByCategory: ObjectsByCategory[];
}

/**
 * RN-04: porcentaje de imágenes completadas sobre el total. Calculado, nunca
 * fijo; 0 si todavía no hay imágenes.
 */
export function computeProgressPct(total: number, completed: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

/** Conteo de imágenes por estado (`GROUP BY status`). */
export function buildImageStatusCounts() {
  return db.select({ status: images.status, count: count() }).from(images).groupBy(images.status);
}

/** Total de anotaciones (`COUNT(*)`). */
export function buildAnnotationTotal() {
  return db.select({ total: count() }).from(annotations);
}

/** Objetos anotados por clase, ordenados de más a menos (`GROUP BY` + `JOIN`). */
export function buildObjectsByCategory() {
  return db
    .select({
      categoryId: annotations.categoryId,
      name: categories.name,
      color: categories.color,
      count: count(),
    })
    .from(annotations)
    .innerJoin(categories, eq(categories.id, annotations.categoryId))
    .groupBy(annotations.categoryId, categories.name, categories.color)
    .orderBy(sql`count(*) desc`);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [statusRows, annotationRows, categoryRows] = await Promise.all([
    buildImageStatusCounts(),
    buildAnnotationTotal(),
    buildObjectsByCategory(),
  ]);

  const byStatus: Record<ImageStatus, number> = {
    pending: 0,
    in_progress: 0,
    completed: 0,
  };
  for (const row of statusRows) {
    if ((IMAGE_STATUSES as readonly string[]).includes(row.status)) {
      byStatus[row.status as ImageStatus] = Number(row.count);
    }
  }

  const total = byStatus.pending + byStatus.in_progress + byStatus.completed;

  return {
    images: {
      total,
      byStatus,
      progressPct: computeProgressPct(total, byStatus.completed),
    },
    annotations: { total: Number(annotationRows[0]?.total ?? 0) },
    objectsByCategory: categoryRows.map((row) => ({
      categoryId: row.categoryId,
      name: row.name,
      color: row.color,
      count: Number(row.count),
    })),
  };
}
