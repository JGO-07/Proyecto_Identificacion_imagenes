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
