import { eq } from 'drizzle-orm';
import { conflict } from '../api/errors.js';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import type { CategoryRow } from '../db/types.js';
import { isForeignKeyConstraintError, isUniqueConstraintError } from '../lib/db-errors.js';
import type { CategoryCreate, CategoryUpdate } from '../schemas/category.js';
import type { Pagination } from '../schemas/common.js';

export async function listCategories({ limit, offset }: Pagination): Promise<CategoryRow[]> {
  return db.select().from(categories).limit(limit).offset(offset).orderBy(categories.id);
}

export async function getCategory(id: number): Promise<CategoryRow | null> {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createCategory(input: CategoryCreate): Promise<CategoryRow> {
  try {
    const [inserted] = await db.insert(categories).values(input).$returningId();
    const created = await getCategory(inserted.id);
    if (!created) {
      throw new Error('No se pudo recuperar la categoría recién creada');
    }
    return created;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw conflict('CATEGORY_NAME_TAKEN', `Ya existe una categoría llamada "${input.name}"`);
    }
    throw error;
  }
}

export async function updateCategory(
  id: number,
  input: CategoryUpdate,
): Promise<CategoryRow | null> {
  try {
    const [result] = await db.update(categories).set(input).where(eq(categories.id, id));
    if (result.affectedRows === 0) {
      return null;
    }
    return getCategory(id);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw conflict('CATEGORY_NAME_TAKEN', 'Ya existe una categoría con ese nombre');
    }
    throw error;
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    const [result] = await db.delete(categories).where(eq(categories.id, id));
    return result.affectedRows > 0;
  } catch (error) {
    if (isForeignKeyConstraintError(error)) {
      throw conflict(
        'CATEGORY_IN_USE',
        'No se puede eliminar una categoría con anotaciones asociadas (RN-02)',
      );
    }
    throw error;
  }
}
