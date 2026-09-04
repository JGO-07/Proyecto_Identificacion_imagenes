# Fichas Gherkin (`.feature`)

Cada regla de negocio sigue la cadena:

```
Regla de negocio (RN-xx / REQ-DATA-xxx / SPEC-UI-xxx)  ->  SPEC/REQ  ->  archivo .feature (Given/When/Then)  ->  prueba automatizada
```

La matriz completa de las tres capas (Rol 1, Rol 2, Rol 3) está en
[`docs/traceability.md`](../docs/traceability.md). Este archivo es el índice de
los `.feature` en sí.

## Convención

- Un `Feature` por regla o grupo de reglas cercanas.
- La primera línea de comentario del archivo cita el `SPEC`/`REQ` y, si aplica, la `RN`.
- `Scenario` en presente, sin detalles de implementación (nada de rutas HTTP ni
  nombres de función en el texto Gherkin; eso vive en los steps).
- Los escenarios (o Features) marcados `@wip` todavía no tienen prueba verde.

## Archivos

| Archivo | Reglas | Módulo | Estado |
| :------ | :----- | :----- | :----- |
| `plantilla.feature` | — | — | Plantilla de referencia |
| `annotation-validity.feature` | RN-01, RN-02, RN-03 | Rol 2 | Activo |
| `image-upload.feature` | RN-08 | Rol 2 | Activo |
| `image-status.feature` | RN-05 | Rol 2 | Activo |
| `annotation-progress.feature` | RN-04 | Rol 2 | Activo |
| `search-operators.feature` | RN-06, RN-07 | Rol 2 | Activo |
| `data-persistence.feature` | REQ-DATA-001 a 004 | Rol 1 | Activo (sin prueba automatizada, ver `docs/traceability.md`) |
| `coco-export.feature` | REQ-DATA-005 | Rol 1 | Activo |
| `annotation-canvas.feature` | SPEC-UI-ANOT-01 (Fases 1 y 2) | Rol 3 | Activo |
| `frontend-dashboard-search.feature` | SPEC-UI-DASH-01, SPEC-UI-SEARCH-01 | Rol 3 | Activo — pendiente de revisión por Rol 3 |

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
| REQ-DATA-005 (exportación COCO + casos de mutación) | `src/services/coco-export.spec.ts` |

Pruebas de integración contra MariaDB real (`npm run test:db`, requiere
`docker compose up -d`; se saltan solas si la base no responde):

| Regla | Prueba |
| :---- | :----- |
| RN-04 (las métricas cambian al agregar anotaciones / marcar completed) | `src/services/dashboard.integration.spec.ts` |

REQ-DATA-001 a 004 (esquema, migraciones, seeder, MinIO) y las reglas de Rol 3
de Fase 2 (dashboard/búsqueda en UI) se verifican manualmente; ver
`docs/traceability.md` para el detalle y los huecos conocidos.
