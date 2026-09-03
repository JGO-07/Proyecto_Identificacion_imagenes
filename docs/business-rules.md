# Reglas de Negocio — Rol 2 (Lógica de Negocio y API)

**Estado:** borrador Fase 0, formalizado en Fase 1.
Cada regla se enuncia en lenguaje natural, se le asigna un SPEC y se traza a un
archivo `.feature` en Gherkin.

## Trazabilidad

| Regla | SPEC | Archivo `.feature` | Estado |
| :---- | :--- | :----------------- | :----- |
| RN-01 Validez de una anotación | SPEC-ANOT-01 | `features/annotation-validity.feature` | Implementada + probada |
| RN-02 Ninguna caja sin clase válida | SPEC-ANOT-02 | `features/annotation-validity.feature` | Implementada + probada |
| RN-03 Cálculo del área | SPEC-ANOT-03 | `features/annotation-validity.feature` | Implementada + probada |
| RN-04 Cálculo del progreso de anotación | SPEC-DASH-01 | `features/annotation-progress.feature` | Implementada + probada |
| RN-05 Estados de una imagen | SPEC-IMG-01 | `features/image-status.feature` | Implementada + probada |
| RN-06 Operadores de búsqueda (AND / OR) en SQL | SPEC-SEARCH-01 | `features/search-operators.feature` | Implementada + probada |
| RN-07 Filtros combinables con paginación | SPEC-SEARCH-02 | `features/search-operators.feature` | Implementada + probada |
| RN-08 Validación de carga de imágenes | SPEC-IMG-02 | `features/image-upload.feature` | Implementada + probada |

---

## RN-01 — Validez de una anotación
**Regla.** Una bounding box es válida solo si: referencia una imagen existente,
referencia una categoría existente, sus coordenadas de origen `(x, y)` son `>= 0`,
su `width` y `height` son `> 0`, y la caja queda completamente contenida dentro de
las dimensiones de la imagen (`x + width <= image.width`, `y + height <= image.height`).
**Motivo.** Evita cajas que el canvas no puede renderizar y coordenadas que
romperían la exportación COCO en píxeles absolutos.
**Implementación.** `src/lib/geometry.ts` (`isWithinBounds`), aplicada en
`src/services/annotations.service.ts`. Validación de forma en
`src/schemas/annotation.ts`.

## RN-02 — Ninguna caja sin clase válida
**Regla.** Toda anotación debe tener `category_id` que apunte a una categoría
existente. Una categoría con anotaciones asociadas no puede eliminarse
(`ON DELETE RESTRICT`); el intento devuelve `409 CATEGORY_IN_USE`.
**Motivo.** Requisito explícito de la rúbrica: "ninguna caja sin clase válida".
**Implementación.** Verificación de FK en `createAnnotation` / `updateAnnotation`;
traducción del error 1451 en `src/lib/db-errors.ts`.

## RN-03 — Cálculo del área
**Regla.** `area = width * height`, calculada **en el servidor**. Un `area` enviado
por el cliente se ignora.
**Motivo.** Coherencia garantizada con el campo `area` de COCO (`≈ width*height`).
**Implementación.** `computeArea` en `src/lib/geometry.ts`; el schema Zod de alta
no incluye `area`.

## RN-04 — Cálculo del progreso de anotación
**Regla.** El progreso global es `imágenes con status = 'completed' / total de
imágenes`, expresado como porcentaje. El desglose por clase cuenta anotaciones
agrupadas por `category_id`. Todo se calcula con agregaciones SQL, nunca con
valores fijos.
**Motivo.** El dashboard debe reflejar el estado real de la base en cada consulta.
**Implementación.** `src/services/dashboard.service.ts` (`GET /api/dashboard/metrics`):
`buildImageStatusCounts` (`GROUP BY status`), `buildAnnotationTotal` (`COUNT(*)`) y
`buildObjectsByCategory` (`JOIN` + `GROUP BY` categoría). `computeProgressPct` es una
función pura. Probado en `src/services/dashboard.service.spec.ts` inspeccionando el SQL
generado (`toSQL()`).

## RN-05 — Estados de una imagen
**Regla.** `status ∈ {pending, in_progress, completed}`. Transiciones válidas:
`pending → in_progress → completed` y cualquier estado `→ pending` (reapertura,
manual vía `PATCH /api/images/:id`). Al crear la primera anotación de una imagen
`pending`, pasa automáticamente a `in_progress`.
**Motivo.** Base del cálculo de progreso (RN-04).
**Implementación.** Enum en `src/db/types.ts` + `src/schemas/image.ts`. Transición
automática: `shouldPromoteOnFirstAnnotation` en `src/lib/image-status.ts`, aplicada
en `createAnnotation` (`src/services/annotations.service.ts`). Probada en
`src/lib/image-status.spec.ts`.

## RN-06 — Operadores de búsqueda (AND / OR) en SQL
**Regla.** Una búsqueda como `car AND person` devuelve las imágenes que tienen al
menos una anotación de categoría `car` **y** al menos una de `person`. `OR`
devuelve las que tienen alguna de las dos. La resolución es 100% en SQL
(`GROUP BY annotations.image_id ... HAVING COUNT(DISTINCT categories.name) = N` para
AND; sin `HAVING` para OR), nunca trayendo todo a memoria y filtrando con `.filter()`.
**Motivo.** Requisito explícito de la rúbrica.
**Implementación.** `src/lib/search-query.ts` (`parseSearchQuery`, función pura: no
mezcla AND/OR, límite de términos) + `src/services/search.service.ts`
(`buildImageSearch` / `buildImageSearchCount`, subconsulta `IN (SELECT ...)`) →
`GET /api/search`. Probado en `src/lib/search-query.spec.ts` y
`src/services/search.service.spec.ts` (verifica el SQL con `toSQL()`).

## RN-07 — Filtros combinables con paginación
**Regla.** Los filtros por clase, `status` y rango de fechas (`created_at`) se
combinan con AND. El resultado se pagina con `limit`/`offset`; el conteo total
que acompaña la respuesta es consistente con los filtros aplicados.
**Motivo.** Requisito explícito de la rúbrica.
**Implementación.** `imageFilterQuerySchema` (`src/schemas/image.ts`) +
`buildFilteredImages` / `buildFilteredImagesCount` (`src/services/images.service.ts`):
`WHERE` combinado con `and(...)`, filtro de clase vía `EXISTS` sobre `annotations`, y
la consulta de conteo usa el MISMO `WHERE`. `GET /api/images` devuelve
`pagination: { limit, offset, total }`. Probado en `src/services/images.service.spec.ts`.

## RN-08 — Validación de carga de imágenes
**Regla.** Solo se aceptan archivos `image/jpeg`, `image/png`, `image/webp` de
hasta 10 MB. La validación se hace **en el servidor** (no solo en el `accept` del
input) y devuelve un mensaje claro al usuario, no un error 500. Además se
verifica que el binario sea realmente una imagen legible antes de guardarla.
**Motivo.** Requisito explícito de la rúbrica (feedback al usuario).
**Implementación.** `POST /api/images/upload` (`src/api/routes/images.ts`) →
`createImageFromUpload` (`src/services/images.service.ts`): valida con
`uploadFileSchema`, extrae dimensiones con `image-size`, sube a MinIO y persiste
metadatos. Errores: `422 INVALID_UPLOAD` (tipo/tamaño), `422 UNREADABLE_IMAGE`
(binario ilegible), `400 NO_FILE` (sin archivo). Contratos probados en
`src/api/api.spec.ts`.
