import { Hono } from 'hono';
import { categoryCreateSchema, categoryUpdateSchema } from '../../schemas/category.js';
import { idParamSchema, paginationSchema } from '../../schemas/common.js';
import * as service from '../../services/categories.service.js';
import { notFound } from '../errors.js';
import { readJson } from '../http.js';

export const categoriesRoutes = new Hono();

categoriesRoutes.get('/', async (c) => {
  const query = paginationSchema.parse(c.req.query());
  const [data, total] = await Promise.all([
    service.listCategories(query),
    service.countCategories(),
  ]);
  return c.json({ data, pagination: { ...query, total } });
});

categoriesRoutes.get('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const category = await service.getCategory(id);
  if (!category) {
    throw notFound(`La categoría ${id} no existe`);
  }
  return c.json({ data: category });
});

categoriesRoutes.post('/', async (c) => {
  const input = categoryCreateSchema.parse(await readJson(c));
  const created = await service.createCategory(input);
  return c.json({ data: created }, 201);
});

categoriesRoutes.patch('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const input = categoryUpdateSchema.parse(await readJson(c));
  const updated = await service.updateCategory(id, input);
  if (!updated) {
    throw notFound(`La categoría ${id} no existe`);
  }
  return c.json({ data: updated });
});

categoriesRoutes.delete('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const deleted = await service.deleteCategory(id);
  if (!deleted) {
    throw notFound(`La categoría ${id} no existe`);
  }
  return c.body(null, 204);
});
