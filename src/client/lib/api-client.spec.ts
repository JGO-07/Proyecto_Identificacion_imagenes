import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, apiClient } from './api-client.js';

const validImage = {
  id: 1,
  fileName: 'calle-001.jpg',
  originalName: 'calle.jpg',
  storagePath: 'images/calle-001.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: 2048,
  width: 1920,
  height: 1080,
  status: 'pending',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiClient', () => {
  it('valida y entrega un listado correcto de imágenes', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: [validImage], pagination: { limit: 20, offset: 0, total: 1 } }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.images.list();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/images?limit=20&offset=0',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
    expect(result.data).toEqual([validImage]);
    expect(result.pagination.total).toBe(1);
  });

  it('rechaza un listado sin el total acordado para la paginación', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [validImage], pagination: { limit: 20, offset: 0 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(apiClient.images.list()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('rechaza una respuesta externa con forma incorrecta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [{ id: 'incorrecto' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(apiClient.images.list()).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('conserva el código y el mensaje de un error de negocio', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: 'BBOX_OUT_OF_BOUNDS',
              message: 'La caja queda fuera de la imagen',
            },
          }),
          { status: 422, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );

    const error = await apiClient.annotations
      .create({ imageId: 1, categoryId: 2, x: 1900, y: 20, width: 100, height: 50 })
      .catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      status: 422,
      code: 'BBOX_OUT_OF_BOUNDS',
      message: 'La caja queda fuera de la imagen',
    });
  });

  it('sube una imagen como multipart sin fijar Content-Type manualmente', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: validImage }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const file = new File([new Uint8Array([1, 2, 3])], 'calle.jpg', {
      type: 'image/jpeg',
    });

    const result = await apiClient.images.upload(file);

    const [path, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(path).toBe('/api/images/upload');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get('file')).toBe(file);
    expect(result.data).toEqual(validImage);
  });

  it('construye la URL pública del archivo sin exponer storagePath', () => {
    expect(apiClient.images.fileUrl(27)).toBe('/api/images/27/file');
  });
});
