import { Hono } from 'hono';
import {
  annotationCreateSchema,
  annotationListQuerySchema,
  annotationUpdateSchema,
} from '../../schemas/annotation.js';
import { idParamSchema } from '../../schemas/common.js';
import * as service from '../../services/annotations.service.js';
import { notFound } from '../errors.js';
import { readJson } from '../http.js';

export const annotationsRoutes = new Hono();

annotationsRoutes.get('/', async (c) => {
  const query = annotationListQuerySchema.parse(c.req.query());
  const [data, total] = await Promise.all([
    service.listAnnotations(query),
    service.countAnnotations(query.imageId),
  ]);
  return c.json({ data, pagination: { limit: query.limit, offset: query.offset, total } });
});

annotationsRoutes.get('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const annotation = await service.getAnnotation(id);
  if (!annotation) {
    throw notFound(`La anotación ${id} no existe`);
  }
  return c.json({ data: annotation });
});

annotationsRoutes.post('/', async (c) => {
  const input = annotationCreateSchema.parse(await readJson(c));
  const created = await service.createAnnotation(input);
  return c.json({ data: created }, 201);
});

annotationsRoutes.patch('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const input = annotationUpdateSchema.parse(await readJson(c));
  const updated = await service.updateAnnotation(id, input);
  if (!updated) {
    throw notFound(`La anotación ${id} no existe`);
  }
  return c.json({ data: updated });
});

annotationsRoutes.delete('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const deleted = await service.deleteAnnotation(id);
  if (!deleted) {
    throw notFound(`La anotación ${id} no existe`);
  }
  return c.body(null, 204);
});
