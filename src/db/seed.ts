import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { and, eq } from 'drizzle-orm';
import { env } from '../lib/env.js';
import { ensureBucket, minioClient } from '../storage/minio.js';
import { db, pool } from './index.js';
import { annotations, categories, images } from './schema.js';
import { SEED_ANNOTATIONS, SEED_CATEGORIES, SEED_IMAGES, storageKey } from './seed-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Carpeta cacheada (gitignoreada) donde el seeder guarda las imágenes descargadas. */
const CACHE_DIR = path.resolve(__dirname, '../../data/dataset-src');

/**
 * Obtiene el buffer binario de una imagen. Estrategia híbrida:
 *   1. Si ya está cacheada en disco, la lee (sin red).
 *   2. Si no, la descarga desde `${DATASET_URL}/${fileName}` y la cachea.
 */
async function fetchImageBuffer(fileName: string): Promise<Buffer> {
  const cachePath = path.join(CACHE_DIR, fileName);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }

  const url = `${env.DATASET_URL}/${fileName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, buffer);
  console.log(`Descargada ${fileName} (${buffer.length} bytes) y cacheada.`);
  return buffer;
}

/** Siembra una categoría solo si no existe (idempotente por `name` único). */
async function seedCategories(): Promise<void> {
  for (const category of SEED_CATEGORIES) {
    const existing = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, category.name))
      .limit(1);
    if (existing.length > 0) {
      continue;
    }
    await db.insert(categories).values(category);
    console.log(`Categoría creada: ${category.name}`);
  }
}

/**
 * Siembra una imagen solo si no existe (idempotente por `file_name` único):
 * descarga/subir a MinIO y luego inserta los metadatos en MariaDB.
 */
async function seedImages(): Promise<void> {
  await ensureBucket();

  for (const image of SEED_IMAGES) {
    const existing = await db
      .select({ id: images.id })
      .from(images)
      .where(eq(images.fileName, image.fileName))
      .limit(1);
    if (existing.length > 0) {
      console.log(`Imagen ya existente, omitida: ${image.fileName}`);
      continue;
    }

    const buffer = await fetchImageBuffer(image.fileName);
    const storagePath = storageKey(image);

    await minioClient.putObject(env.MINIO_BUCKET_NAME, storagePath, buffer, buffer.length);
    console.log(`Subida a MinIO: ${storagePath}`);

    await db.insert(images).values({
      fileName: image.fileName,
      originalName: image.fileName,
      storagePath,
      mimeType: image.mimeType,
      sizeBytes: buffer.length,
      width: image.width,
      height: image.height,
      status: 'pending',
    });
    console.log(`Metadatos insertados: ${image.fileName}`);
  }
}

/**
 * Siembra 3 anotaciones de ejemplo solo si no existen (idempotente por la
 * pareja image_id + category_id) para facilitar las pruebas de exportación COCO.
 */
async function seedAnnotations(): Promise<void> {
  for (const seed of SEED_ANNOTATIONS) {
    const image = await db
      .select({ id: images.id })
      .from(images)
      .where(eq(images.fileName, seed.fileName))
      .limit(1);
    if (image.length === 0) {
      throw new Error(`No existe la imagen ${seed.fileName} para la anotación de ejemplo`);
    }
    const imageId = image[0].id;

    const category = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.name, seed.categoryName))
      .limit(1);
    if (category.length === 0) {
      throw new Error(`No existe la categoría ${seed.categoryName} para la anotación de ejemplo`);
    }
    const categoryId = category[0].id;

    const existing = await db
      .select({ id: annotations.id })
      .from(annotations)
      .where(and(eq(annotations.imageId, imageId), eq(annotations.categoryId, categoryId)))
      .limit(1);
    if (existing.length > 0) {
      console.log(`Anotación ya existente, omitida: ${seed.fileName}/${seed.categoryName}`);
      continue;
    }

    await db.insert(annotations).values({
      imageId,
      categoryId,
      x: seed.x,
      y: seed.y,
      width: seed.width,
      height: seed.height,
      area: seed.width * seed.height,
      isCrowd: 0,
    });
    console.log(`Anotación creada: ${seed.fileName}/${seed.categoryName}`);
  }
}

async function runSeed(): Promise<void> {
  console.log('Iniciando seeder de Fase 1...');
  await seedCategories();
  await seedImages();
  await seedAnnotations();
  console.log('Seeder completado. Idempotente: puede volver a ejecutarse.');
}

void runSeed()
  .catch((error) => {
    console.error('Error en el seeder:');
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void pool.end();
  });
