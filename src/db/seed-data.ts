/** Subconjunto de imágenes total por categoría: imagen + anotación. */
export type SeedCategory = { name: string; color: string };

export type SeedImage = {
  fileName: string;
  width: number;
  height: number;
  mimeType: string;
};

export const SEED_CATEGORIES: SeedCategory[] = [
  { name: 'car', color: '#EF4444' },
  { name: 'person', color: '#3B82F6' },
  { name: 'dog', color: '#10B981' },
  { name: 'cat', color: '#F59E0B' },
  { name: 'bicycle', color: '#8B5CF6' },
];

/**
 * Las 8 imágenes del dataset, con las dimensiones exactas que se persisten en
 * `images`. El `fileName` se usa tanto como clave dentro del bucket
 * (uploads/<fileName>) como para construir la URL de descarga.
 */
export const SEED_IMAGES: SeedImage[] = [
  { fileName: 'img_auto_0.jpg', width: 1024, height: 682, mimeType: 'image/jpeg' },
  { fileName: 'img_auto_1.jpg', width: 1024, height: 640, mimeType: 'image/jpeg' },
  { fileName: 'img_bici_0.jpg', width: 1248, height: 702, mimeType: 'image/jpeg' },
  { fileName: 'img_bici_1.jpg', width: 1200, height: 1600, mimeType: 'image/jpeg' },
  { fileName: 'img_perro_0.jpg', width: 626, height: 417, mimeType: 'image/jpeg' },
  { fileName: 'img_perro_1.jpg', width: 1024, height: 639, mimeType: 'image/jpeg' },
  { fileName: 'img_gato_0.jpg', width: 800, height: 533, mimeType: 'image/jpeg' },
  { fileName: 'img_gato_1.jpg', width: 728, height: 425, mimeType: 'image/jpeg' },
];

/** Ruta dentro del bucket de MinIO para el conjunto emulado. */
export function storageKey(image: Pick<SeedImage, 'fileName'>): string {
  return `uploads/${image.fileName}`;
}

export type SeedAnnotation = {
  fileName: string;
  categoryName: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Tres anotaciones de ejemplo para facilitar pruebas. Cada bounding box está
 * dentro de las dimensiones de su imagen (coordenadas absolutas en píxeles).
 */
export const SEED_ANNOTATIONS: SeedAnnotation[] = [
  { fileName: 'img_auto_0.jpg', categoryName: 'car', x: 100, y: 80, width: 300, height: 200 },
  { fileName: 'img_perro_0.jpg', categoryName: 'dog', x: 50, y: 60, width: 180, height: 140 },
  { fileName: 'img_gato_0.jpg', categoryName: 'cat', x: 120, y: 90, width: 220, height: 180 },
];
