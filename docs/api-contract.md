# Contrato de API — Portal de Anotación

**Base URL:** `http://localhost:3000` (dev) · `:3100` (producción on-premise)
**Formato:** JSON. Respuesta de éxito `{ "data": ... }`; error
`{ "error": { "code": string, "message": string, "details"?: unknown } }`.
Los listados devuelven `{ "data": [...], "pagination": { "limit", "offset", "total" } }`.
**Prefijo de recursos:** `/api`.

## Convenciones de estado

| Código | Cuándo |
| :----- | :----- |
| 200 | Lectura o actualización correcta |
| 201 | Recurso creado |
| 204 | Borrado correcto (sin cuerpo) |
| 400 | JSON inválido (`INVALID_JSON`), validación Zod (`VALIDATION_ERROR`), archivo ausente (`NO_FILE`) o búsqueda mal formada (`INVALID_SEARCH_QUERY`) |
| 404 | Recurso inexistente (`NOT_FOUND`) |
| 409 | Conflicto de integridad (`CATEGORY_IN_USE`, `CATEGORY_NAME_TAKEN`) |
| 422 | Regla de negocio incumplida (`BBOX_OUT_OF_BOUNDS`, `CATEGORY_NOT_FOUND`, `INVALID_UPLOAD`, `UNREADABLE_IMAGE`, `IMAGE_FILE_MISSING`) |
| 500 | Error no controlado (`INTERNAL`) |

---

## Salud

| Método | Ruta | Descripción |
| :----- | :--- | :---------- |
| GET | `/health` | `{ "status": "ok", "service": "annotation-api" }` |

## Categorías — `/api/categories`

| Método | Ruta | Entrada | Salida |
| :----- | :--- | :------ | :----- |
| GET | `/` | query: `limit` (1–100, def. 20), `offset` (def. 0) | `{ data: Category[], pagination: { limit, offset, total } }` |
| GET | `/:id` | — | `{ data: Category }` · 404 |
| POST | `/` | `{ name: string(1–100), color?: "#RRGGBB" }` | 201 `{ data: Category }` · 409 nombre duplicado |
| PATCH | `/:id` | `{ name?, color? }` (≥ 1 campo) | `{ data: Category }` · 404 · 409 |
| DELETE | `/:id` | — | 204 · 404 · 409 si tiene anotaciones (RN-02) |

`Category = { id, name, color, createdAt }`.

## Imágenes — `/api/images`

| Método | Ruta | Entrada | Salida |
| :----- | :--- | :------ | :----- |
| POST | `/upload` | `multipart/form-data`, campo `file` (JPEG/PNG/WebP, ≤ 10 MB) | 201 `{ data: Image }` · 400 `NO_FILE` · 422 `INVALID_UPLOAD` / `UNREADABLE_IMAGE` |
| GET | `/` | query: `limit`, `offset` | `{ data: Image[], pagination: { limit, offset, total } }` |
| GET | `/:id` | — | `{ data: Image }` · 404 |
| GET | `/:id/file` | — | binario de la imagen con su `Content-Type` (proxy a MinIO) · 404 · 422 `IMAGE_FILE_MISSING` |
| POST | `/` | `{ fileName, originalName, storagePath, mimeType, sizeBytes, width, height }` | 201 `{ data: Image }` |
| PATCH | `/:id` | `{ status: "pending" \| "in_progress" \| "completed" }` | `{ data: Image }` · 404 |
| DELETE | `/:id` | — | 204 · 404 (borra en cascada sus anotaciones, RN) |

`Image = { id, fileName, originalName, storagePath, mimeType, sizeBytes, width, height, status, createdAt, updatedAt }`.

> `POST /upload` valida tipo y tamaño **en el servidor** con `uploadFileSchema`,
> extrae `width`/`height` del binario con `image-size`, sube el objeto a MinIO
> bajo `uploads/<timestamp>_<nombre>` y persiste los metadatos (RN-08).
> `POST /` (metadatos sueltos) queda para cargas administrativas / pruebas.
>
> **Para mostrar la imagen en el navegador** usa `GET /api/images/:id/file`
> (`<img src="/api/images/123/file">`), no `storagePath` (key interna de MinIO).
> El endpoint hace de proxy: mismo origen (proxy de Vite `/api` → `:3000`), sin
> CORS, MinIO no se expone al cliente. No requiere auth.

## Anotaciones — `/api/annotations`

| Método | Ruta | Entrada | Salida |
| :----- | :--- | :------ | :----- |
| GET | `/` | query: `limit`, `offset`, `imageId?` | `{ data: Annotation[], pagination: { limit, offset, total } }` (`total` respeta `imageId`) |
| GET | `/:id` | — | `{ data: Annotation }` · 404 |
| POST | `/` | `{ imageId, categoryId, x, y, width, height, isCrowd? (0\|1) }` | 201 `{ data: Annotation }` · 404 imagen · 422 categoría/bbox |
| PATCH | `/:id` | `{ categoryId?, x?, y?, width?, height?, isCrowd? }` | `{ data: Annotation }` · 404 · 422 |
| DELETE | `/:id` | — | 204 · 404 |

`Annotation = { id, imageId, categoryId, x, y, width, height, area, isCrowd, createdAt, updatedAt }`.
`area` es siempre `width * height` calculada en el servidor (RN-03).

## Filtros de imágenes — `GET /api/images` (RN-07)

`GET /api/images` acepta, además de `limit`/`offset`:

| Filtro | Valores | Efecto |
| :----- | :------ | :----- |
| `status` | `pending` \| `in_progress` \| `completed` | `WHERE images.status = ?` |
| `categoryId` | entero > 0 | `WHERE EXISTS (…annotations con esa categoría…)` |
| `from` | fecha ISO | `WHERE images.created_at >= ?` |
| `to` | fecha ISO | `WHERE images.created_at <= ?` |

Se combinan con AND, resueltos en SQL. `pagination.total` refleja el conteo con
los mismos filtros aplicados. `status` inválido → `400 VALIDATION_ERROR`.

## Búsqueda — `/api/search` (RN-06)

| Método | Ruta | Entrada | Salida |
| :----- | :--- | :------ | :----- |
| GET | `/` | query: `q` (ej. `car AND person` / `car OR dog`), `limit`, `offset` | `{ data: Image[], pagination: { limit, offset, total }, query: { operator, terms } }` · 400 `VALIDATION_ERROR` (sin `q`) · 400 `INVALID_SEARCH_QUERY` (mezcla AND/OR, término vacío, > 10 términos) |

`AND` → imágenes con anotaciones de **todas** las clases; `OR` → de **alguna**.
Resuelto en SQL (subconsulta `GROUP BY ... HAVING COUNT(DISTINCT ...)`), no en memoria.

## Dashboard — `/api/dashboard` (RN-04)

| Método | Ruta | Salida |
| :----- | :--- | :----- |
| GET | `/metrics` | `{ data: { images: { total, byStatus: { pending, in_progress, completed }, progressPct }, annotations: { total }, objectsByCategory: [{ categoryId, name, color, count }] } }` |

Todas las cifras se calculan con agregaciones SQL en cada petición; no hay valores fijos.

---

## Pendiente (Fase 2)

| Método | Ruta | Descripción | Regla |
| :----- | :--- | :---------- | :---- |
| GET | `/api/export/coco` | Descarga del dataset completo en formato COCO | — (Rol 1) |
