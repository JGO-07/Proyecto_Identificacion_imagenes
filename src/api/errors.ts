/** Códigos de estado HTTP que la aplicación produce de forma controlada. */
export type ErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 500;

/**
 * Error de dominio con código estable y estado HTTP. El manejador global lo
 * traduce a una respuesta JSON consistente `{ error: { code, message, details } }`.
 */
export class AppError extends Error {
  readonly status: ErrorStatus;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: ErrorStatus, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message: string): AppError => new AppError(404, 'NOT_FOUND', message);

export const unprocessable = (code: string, message: string): AppError =>
  new AppError(422, code, message);

export const conflict = (code: string, message: string): AppError =>
  new AppError(409, code, message);
