/** Utilidades para interpretar errores del driver mysql2 sin usar `any`. */

interface MysqlError {
  code?: string;
  errno?: number;
}

function asMysqlError(error: unknown): MysqlError | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const candidate = error as Record<string, unknown>;
  const code = typeof candidate.code === 'string' ? candidate.code : undefined;
  const errno = typeof candidate.errno === 'number' ? candidate.errno : undefined;
  return { code, errno };
}

/**
 * RN-02: una categoría con anotaciones asociadas no se puede borrar
 * (`ON DELETE RESTRICT`). MySQL/MariaDB lo reporta como ER_ROW_IS_REFERENCED_2
 * (errno 1451).
 */
export function isForeignKeyConstraintError(error: unknown): boolean {
  const parsed = asMysqlError(error);
  return parsed?.code === 'ER_ROW_IS_REFERENCED_2' || parsed?.errno === 1451;
}

/** Violación de restricción UNIQUE (errno 1062). */
export function isUniqueConstraintError(error: unknown): boolean {
  const parsed = asMysqlError(error);
  return parsed?.code === 'ER_DUP_ENTRY' || parsed?.errno === 1062;
}
