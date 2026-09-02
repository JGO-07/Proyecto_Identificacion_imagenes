import { ACCEPTED_MIME_TYPES, MAX_IMAGE_BYTES, uploadFileSchema } from '../../schemas/image.js';

export interface ImageFileCandidate {
  name: string;
  type: string;
  size: number;
}

type ValidImageFile = {
  ok: true;
  value: {
    name: string;
    mimeType: (typeof ACCEPTED_MIME_TYPES)[number];
    sizeBytes: number;
  };
};

type InvalidImageFile = {
  ok: false;
  code: 'EMPTY_FILE' | 'UNSUPPORTED_TYPE' | 'FILE_TOO_LARGE' | 'INVALID_FILE';
  message: string;
};

export type ImageFileValidation = ValidImageFile | InvalidImageFile;

export function validateImageFile(file: ImageFileCandidate): ImageFileValidation {
  if (file.size <= 0) {
    return { ok: false, code: 'EMPTY_FILE', message: 'El archivo está vacío.' };
  }

  const acceptedMimeType = ACCEPTED_MIME_TYPES.find((mimeType) => mimeType === file.type);
  if (!acceptedMimeType) {
    return {
      ok: false,
      code: 'UNSUPPORTED_TYPE',
      message: 'Formato no soportado. Usa JPEG, PNG o WebP.',
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      code: 'FILE_TOO_LARGE',
      message: 'El archivo supera el máximo de 10 MB.',
    };
  }

  const parsed = uploadFileSchema.safeParse({ mimeType: acceptedMimeType, sizeBytes: file.size });
  if (!parsed.success) {
    return {
      ok: false,
      code: 'INVALID_FILE',
      message: parsed.error.issues[0]?.message ?? 'El archivo no es válido.',
    };
  }

  return {
    ok: true,
    value: {
      name: file.name,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
    },
  };
}
