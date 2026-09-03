import { describe, expect, it } from 'vitest';
import { validateImageFile } from './file-validation.js';

describe('validateImageFile (RN-08)', () => {
  it('acepta JPEG, PNG y WebP dentro del límite de 10 MB', () => {
    const result = validateImageFile({
      name: 'calle.jpg',
      type: 'image/jpeg',
      size: 2 * 1024 * 1024,
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: 'calle.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 2 * 1024 * 1024,
      },
    });
  });

  it('rechaza formatos que no son imágenes soportadas', () => {
    const result = validateImageFile({
      name: 'notas.pdf',
      type: 'application/pdf',
      size: 1024,
    });

    expect(result).toEqual({
      ok: false,
      code: 'UNSUPPORTED_TYPE',
      message: 'Formato no soportado. Usa JPEG, PNG o WebP.',
    });
  });

  it('rechaza archivos mayores de 10 MB', () => {
    const result = validateImageFile({
      name: 'panorama.png',
      type: 'image/png',
      size: 11 * 1024 * 1024,
    });

    expect(result).toEqual({
      ok: false,
      code: 'FILE_TOO_LARGE',
      message: 'El archivo supera el máximo de 10 MB.',
    });
  });

  it('rechaza archivos vacíos', () => {
    const result = validateImageFile({
      name: 'vacia.webp',
      type: 'image/webp',
      size: 0,
    });

    expect(result).toEqual({
      ok: false,
      code: 'EMPTY_FILE',
      message: 'El archivo está vacío.',
    });
  });
});
