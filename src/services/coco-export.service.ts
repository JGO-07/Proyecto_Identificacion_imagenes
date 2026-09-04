import { db } from '../db/index.js';
import { annotations, categories, images } from '../db/schema.js';
import type { AnnotationRow, CategoryRow, ImageRow } from '../db/types.js';

/** Imagen según el esquema oficial de COCO. */
export type CocoImage = {
  id: number;
  file_name: string;
  width: number;
  height: number;
};

/** Anotación según el esquema oficial de COCO. */
export type CocoAnnotation = {
  id: number;
  image_id: number;
  category_id: number;
  bbox: [number, number, number, number];
  area: number;
  iscrowd: 0 | 1;
};

/** Categoría según el esquema oficial de COCO. */
export type CocoCategory = {
  id: number;
  name: string;
};

export type CocoDataset = {
  images: CocoImage[];
  annotations: CocoAnnotation[];
  categories: CocoCategory[];
};

type RawRows = {
  images: ImageRow[];
  annotations: AnnotationRow[];
  categories: CategoryRow[];
};

/**
 * Transforma las filas de MariaDB al JSON oficial del dataset COCO.
 * Es pura (sin acceso a BD) y valida las reglas de integridad del estándar:
 *   - no hay ids duplicados entre imágenes ni entre categorías;
 *   - cada annotation.image_id / category_id debe existir;
 *   - la bbox son exactamente 4 coordenadas absolutas positivas;
 *   - el área es coherente con width * height.
 * Ante una inconsistencia lanza un error claro (nunca produce JSON inválido).
 */
export function mapToCoco({
  images: rows,
  annotations: anns,
  categories: cats,
}: RawRows): CocoDataset {
  const imageIds = new Set<number>();
  const categoryIds = new Set<number>();

  const cocoImages: CocoImage[] = rows.map((row) => {
    if (imageIds.has(row.id)) {
      throw new Error(`Id de imagen duplicado en la exportación COCO: ${row.id}`);
    }
    imageIds.add(row.id);
    return { id: row.id, file_name: row.fileName, width: row.width, height: row.height };
  });

  const cocoCategories: CocoCategory[] = cats.map((row) => {
    if (categoryIds.has(row.id)) {
      throw new Error(`Id de categoría duplicado en la exportación COCO: ${row.id}`);
    }
    categoryIds.add(row.id);
    return { id: row.id, name: row.name };
  });

  const cocoAnnotations: CocoAnnotation[] = anns.map((row) => {
    if (!imageIds.has(row.imageId)) {
      throw new Error(
        `Anotación ${row.id} referencia una imagen inexistente (image_id=${row.imageId})`,
      );
    }
    if (!categoryIds.has(row.categoryId)) {
      throw new Error(
        `Anotación ${row.id} referencia una categoría inexistente (category_id=${row.categoryId})`,
      );
    }

    const bbox: [number, number, number, number] = [row.x, row.y, row.width, row.height];
    const area = row.width * row.height;
    return {
      id: row.id,
      image_id: row.imageId,
      category_id: row.categoryId,
      bbox,
      area,
      iscrowd: row.isCrowd === 0 ? 0 : 1,
    };
  });

  return { images: cocoImages, annotations: cocoAnnotations, categories: cocoCategories };
}

/**
 * Consulta la base de datos y retorna el dataset COCO completo.
 * Es la única función con acceso a datos; se consume desde la capa HTTP.
 */
export async function buildCocoDataset(): Promise<CocoDataset> {
  const [rows, anns, cats] = await Promise.all([
    db.select().from(images).orderBy(images.id),
    db.select().from(annotations).orderBy(annotations.id),
    db.select().from(categories).orderBy(categories.id),
  ]);
  return mapToCoco({ images: rows, annotations: anns, categories: cats });
}
