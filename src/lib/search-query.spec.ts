import { describe, expect, it } from 'vitest';
import { SearchQueryError, parseSearchQuery } from './search-query.js';

describe('parseSearchQuery (RN-06)', () => {
  it('un solo término -> OR con un elemento', () => {
    expect(parseSearchQuery('car')).toEqual({ operator: 'OR', terms: ['car'] });
  });

  it('reconoce el operador AND', () => {
    expect(parseSearchQuery('car AND person')).toEqual({
      operator: 'AND',
      terms: ['car', 'person'],
    });
  });

  it('reconoce el operador OR con varios términos', () => {
    expect(parseSearchQuery('car OR person OR dog')).toEqual({
      operator: 'OR',
      terms: ['car', 'person', 'dog'],
    });
  });

  it('el operador es insensible a mayúsculas y recorta espacios', () => {
    expect(parseSearchQuery('  Car   and   Person  ')).toEqual({
      operator: 'AND',
      terms: ['Car', 'Person'],
    });
  });

  it('rechaza mezclar AND y OR', () => {
    expect(() => parseSearchQuery('car AND person OR dog')).toThrow(SearchQueryError);
  });

  it('rechaza una búsqueda vacía', () => {
    expect(() => parseSearchQuery('   ')).toThrow(SearchQueryError);
  });

  it('rechaza un operador sin término a la derecha', () => {
    expect(() => parseSearchQuery('car AND')).toThrow(SearchQueryError);
  });

  it('rechaza un operador sin término a la izquierda', () => {
    expect(() => parseSearchQuery('OR person')).toThrow(SearchQueryError);
  });

  it('rechaza más de 10 términos', () => {
    const many = Array.from({ length: 11 }, (_, i) => `c${i}`).join(' OR ');
    expect(() => parseSearchQuery(many)).toThrow(SearchQueryError);
  });
});
