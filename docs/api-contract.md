# Contrato de API — Portal de Anotación

**Base URL:** `http://localhost:3000` (dev) · `:3100` (producción on-premise)
**Formato:** JSON. Respuesta de éxito `{ "data": ... }`; error
`{ "error": { "code": string, "message": string, "details"?: unknown } }`.
**Prefijo de recursos:** `/api`.

## Convenciones de estado

| Código | Cuándo |
| :----- | :----- |
| 200 | Lectura o actualización correcta |
| 201 | Recurso creado |
| 204 | Borrado correcto (sin cuerpo) |
| 400 | JSON inválido o fallo de validación Zod (`VALIDATION_ERROR`) |
| 404 | Recurso inexistente (`NOT_FOUND`) |
| 409 | Conflicto de integridad (`CATEGORY_IN_USE`, `CATEGORY_NAME_TAKEN`) |
| 422 | Regla de negocio incumplida (`BBOX_OUT_OF_BOUNDS`, `CATEGORY_NOT_FOUND`) |
| 500 | Error no controlado (`INTERNAL`) |

---

## Salud

| Método | Ruta | Descripción |
| :----- | :--- | :---------- |
| GET | `/health` | `{ "status": "ok", "service": "annotation-api" }` |

## Categorías — `/api/categories`

| Método | Ruta | Entrada | Salida |
| :----- | :--- | :------ | :----- |
| GET | `/` | query: `limit` (1–100, def. 20), `offset` (def. 0) | `{ data: Category[], pagination }` |
| GET | `/:id` | — | `{ data: Category }` · 404 |
| POST | `/` | `{ name: string(1–100), color?: "#RRGGBB" }` | 201 `{ data: Category }` · 409 nombre duplicado |
| PATCH | `/:id` | `{ name?, color? }` (≥ 1 campo) | `{ data: Category }` · 404 · 409 |
| DELETE | `/:id` | — | 204 · 404 · 409 si tiene anotaciones (RN-02) |

`Category = { id, name, color, createdAt }`.

## Imágenes — `/api/images`

| Método | Ruta | Entrada | Salida |
| :----- | :--- | :------ | :----- |
| GET | `/` | query: `limit`, `offset` | `{ data: Image[], pagination }` |
| GET | `/:id` | — | `{ data: Image }` · 404 |
| POST | `/` | `{ fileName, originalName, storagePath, mimeType, sizeBytes, width, height }` | 201 `{ data: Image }` |
| PATCH | `/:id` | `{ status: "pending" \| "in_progress" \| "completed" }` | `{ data: Image }` · 404 |
| DELETE | `/:id` | — | 204 · 404 (borra en cascada sus anotaciones, RN) |

`Image = { id, fileName, originalName, storagePath, mimeType, sizeBytes, width, height, status, createdAt, updatedAt }`.

> La carga binaria real (multipart, subida a MinIO, extracción de dimensiones y
> `mimeType`) es un endpoint aparte que se implementa en Fase 1/2 junto con Rol 3.
> Validación de archivo: `uploadFileSchema` (JPEG/PNG/WebP, ≤ 10 MB) — RN-08.

## Anotaciones — `/api/annotations`

| Método | Ruta | Entrada | Salida |
| :----- | :--- | :------ | :----- |
| GET | `/` | query: `limit`, `offset`, `imageId?` | `{ data: Annotation[], pagination }` |
| GET | `/:id` | — | `{ data: Annotation }` · 404 |
| POST | `/` | `{ imageId, categoryId, x, y, width, height, isCrowd? (0\|1) }` | 201 `{ data: Annotation }` · 404 imagen · 422 categoría/bbox |
| PATCH | `/:id` | `{ categoryId?, x?, y?, width?, height?, isCrowd? }` | `{ data: Annotation }` · 404 · 422 |
| DELETE | `/:id` | — | 204 · 404 |

`Annotation = { id, imageId, categoryId, x, y, width, height, area, isCrowd, createdAt, updatedAt }`.
`area` es siempre `width * height` calculada en el servidor (RN-03).

---

## Pendiente (Fase 2)

| Método | Ruta | Descripción | Regla |
| :----- | :--- | :---------- | :---- |
| GET | `/api/dashboard/metrics` | Progreso global + objetos por clase, agregado en SQL | RN-04 |
| GET | `/api/search` | `q=car AND person`, resuelto en SQL | RN-06 |
| GET | `/api/images?category=&status=&from=&to=` | Filtros combinables paginados | RN-07 |
| GET | `/api/export/coco` | Descarga del dataset completo en formato COCO | — |
