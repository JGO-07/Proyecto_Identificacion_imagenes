# Trazabilidad — Regla de negocio → SPEC/REQ → `.feature` → Prueba

**Fase:** 3 (Cierre y entrega). **Elaborado por:** Rol 2, cubriendo los tres módulos
(no solo el propio), según el checklist de Fase 3.

Cadena exigida por la rúbrica (criterio 8.1): toda regla de negocio debe poder
seguirse desde su enunciado en lenguaje llano hasta un archivo `.feature`
ejecutable y, cuando aplica, hasta una prueba automatizada que falla si la
lógica se rompe.

> Los IDs de Rol 2 usan el prefijo `RN-xx`, los de Rol 1 `REQ-DATA-xxx`, y los de
> Rol 3 `SPEC-UI-xxx`. Las columnas "Doc fuente" y "`.feature`" son las
> obligatorias del criterio 8.1; "Prueba automatizada" es evidencia adicional
> para 8.3.

## Rol 1 — Datos y Persistencia

| ID | Regla | Doc fuente | `.feature` | Prueba automatizada | Estado |
| :-- | :---- | :---------- | :--------- | :------------------- | :----- |
| REQ-DATA-001 | Esquema con tipos, unicidad e índices compatibles con COCO y búsquedas | `docs/phase_1_requirements_role_1.md` (ficha 1) | `features/data-persistence.feature` | — (verificación manual: `SHOW INDEX`, `SHOW COLUMNS`) | Implementada, prueba manual |
| REQ-DATA-002 | Migraciones versionadas reconstruyen el esquema desde cero | ficha 2 | `features/data-persistence.feature` | — (verificación manual: `docker compose down -v && up && db:migrate`) | Implementada, prueba manual |
| REQ-DATA-003 | Seeder idempotente de categorías e imágenes | ficha 3 | `features/data-persistence.feature` | — (verificación manual: correr `db:seed` 2 veces y comparar conteos) | Implementada, prueba manual |
| REQ-DATA-004 | Binarios aislados en MinIO, nunca en MariaDB | ficha 4 | `features/data-persistence.feature` | `npm run storage:test` (script standalone, no vitest) | Implementada, prueba con script |
| REQ-DATA-005 | Exportación del dataset en formato COCO v1.0 | `docs/phase_2_requirements_coco.md` | `features/coco-export.feature` | `src/services/coco-export.spec.ts`, `src/api/api.spec.ts` | Implementada + probada + mutación verificada |

**Nota:** REQ-DATA-001 a 004 no tienen prueba automatizada (vitest) propia — son
infraestructura verificada manualmente en su momento (ver los docs de fase 1 y
las conversaciones de revisión de PR). Si el equipo quiere subir el criterio
8.3 para estas reglas, faltaría un test de integración que corra las
migraciones/seeder contra una base efímera y verifique el resultado (similar a
`src/services/dashboard.integration.spec.ts` de Rol 2).

## Rol 2 — Lógica de Negocio y API

Tabla completa en [`business-rules.md`](./business-rules.md#trazabilidad); se
resume aquí para tener el mapa completo en un solo lugar.

| ID | Regla | `.feature` | Prueba automatizada | Estado |
| :-- | :---- | :--------- | :-------------------- | :----- |
| RN-01 | Validez geométrica de una anotación | `features/annotation-validity.feature` | `src/lib/geometry.spec.ts`, `src/schemas/annotation.spec.ts` | Implementada + probada |
| RN-02 | Ninguna caja sin clase válida | `features/annotation-validity.feature` | `src/schemas/annotation.spec.ts` | Implementada + probada |
| RN-03 | Cálculo del área en el servidor | `features/annotation-validity.feature` | `src/lib/geometry.spec.ts` | Implementada + probada |
| RN-04 | Progreso del dashboard calculado en SQL | `features/annotation-progress.feature` | `src/services/dashboard.service.spec.ts`, `src/services/dashboard.integration.spec.ts` (`npm run test:db`) | Implementada + probada + integración |
| RN-05 | Transición automática de estado de imagen | `features/image-status.feature` | `src/lib/image-status.spec.ts` | Implementada + probada |
| RN-06 | Búsqueda con operadores AND/OR resuelta en SQL | `features/search-operators.feature` | `src/lib/search-query.spec.ts`, `src/services/search.service.spec.ts` | Implementada + probada |
| RN-07 | Filtros combinables con conteo total consistente | `features/search-operators.feature` | `src/services/images.service.spec.ts` | Implementada + probada |
| RN-08 | Validación de carga de imágenes en servidor | `features/image-upload.feature` | `src/api/api.spec.ts` | Implementada + probada |

## Rol 3 — Frontend y Portal de Anotación

| ID | Regla | Doc fuente | `.feature` | Evidencia | Estado |
| :-- | :---- | :---------- | :--------- | :-------- | :----- |
| SPEC-UI-ANOT-01 | Crear, mover, redimensionar y borrar bounding boxes; persistencia y coordenadas absolutas con zoom | `docs/frontend-flow.md`, `docs/frontend-phase-1-status.md` | `features/annotation-canvas.feature` | Ciclos TDD en el cliente (ver historial de `feat/phase-1-rol3`) + verificación manual con Docker real (imagen 9, caja persistida) | Implementada + probada + verificación manual |
| SPEC-UI-DASH-01 / SPEC-UI-SEARCH-01 | Dashboard con datos reales, búsqueda booleana, filtros de servidor, deshacer persistente, zoom 50-200%, estados de carga/error/vacío | `docs/frontend-phase-2-status.md` | `features/frontend-dashboard-search.feature` *(nuevo, añadido en Fase 3 para cerrar la trazabilidad)* | Verificación manual documentada con Docker real: imagen 9 `in_progress → completed`, dashboard en 11 % de avance, búsqueda `car OR person` correcta | Implementada, prueba manual documentada |

**Nota:** `frontend-dashboard-search.feature` lo redactó Rol 2 durante el cierre
de Fase 3 a partir de lo descrito en `frontend-phase-2-status.md`, porque no
existía un `.feature` para ese trabajo. Rol 3 debería revisarlo y confirmar que
los escenarios reflejan el comportamiento real antes de la entrega.

## Huecos conocidos al cierre de Fase 3

1. REQ-DATA-001 a 004 (Rol 1) no tienen prueba automatizada, solo Gherkin +
   verificación manual histórica.
2. `frontend-dashboard-search.feature` (Rol 3, Fase 2) es de autoría de Rol 2 y
   está pendiente de que Rol 3 lo revise.
3. Un commit antiguo en el historial de `main` conserva un trailer
   `Co-authored-by: Claude Sonnet 5`. Es cosmético (no es un secreto ni afecta
   el build), pero para quitarlo hace falta que el dueño del repositorio
   desactive momentáneamente el ruleset de protección de `main` y fuerce el
   push de una versión reescrita; no se resolvió porque ningún colaborador
   actual tiene permiso de administrador sobre el ruleset.
