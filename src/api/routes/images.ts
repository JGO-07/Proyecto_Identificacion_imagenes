import { Hono } from 'hono';
import { idParamSchema, paginationSchema } from '../../schemas/common.js';
import { imageCreateSchema, imageUpdateSchema } from '../../schemas/image.js';
import * as service from '../../services/images.service.js';
import { notFound } from '../errors.js';
import { readJson } from '../http.js';

export const imagesRoutes = new Hono();

imagesRoutes.get('/', async (c) => {
  const query = paginationSchema.parse(c.req.query());
  const data = await service.listImages(query);
  return c.json({ data, pagination: query });
});

imagesRoutes.get('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const image = await service.getImage(id);
  if (!image) {
    throw notFound(`La imagen ${id} no existe`);
  }
  return c.json({ data: image });
});

imagesRoutes.post('/', async (c) => {
  const input = imageCreateSchema.parse(await readJson(c));
  const created = await service.createImage(input);
  return c.json({ data: created }, 201);
});

imagesRoutes.patch('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const input = imageUpdateSchema.parse(await readJson(c));
  const updated = await service.updateImageStatus(id, input);
  if (!updated) {
    throw notFound(`La imagen ${id} no existe`);
  }
  return c.json({ data: updated });
});

imagesRoutes.delete('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const deleted = await service.deleteImage(id);
  if (!deleted) {
    throw notFound(`La imagen ${id} no existe`);
  }
  return c.body(null, 204);
});
