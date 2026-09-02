import type { z } from 'zod';
import type {
  apiAnnotationSchema,
  apiCategorySchema,
  apiErrorSchema,
  apiImageSchema,
  imageStatusSchema,
  paginationSchema,
} from '../schemas/api.js';

export type ImageStatus = z.infer<typeof imageStatusSchema>;
export type ApiImage = z.infer<typeof apiImageSchema>;
export type ApiCategory = z.infer<typeof apiCategorySchema>;
export type ApiAnnotation = z.infer<typeof apiAnnotationSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiListSuccess<T> {
  data: T[];
  pagination: Pagination;
}
