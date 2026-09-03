/**
 * RN-06: análisis de una consulta de búsqueda con operadores booleanos.
 * Convierte `"car AND person"` en `{ operator: 'AND', terms: ['car', 'person'] }`.
 * No mezcla AND y OR y limita el número de términos. Los términos son palabras
 * sueltas (los nombres de categoría del proyecto no llevan espacios).
 * Función pura, sin acceso a base de datos: la resolución en SQL vive en
 * `search.service.ts`.
 */

export type SearchOperator = 'AND' | 'OR';

export interface ParsedSearchQuery {
  operator: SearchOperator;
  terms: string[];
}

export class SearchQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchQueryError';
  }
}

const MAX_TERMS = 10;
const OPERATOR = /^(AND|OR)$/i;

export function parseSearchQuery(raw: string): ParsedSearchQuery {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new SearchQueryError('La búsqueda no puede estar vacía');
  }

  const words = trimmed.split(/\s+/);
  const terms: string[] = [];
  const operators: string[] = [];
  let expectingTerm = true;

  for (const word of words) {
    const isOperator = OPERATOR.test(word);
    if (expectingTerm) {
      if (isOperator) {
        throw new SearchQueryError(`Se esperaba un término antes de "${word.toUpperCase()}"`);
      }
      terms.push(word);
    } else {
      if (!isOperator) {
        throw new SearchQueryError(`Se esperaba AND u OR entre "${terms.at(-1)}" y "${word}"`);
      }
      operators.push(word.toUpperCase());
    }
    expectingTerm = !expectingTerm;
  }

  if (expectingTerm) {
    throw new SearchQueryError('La búsqueda termina en un operador sin término');
  }

  const distinctOperators = [...new Set(operators)];
  if (distinctOperators.length > 1) {
    throw new SearchQueryError('No se pueden mezclar AND y OR en la misma búsqueda');
  }

  if (terms.length > MAX_TERMS) {
    throw new SearchQueryError(`Demasiados términos de búsqueda (máximo ${MAX_TERMS})`);
  }

  const operator: SearchOperator = distinctOperators[0] === 'AND' ? 'AND' : 'OR';
  return { operator, terms };
}
