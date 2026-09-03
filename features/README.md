# Fichas Gherkin (`.feature`)

Cada regla de negocio de [`docs/business-rules.md`](../docs/business-rules.md)
sigue la cadena:

```
Regla de negocio (RN-xx)  ->  SPEC-xx  ->  archivo .feature (Given/When/Then)  ->  prueba automatizada
```

## Convención

- Un `Feature` por regla o grupo de reglas cercanas.
- La primera línea de comentario del archivo cita el `SPEC` y la `RN`.
- `Scenario` en presente, sin detalles de implementación (nada de rutas HTTP ni
  nombres de función en el texto Gherkin; eso vive en los steps).
- Los escenarios (o Features) marcados `@wip` todavía no tienen prueba verde.

## Archivos

| Archivo | Reglas | Estado |
| :------ | :----- | :----- |
| `plantilla.feature` | — | Plantilla de referencia |
| `annotation-validity.feature` | RN-01, RN-02, RN-03 | Activo |
| `image-upload.feature` | RN-08 | Activo |
| `image-status.feature` | RN-05 | Activo |
| `annotation-progress.feature` | RN-04 | Activo |
| `search-operators.feature` | RN-06, RN-07 | Activo |
| `annotation-canvas.feature` | SPEC-UI-ANOT-01 (Rol 3, Fase 0) | Activo |

## Pruebas

Reglas cubiertas por pruebas automatizadas (`npm test`):

| Regla | Prueba |
| :---- | :----- |
| RN-01, RN-03 (geometría) | `src/lib/geometry.spec.ts` |
| RN-01, RN-02, RN-03 (validación de forma) | `src/schemas/annotation.spec.ts` |
| RN-04 (métricas del dashboard en SQL) | `src/services/dashboard.service.spec.ts` |
| RN-05 (transición de estado) | `src/lib/image-status.spec.ts` |
| RN-06 (parser de operadores + búsqueda en SQL) | `src/lib/search-query.spec.ts`, `src/services/search.service.spec.ts` |
| RN-07 (filtros combinables + conteo total en SQL) | `src/services/images.service.spec.ts` |
| RN-08 + contratos HTTP de todos los endpoints | `src/api/api.spec.ts` |
| Esquemas Zod generados desde Drizzle | `src/schemas/entities.spec.ts` |

Pruebas de integración contra MariaDB real (`npm run test:db`, requiere
`docker compose up -d`; se saltan solas si la base no responde):

| Regla | Prueba |
| :---- | :----- |
| RN-04 (las métricas cambian al agregar anotaciones / marcar completed) | `src/services/dashboard.integration.spec.ts` |
