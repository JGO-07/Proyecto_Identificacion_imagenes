import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/categories.service.js');
vi.mock('../services/images.service.js');
vi.mock('../services/annotations.service.js');

import * as annotationsService from '../services/annotations.service.js';
import * as categoriesService from '../services/categories.service.js';
import * as imagesService from '../services/images.service.js';
import { app } from './app.js';
import { AppError } from './errors.js';

const jsonHeaders = { 'content-type': 'application/json' };

const sampleCategory = {
  id: 1,
  name: 'car',
  color: '#EF4444',
  createdAt: new Date('2026-01-01T00:00:00Z'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('health', () => {
  it('GET /health -> 200', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: 'annotation-api' });
  });
});

describe('GET /api/categories', () => {
  it('devuelve 200 con la lista y la paginación (con total)', async () => {
    vi.mocked(categoriesService.listCategories).mockResolvedValue([sampleCategory]);
    vi.mocked(categoriesService.countCategories).mockResolvedValue(1);
    const res = await app.request('/api/categories?limit=5');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({ limit: 5, offset: 0, total: 1 });
    expect(categoriesService.listCategories).toHaveBeenCalledWith({ limit: 5, offset: 0 });
  });

  it('rechaza limit fuera de rango con 400 y no llama al servicio', async () => {
    const res = await app.request('/api/categories?limit=999');
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('VALIDATION_ERROR');
    expect(categoriesService.listCategories).not.toHaveBeenCalled();
  });
});

describe('GET /api/categories/:id', () => {
  it('200 cuando existe', async () => {
    vi.mocked(categoriesService.getCategory).mockResolvedValue(sampleCategory);
    const res = await app.request('/api/categories/1');
    expect(res.status).toBe(200);
  });

  it('404 cuando no existe', async () => {
    vi.mocked(categoriesService.getCategory).mockResolvedValue(null);
    const res = await app.request('/api/categories/999');
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('NOT_FOUND');
  });

  it('400 cuando el id no es numérico', async () => {
    const res = await app.request('/api/categories/abc');
    expect(res.status).toBe(400);
    expect(categoriesService.getCategory).not.toHaveBeenCalled();
  });
});

describe('POST /api/categories', () => {
  it('201 con cuerpo válido y aplica el color por defecto', async () => {
    vi.mocked(categoriesService.createCategory).mockResolvedValue(sampleCategory);
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'car' }),
    });
    expect(res.status).toBe(201);
    expect(categoriesService.createCategory).toHaveBeenCalledWith({
      name: 'car',
      color: '#3B82F6',
    });
  });

  it('400 VALIDATION_ERROR si falta name, sin tocar el servicio', async () => {
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ color: '#000000' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeInstanceOf(Array);
    expect(categoriesService.createCategory).not.toHaveBeenCalled();
  });

  it('400 VALIDATION_ERROR si el color no es hex', async () => {
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'car', color: 'rojo' }),
    });
    expect(res.status).toBe(400);
  });

  it('400 INVALID_JSON con cuerpo malformado', async () => {
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: jsonHeaders,
      body: '{ no json',
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('INVALID_JSON');
  });

  it('409 cuando el servicio reporta nombre duplicado', async () => {
    vi.mocked(categoriesService.createCategory).mockRejectedValue(
      new AppError(409, 'CATEGORY_NAME_TAKEN', 'Ya existe'),
    );
    const res = await app.request('/api/categories', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'car' }),
    });
    expect(res.status).toBe(409);
    expect((await res.json()).error.code).toBe('CATEGORY_NAME_TAKEN');
  });
});

