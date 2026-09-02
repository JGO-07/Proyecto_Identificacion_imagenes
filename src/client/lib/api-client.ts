import type { z } from 'zod';
import { annotationCreateSchema, annotationUpdateSchema } from '../../schemas/annotation.js';
import {
  annotationListResponseSchema,
  annotationResponseSchema,
  apiErrorSchema,
  categoryListResponseSchema,
  imageListResponseSchema,
  imageResponseSchema,
} from '../schemas/api.js';

type AnnotationCreateInput = z.input<typeof annotationCreateSchema>;
type AnnotationUpdateInput = z.input<typeof annotationUpdateSchema>;

interface PaginationInput {
  limit?: number;
  offset?: number;
}

interface AnnotationListInput extends PaginationInput {
  imageId?: number;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiClientError(
      response.status,
      'INVALID_RESPONSE',
      'El servidor devolvió una respuesta que no es JSON válido',
    );
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, { ...init, headers });
  const payload = await readJson(response);

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);
    if (parsedError.success) {
      throw new ApiClientError(
        response.status,
        parsedError.data.error.code,
        parsedError.data.error.message,
        parsedError.data.error.details,
      );
    }

    throw new ApiClientError(
      response.status,
      'HTTP_ERROR',
      `La solicitud falló con estado ${response.status}`,
      payload,
    );
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiClientError(
      response.status,
      'INVALID_RESPONSE',
      'La respuesta del servidor no cumple el contrato esperado',
      parsed.error.issues,
    );
  }

  return parsed.data;
}

function paginationParams(input: PaginationInput = {}) {
  return new URLSearchParams({
    limit: String(input.limit ?? 20),
    offset: String(input.offset ?? 0),
  });
}

export const apiClient = {
  images: {
    list(input: PaginationInput = {}) {
      return request(`/api/images?${paginationParams(input)}`, imageListResponseSchema);
    },
    get(id: number) {
      return request(`/api/images/${id}`, imageResponseSchema);
    },
  },
  categories: {
    list(input: PaginationInput = {}) {
      return request(`/api/categories?${paginationParams(input)}`, categoryListResponseSchema);
    },
  },
  annotations: {
    list(input: AnnotationListInput = {}) {
      const params = paginationParams(input);
      if (input.imageId) {
        params.set('imageId', String(input.imageId));
      }
      return request(`/api/annotations?${params}`, annotationListResponseSchema);
    },
    create(input: AnnotationCreateInput) {
      const body = annotationCreateSchema.parse(input);
      return request('/api/annotations', annotationResponseSchema, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    update(id: number, input: AnnotationUpdateInput) {
      const body = annotationUpdateSchema.parse(input);
      return request(`/api/annotations/${id}`, annotationResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    async remove(id: number) {
      const response = await fetch(`/api/annotations/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      if (response.status === 204) {
        return;
      }

      const payload = await readJson(response);
      const parsedError = apiErrorSchema.safeParse(payload);
      throw new ApiClientError(
        response.status,
        parsedError.success ? parsedError.data.error.code : 'HTTP_ERROR',
        parsedError.success ? parsedError.data.error.message : 'No se pudo borrar la anotación',
        parsedError.success ? parsedError.data.error.details : payload,
      );
    },
  },
};
