# Contrato de consumo del frontend — Rol 3 (Fase 0)

Este documento traduce [`api-contract.md`](./api-contract.md) a las necesidades de las
pantallas del frontend. No redefine la API: conserva el contrato publicado por Rol 2.

## 1. Configuración

- En desarrollo, el navegador llama rutas relativas `/api/*`.
- Vite sirve el frontend en `http://localhost:5173` y redirige `/api` y `/health` a
  `http://localhost:3000`.
- El código de UI no accede a Drizzle, MariaDB ni MinIO directamente.
- Éxito: `{ data: T }` o `{ data: T[], pagination: Pagination }`.
- Error: `{ error: { code: string, message: string, details?: unknown } }`.

## 2. Tipos consumidos

```ts
type ImageStatus = 'pending' | 'in_progress' | 'completed';

type Image = {
  id: number;
  fileName: string;
  originalName: string;
  storagePath: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  sizeBytes: number;
  width: number;
  height: number;
  status: ImageStatus;
  createdAt: string;
  updatedAt: string;
};

type Category = {
  id: number;
  name: string;
  color: `#${string}`;
  createdAt: string;
};

type Annotation = {
  id: number;
  imageId: number;
  categoryId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  isCrowd: 0 | 1;
  createdAt: string;
  updatedAt: string;
};
```

Los schemas ejecutables viven en `src/client/schemas/api.ts` y sus tipos se infieren
con `z.infer` en `src/client/types/api.ts`. También contiene los contratos de entrada
que debe validar el navegador. Se mantienen separados de los schemas de persistencia
del servidor para evitar incluir Drizzle, MariaDB o MinIO en el bundle del frontend.

## 3. Necesidades por pantalla

El cliente validado para los endpoints marcados como disponibles está implementado
en `src/client/lib/api-client.ts`. Su activación en las pantallas espera una prueba de
integración con la infraestructura real para evitar un modo parcialmente persistente.

| Pantalla | Operación | Endpoint | Estado |
| :------- | :-------- | :------- | :----- |
| Bandeja | listar imágenes | `GET /api/images?limit=&offset=` | Disponible |
| Bandeja | cambiar estado | `PATCH /api/images/:id` | Disponible |
| Carga | enviar archivo binario | `POST /api/images/upload` (`multipart/form-data`, campo `file`) | Disponible |
| Anotación | obtener imagen | `GET /api/images/:id` | Disponible |
| Anotación | listar categorías | `GET /api/categories` | Disponible |
| Anotación | listar cajas | `GET /api/annotations?imageId=:id` | Disponible |
| Anotación | crear caja | `POST /api/annotations` | Disponible |
| Anotación | mover/redimensionar | `PATCH /api/annotations/:id` | Disponible |
| Anotación | borrar caja | `DELETE /api/annotations/:id` | Disponible |
| Dashboard | consultar métricas | `GET /api/dashboard/metrics` | Pendiente de Fase 2 |

## 4. Cuerpos enviados desde el canvas

### Crear

```json
{
  "imageId": 1,
  "categoryId": 2,
  "x": 120,
  "y": 80,
  "width": 240,
  "height": 160,
  "isCrowd": 0
}
```

### Mover o redimensionar

```json
{
  "x": 135,
  "y": 92,
  "width": 225,
  "height": 148
}
```

El cliente no envía `area`; el servidor la calcula como `width * height`.

## 5. Conversión de coordenadas

La caja local se guarda siempre en el sistema de coordenadas original de la imagen.
Si el canvas se muestra escalado:

```text
scaleX = anchoCanvas / image.width
scaleY = altoCanvas / image.height

xOriginal      = xVisual / scaleX
yOriginal      = yVisual / scaleY
widthOriginal  = widthVisual / scaleX
heightOriginal = heightVisual / scaleY
```

Antes de enviar se limita la caja a:

```text
x >= 0                     y >= 0
width > 0                  height > 0
x + width <= image.width   y + height <= image.height
```

El servidor repite la validación porque el cliente no es una frontera confiable.

## 6. Errores que la UI debe traducir

| Código | Mensaje/acción de interfaz |
| :----- | :------------------------- |
| `VALIDATION_ERROR` | mostrar el mensaje y resaltar el control relacionado |
| `BBOX_OUT_OF_BOUNDS` | conservar la caja y pedir que se ajuste a la imagen |
| `CATEGORY_NOT_FOUND` | recargar categorías y solicitar otra selección |
| `NOT_FOUND` | volver a la bandeja si la imagen ya no existe |
| `CATEGORY_IN_USE` | explicar que la categoría está asociada a cajas |
| `INTERNAL` | informar que no se pudo completar y permitir reintento |

## 7. Acuerdos de integración después de Sync 2

Rol 2 implementó la carga individual en `POST /api/images/upload` con
`multipart/form-data`, campo `file`. Acepta JPEG, PNG o WebP de hasta 10 MB y responde
`201 { data: Image }`. Los errores publicados son `NO_FILE`, `INVALID_UPLOAD` y
`UNREADABLE_IMAGE`.

Antes de activar toda la UI contra la API todavía debe verificarse:

1. cómo visualizar desde el navegador el objeto almacenado en MinIO;
2. si el progreso de carga se incluirá en esta fase;
3. una prueba de extremo a extremo con MariaDB y MinIO desde una instalación limpia;
4. la discrepancia de paginación: el cliente acepta `total` como opcional porque las
   rutas actuales solo devuelven `limit` y `offset`.
