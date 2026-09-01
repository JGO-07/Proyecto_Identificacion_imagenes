import type { Context } from 'hono';
import type { ZodType } from 'zod';
import { AppError } from './errors.js';

/** Lee y parsea el cuerpo JSON, devolviendo un 400 claro si no es JSON válido. */
export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new AppError(400, 'INVALID_JSON', 'El cuerpo de la petición debe ser JSON válido');
  }
}

/**
 * Valida `data` contra un esquema Zod. Los `ZodError` se dejan propagar para que
 * el manejador global los formatee de manera uniforme.
 */
export function parseWith<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}
