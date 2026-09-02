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
      new Response(JSON.stringify({ data: [validImage], pagination: { limit: 20, offset: 0 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.images.list();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/images?limit=20&offset=0',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
    expect(result.data).toEqual([validImage]);
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
});
