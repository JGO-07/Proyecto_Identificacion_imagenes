import type { z } from 'zod';
import {
  annotationCreateInputSchema,
  annotationListResponseSchema,
  annotationResponseSchema,
  annotationUpdateInputSchema,
  apiErrorSchema,
  categoryListResponseSchema,
  dashboardMetricsResponseSchema,
  imageListResponseSchema,
  imageResponseSchema,
  imageUpdateInputSchema,
  searchResponseSchema,
  uploadFileInputSchema,
} from '../schemas/api.js';

type AnnotationCreateInput = z.input<typeof annotationCreateInputSchema>;
type AnnotationUpdateInput = z.input<typeof annotationUpdateInputSchema>;
type ImageUpdateInput = z.input<typeof imageUpdateInputSchema>;

interface PaginationInput {
  limit?: number;
  offset?: number;
}

interface ImageListInput extends PaginationInput {
  categoryId?: number;
  from?: string;
  status?: ImageUpdateInput['status'];
  to?: string;
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
  const isMultipart = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isMultipart) {
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

function imageListParams(input: ImageListInput = {}) {
  const params = paginationParams(input);
  if (input.status) params.set('status', input.status);
  if (input.categoryId) params.set('categoryId', String(input.categoryId));
  if (input.from) params.set('from', input.from);
  if (input.to) params.set('to', input.to);
  return params;
}

export const apiClient = {
  images: {
    list(input: ImageListInput = {}) {
      return request(`/api/images?${imageListParams(input)}`, imageListResponseSchema);
    },
    get(id: number) {
      return request(`/api/images/${id}`, imageResponseSchema);
    },
    fileUrl(id: number) {
      return `/api/images/${id}/file`;
    },
    upload(file: File) {
      uploadFileInputSchema.parse({ mimeType: file.type, sizeBytes: file.size });
      const form = new FormData();
      form.append('file', file);
      return request('/api/images/upload', imageResponseSchema, {
        method: 'POST',
        body: form,
      });
    },
    updateStatus(id: number, status: ImageUpdateInput['status']) {
      const body = imageUpdateInputSchema.parse({ status });
      return request(`/api/images/${id}`, imageResponseSchema, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
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
      const body = annotationCreateInputSchema.parse(input);
      return request('/api/annotations', annotationResponseSchema, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    update(id: number, input: AnnotationUpdateInput) {
      const body = annotationUpdateInputSchema.parse(input);
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
  search: {
    list(q: string, input: PaginationInput = {}) {
      const params = paginationParams(input);
      params.set('q', q.trim());
      return request(`/api/search?${params}`, searchResponseSchema);
    },
  },
  dashboard: {
    metrics() {
      return request('/api/dashboard/metrics', dashboardMetricsResponseSchema);
    },
  },
};
