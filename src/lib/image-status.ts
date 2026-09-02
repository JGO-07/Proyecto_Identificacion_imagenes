/**
 * RN-05: al crear la primera anotación de una imagen en estado `pending`, la
 * imagen pasa a `in_progress`. Función pura para poder testear la regla sin
 * base de datos.
 */
export function shouldPromoteOnFirstAnnotation(currentStatus: string): boolean {
  return currentStatus === 'pending';
}
