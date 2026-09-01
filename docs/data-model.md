# Documento de Definición de Datos y Persistencia (Fase 0 - Sync 1)

**Rol:** Arquitecto de Datos y Persistencia (Rol 1)
**Proyecto:** Portal de Anotación de Imágenes (Monolito)
**Estado:** Propuesta para validación de equipo (Sync 1)

---

## 1. Convenciones de Nomenclatura

* **Tablas (MariaDB / SQL):** Plural, minúsculas, formato `snake_case` (ej. `images`, `categories`, `annotations`).
* **Columnas (SQL):** Minúsculas, formato `snake_case` (ej. `original_name`, `created_at`).
* **Claves Primarias:** Enteros autoincrementales (`id` INT AUTO_INCREMENT), lo que simplifica la correlación 1:1 con el estándar de exportación COCO.
* **Claves Foráneas:** Singular de la tabla referenciada + `_id` (ej. `image_id`, `category_id`).
* **Variables TypeScript / Drizzle:** `camelCase` mapeado explícitamente a las columnas `snake_case`.
* **Buckets y Objetos MinIO:** Minúsculas y guiones (kebab-case) para el bucket (`annotation-images`), y UUIDs/timestamps para las rutas de almacenamiento (`storage_path`).

---

## 2. Entidades y Modelo Relacional (Lenguaje Llano)

### 2.1. Entidad: `categories` (Categorías / Clases de Anotación)

Representa las etiquetas o clases que pueden asignarse a los objetos dentro de las imágenes (ej. "car", "person", "dog").

* **Atributos:**
  * `id` (Entero, PK): Identificador único numérico (utilizado directamente como `category_id` en COCO).
  * `name` (Texto, Único): Nombre descriptivo de la clase (ej. `pedestrian`).
  * `color` (Texto): Código hexadecimal (ej. `#3B82F6`) para renderizado visual consistente en la UI.
  * `created_at` (Fecha y hora): Registro temporal de creación.

---

### 2.2. Entidad: `images` (Metadatos de Imágenes)

Almacena únicamente los metadatos e información dimensional de las imágenes subidas. Los archivos binarios residen en MinIO.

* **Atributos:**
  * `id` (Entero, PK): Identificador único numérico (usado como `image_id` en COCO).
  * `file_name` (Texto): Nombre único generado para almacenamiento en MinIO (ej. `1718000000_image.jpg`).
  * `original_name` (Texto): Nombre original del archivo subido por el usuario.
  * `storage_path` (Texto): Clave/ruta de acceso al objeto binario dentro del bucket de MinIO.
  * `mime_type` (Texto): Tipo MIME validado (ej. `image/jpeg`, `image/png`).
  * `size_bytes` (Entero): Tamaño del archivo en bytes para control de cuotas y validaciones.
  * `width` (Entero): Ancho exacto de la imagen en píxeles.
  * `height` (Entero): Alto exacto de la imagen en píxeles.
  * `status` (Texto / Enum): Estado de anotación (`pending`, `in_progress`, `completed`).
  * `created_at` / `updated_at` (Fecha y hora): Auditoría de creación y última modificación.

---

### 2.3. Entidad: `annotations` (Bounding Boxes / Cajas Delimitadoras)

Representa cada una de las cajas de anotación creadas sobre una imagen específica.

* **Atributos y Coordenadas:**
  * `id` (Entero, PK): Identificador único numérico (usado como `annotation_id` en COCO).
  * `image_id` (Entero, FK): Referencia obligatoria a `images.id` (con borrado en cascada `ON DELETE CASCADE`).
  * `category_id` (Entero, FK): Referencia obligatoria a `categories.id` (con restricción `ON DELETE RESTRICT` para evitar cajas huérfanas sin clase válida).
  * `x` (Double / Decimal): Posición X del origen de la caja en píxeles absolutos (esquina superior izquierda).
  * `y` (Double / Decimal): Posición Y del origen de la caja en píxeles absolutos (esquina superior izquierda).
  * `width` (Double / Decimal): Ancho de la caja en píxeles absolutos.
  * `height` (Double / Decimal): Alto de la caja en píxeles absolutos.
  * `area` (Double / Decimal): Área en píxeles cuadrados (`width * height`), calculada para compatibilidad directa con el esquema COCO.
  * `is_crowd` (TinyInt / Booleano): Flag (0 o 1) obligatorio del formato COCO para indicar si la anotación cubre un grupo denso de objetos.
  * `created_at` / `updated_at` (Fecha y hora): Auditoría temporal.

---

## 3. Matriz de Relaciones

| Tabla Origen | Cardinalidad | Tabla Destino | Regla de Integridad | Justificación |
| :--- | :---: | :--- | :--- | :--- |
| `images` | 1 a N | `annotations` | `ON DELETE CASCADE` | Si se elimina una imagen, se eliminan todas sus cajas asociadas. |
| `categories` | 1 a N | `annotations` | `ON DELETE RESTRICT` | No se puede eliminar una categoría si existen anotaciones que la usan (cumple la regla: "ninguna caja sin clase válida"). |

---

## 4. Alineación con Requisitos y Otras Capas

1. **Separación de Responsabilidades:** MinIO maneja exclusivamente blobs/archivos binarios, mientras que MariaDB gestiona metadatos y búsquedas relacionales.
2. **Soporte Directo para COCO (Fase 2):** Los campos `[x, y, width, height]`, `area` e `is_crowd` garantizan que la exportación sea directa sin conversiones pesadas en memoria.
3. **Búsquedas y Dashboard (Rol 2):** Se diseñarán índices sobre `category_id`, `status` y `created_at` para permitir búsquedas compuestas (`car AND person`) y filtros temporales resueltos 100% en SQL.
4. **Validaciones en UI (Rol 3):** Las dimensiones `width` y `height` en `images` permiten al frontend calcular correctamente el escalado del canvas independientemente de la resolución de pantalla.

---

## 5. Alcance por fase

* **Fase 0 (este documento + borrador de esquema):** entidades, atributos y relaciones en lenguaje llano; esquema Drizzle borrador en `src/db/schema.ts` sin afinar índices.
* **Fase 1:** esquema final (índices sobre `category_id`, `status`, `created_at` y las FKs), migraciones versionadas en `drizzle/`, seeder idempotente e integración con MinIO probada de forma aislada.
