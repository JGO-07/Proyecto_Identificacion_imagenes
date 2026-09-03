import { eq, sql } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { db, pool } from '../db/index.js';
import { annotations, categories, images } from '../db/schema.js';
import { getDashboardMetrics } from './dashboard.service.js';

/**
 * RN-04 (§5.1 / §8.3): prueba que las métricas del dashboard CAMBIAN al agregar
 * anotaciones — no son valores fijos. Se ejecuta contra MariaDB real con
 * `npm run test:db`. Si la base no está disponible, el bloque se salta en vez
 * de fallar.
 */
let dbReachable = false;
try {
  await db.execute(sql`select 1`);
  dbReachable = true;
} catch {
  dbReachable = false;
}

const TAG = `__itest_${Date.now()}`;
let categoryId = 0;
let imageId = 0;

afterAll(async () => {
  if (dbReachable) {
    // Borrar la imagen elimina en cascada sus anotaciones; luego la categoría.
    if (imageId) {
      await db.delete(images).where(eq(images.id, imageId));
    }
    if (categoryId) {
      await db.delete(categories).where(eq(categories.id, categoryId));
    }
  }
  await pool.end();
});

describe.skipIf(!dbReachable)('métricas del dashboard contra MariaDB real (RN-04)', () => {
  it('el conteo por clase y el total de anotaciones suben al insertar una anotación', async () => {
    const [cat] = await db
      .insert(categories)
      .values({ name: TAG, color: '#123456' })
      .$returningId();
    categoryId = cat.id;

    const [img] = await db
      .insert(images)
      .values({
        fileName: `${TAG}.jpg`,
        originalName: `${TAG}.jpg`,
        storagePath: `uploads/${TAG}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 100,
        width: 10,
        height: 10,
        status: 'pending',
      })
      .$returningId();
    imageId = img.id;

    await db
      .insert(annotations)
      .values({ imageId, categoryId, x: 0, y: 0, width: 5, height: 5, area: 25, isCrowd: 0 });

    const before = await getDashboardMetrics();
    const beforeCat = before.objectsByCategory.find((c) => c.categoryId === categoryId);
    expect(beforeCat?.count).toBe(1);
    expect(typeof before.images.progressPct).toBe('number');
    expect(before.images.progressPct).toBeGreaterThanOrEqual(0);
    expect(before.images.progressPct).toBeLessThanOrEqual(100);

    await db
      .insert(annotations)
      .values({ imageId, categoryId, x: 1, y: 1, width: 6, height: 6, area: 36, isCrowd: 0 });

    const after = await getDashboardMetrics();
    const afterCat = after.objectsByCategory.find((c) => c.categoryId === categoryId);

    expect(afterCat?.count).toBe(2);
    expect(after.annotations.total).toBe(before.annotations.total + 1);
  });

  it('el progreso global refleja una imagen recién marcada como completed', async () => {
    const before = await getDashboardMetrics();

    await db.update(images).set({ status: 'completed' }).where(eq(images.id, imageId));

    const after = await getDashboardMetrics();

    expect(after.images.byStatus.completed).toBe(before.images.byStatus.completed + 1);
    expect(after.images.byStatus.pending).toBe(before.images.byStatus.pending - 1);
    // El total de imágenes no cambia, así que el progreso no puede bajar.
    expect(after.images.progressPct).toBeGreaterThanOrEqual(before.images.progressPct);
  });
});
