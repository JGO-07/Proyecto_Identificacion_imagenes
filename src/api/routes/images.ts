import { Readable } from 'node:stream';
import { Hono } from 'hono';
import { idParamSchema, paginationSchema } from '../../schemas/common.js';
import { imageCreateSchema, imageUpdateSchema } from '../../schemas/image.js';
import * as service from '../../services/images.service.js';
import { AppError, notFound } from '../errors.js';
import { readJson } from '../http.js';

export const imagesRoutes = new Hono();

/**
 * RN-08: carga multipart de una imagen. Campo de formulario: `file`.
 * La validación de tipo/tamaño y la extracción de dimensiones ocurren en el
 * servicio; aquí solo se extrae el archivo de la petición.
 */
imagesRoutes.post('/upload', async (c) => {
  const body = await c.req.parseBody();
  const file = body.file;
  if (!(file instanceof File)) {
    throw new AppError(400, 'NO_FILE', 'Debe adjuntar un archivo en el campo "file"');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const created = await service.createImageFromUpload({
    buffer,
    originalName: file.name || 'imagen',
    mimeType: file.type,
  });
  return c.json({ data: created }, 201);
});

imagesRoutes.get('/', async (c) => {
  const query = paginationSchema.parse(c.req.query());
  const [data, total] = await Promise.all([service.listImages(query), service.countImages()]);
  return c.json({ data, pagination: { ...query, total } });
});

imagesRoutes.get('/:id', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const image = await service.getImage(id);
  if (!image) {
    throw notFound(`La imagen ${id} no existe`);
  }
  return c.json({ data: image });
});

/** Sirve el binario de la imagen (proxy a MinIO). Usar como `<img src>`. */
imagesRoutes.get('/:id/file', async (c) => {
  const { id } = idParamSchema.parse(c.req.param());
  const file = await service.getImageFile(id);
  if (!file) {
    throw notFound(`La imagen ${id} no existe`);
  }
  return c.body(Readable.toWeb(file.body) as unknown as ReadableStream, 200, {
    'Content-Type': file.contentType,
    'Content-Length': String(file.contentLength),
    'Cache-Control': 'private, max-age=3600',
  });
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