describe('DELETE /api/categories/:id', () => {
  it('204 cuando se borra', async () => {
    vi.mocked(categoriesService.deleteCategory).mockResolvedValue(true);
    const res = await app.request('/api/categories/1', { method: 'DELETE' });
    expect(res.status).toBe(204);
  });

  it('404 cuando no existe', async () => {
    vi.mocked(categoriesService.deleteCategory).mockResolvedValue(false);
    const res = await app.request('/api/categories/1', { method: 'DELETE' });
    expect(res.status).toBe(404);
  });

  it('409 cuando la categoría está en uso (RN-02)', async () => {
    vi.mocked(categoriesService.deleteCategory).mockRejectedValue(
      new AppError(409, 'CATEGORY_IN_USE', 'En uso'),
    );
    const res = await app.request('/api/categories/1', { method: 'DELETE' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/annotations', () => {
  const validBox = { imageId: 1, categoryId: 2, x: 0, y: 0, width: 10, height: 10 };

  it('201 con caja válida', async () => {
    vi.mocked(annotationsService.createAnnotation).mockResolvedValue({
      id: 1,
      ...validBox,
      area: 100,
      isCrowd: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const res = await app.request('/api/annotations', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(validBox),
    });
    expect(res.status).toBe(201);
  });

  it('400 si falta categoryId (RN-02) y no llama al servicio', async () => {
    const { categoryId, ...withoutCategory } = validBox;
    void categoryId;
    const res = await app.request('/api/annotations', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(withoutCategory),
    });
    expect(res.status).toBe(400);
    expect(annotationsService.createAnnotation).not.toHaveBeenCalled();
  });

  it('422 cuando el servicio rechaza la categoría inexistente', async () => {
    vi.mocked(annotationsService.createAnnotation).mockRejectedValue(
      new AppError(422, 'CATEGORY_NOT_FOUND', 'La categoría 999 no existe'),
    );
    const res = await app.request('/api/annotations', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ ...validBox, categoryId: 999 }),
    });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe('CATEGORY_NOT_FOUND');
  });

  it('422 cuando la caja se sale de la imagen (RN-01)', async () => {
    vi.mocked(annotationsService.createAnnotation).mockRejectedValue(
      new AppError(422, 'BBOX_OUT_OF_BOUNDS', 'Fuera de límites'),
    );
    const res = await app.request('/api/annotations', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(validBox),
    });
    expect(res.status).toBe(422);
  });
});

describe('imágenes', () => {
  const sampleImage = {
    id: 1,
    fileName: 'a.jpg',
    originalName: 'a.jpg',
    storagePath: 'uploads/a.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1000,
    width: 640,
    height: 480,
    status: 'pending' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('GET /api/images -> 200 con lista y total en la paginación', async () => {
    vi.mocked(imagesService.listImages).mockResolvedValue([sampleImage]);
    vi.mocked(imagesService.countImages).mockResolvedValue(1);
    const res = await app.request('/api/images');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({ limit: 20, offset: 0, total: 1 });
  });

  it('GET /api/images/:id/file -> 200 con el binario y su Content-Type', async () => {
    const { Readable } = await import('node:stream');
    vi.mocked(imagesService.getImageFile).mockResolvedValue({
      body: Readable.from([Buffer.from('bytes-de-imagen')]),
      contentType: 'image/jpeg',
      contentLength: 14,
    });
    const res = await app.request('/api/images/1/file');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(await res.text()).toBe('bytes-de-imagen');
  });

  it('GET /api/images/:id/file -> 404 si la imagen no existe', async () => {
    vi.mocked(imagesService.getImageFile).mockResolvedValue(null);
    const res = await app.request('/api/images/999/file');
    expect(res.status).toBe(404);
  });

  it('GET /api/images/:id/file -> 422 si el archivo no está en el almacenamiento', async () => {
    vi.mocked(imagesService.getImageFile).mockRejectedValue(
      new AppError(422, 'IMAGE_FILE_MISSING', 'El archivo no está en el almacenamiento'),
    );
    const res = await app.request('/api/images/1/file');
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe('IMAGE_FILE_MISSING');
  });

  it('PATCH /api/images/:id con status inválido -> 400', async () => {
    const res = await app.request('/api/images/1', {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ status: 'terminada' }),
    });
    expect(res.status).toBe(400);
    expect(imagesService.updateImageStatus).not.toHaveBeenCalled();
  });

  it('POST /api/images/upload sin archivo -> 400 NO_FILE', async () => {
    const res = await app.request('/api/images/upload', { method: 'POST' });
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe('NO_FILE');
  });

  it('POST /api/images/upload con archivo -> 201 (RN-08)', async () => {
    vi.mocked(imagesService.createImageFromUpload).mockResolvedValue(sampleImage);
    const form = new FormData();
    form.append('file', new File([new Uint8Array([1, 2, 3])], 'a.jpg', { type: 'image/jpeg' }));
    const res = await app.request('/api/images/upload', { method: 'POST', body: form });
    expect(res.status).toBe(201);
    expect(imagesService.createImageFromUpload).toHaveBeenCalledOnce();
  });

  it('POST /api/images/upload propaga 422 del servicio (RN-08)', async () => {
    vi.mocked(imagesService.createImageFromUpload).mockRejectedValue(
      new AppError(422, 'INVALID_UPLOAD', 'Formato no soportado. Usa JPEG, PNG o WebP.'),
    );
    const form = new FormData();
    form.append('file', new File([new Uint8Array([1])], 'x.pdf', { type: 'application/pdf' }));
    const res = await app.request('/api/images/upload', { method: 'POST', body: form });
    expect(res.status).toBe(422);
    expect((await res.json()).error.code).toBe('INVALID_UPLOAD');
  });
});

describe('rutas desconocidas', () => {
  it('404 NOT_FOUND', async () => {
    const res = await app.request('/api/no-existe');
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('NOT_FOUND');
  });
});
