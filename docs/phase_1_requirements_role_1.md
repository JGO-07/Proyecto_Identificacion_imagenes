# Documentación de Arquitectura de Datos y Fichas de Requerimiento (Fase 1)

**Rol:** Arquitecto de Datos y Persistencia (Rol 1)  
**Rama:** `feat/phase-1-ur`  
**Objetivo:** Consolidación de capa de persistencia, migraciones versionadas, seeder idempotente y desacoplamiento de blobs en MinIO.

---

## 1. Justificación de Decisiones Técnicas y Esquema

* **Identificadores numéricos secuenciales (`INT AUTO_INCREMENT`):**
  * *Motivo:* El formato de exportación COCO exige identifiers enteros para `images.id`, `annotations.id` y `categories.id` (`category_id`). Usar enteros nativos en MariaDB evita conversiones o hashes en memoria durante la exportación de la Fase 2.
* **Integridad referencial y reglas de borrado:**
  * `annotations.image_id` (`ON DELETE CASCADE`): Si una imagen es dada de baja del dataset, sus anotaciones asociadas dejan de tener validez geométrica y semántica, por lo que deben eliminarse automáticamente.
  * `annotations.category_id` (`ON DELETE RESTRICT`): Garantiza la regla de negocio crítica: *"ninguna caja sin clase válida"*. Impide eliminar una categoría si existen anotaciones vinculadas.
* **Estrategia de Indexación Relacional:**
  * `images.status`: Optimiza el filtrado del dashboard y la cola de trabajo (`pending`, `in_progress`, `completed`).
  * `images.created_at`: Acelera los filtros temporales por rango de fechas resueltos en SQL.
  * `annotations.image_id` y `annotations.category_id`: Soporta las queries agregadas de conteo por clase y las búsquedas booleanas (`car AND person`) en MariaDB sin table scans.
* **Desacoplamiento de Binarios (MinIO vs MariaDB):**
  * MariaDB almacena exclusivamente metadatos dimensionales (`width`, `height`), tipo MIME y la clave de acceso (`storage_path`).
  * Los binarios residen en MinIO bajo `uploads/<file_name>`, reduciendo el tamaño de la base de datos relacional y permitiendo escalamiento horizontal.

---

## 2. Fichas de Requerimiento (Especificación y Reglas de Negocio)

### Ficha 1: Esquema Relacional e Indexación
* **ID:** `REQ-DATA-001`
* **Regla de Negocio:** La estructura relacional debe garantizar tipos numéricos compatibles con COCO, unicidad de archivos y soporte de búsqueda indexada en servidor.
* **Especificación Técnica:**
  * Tablas: `categories`, `images`, `annotations`.
  * Índices creados: `images_status_idx`, `images_created_at_idx`, `annotations_image_id_idx`, `annotations_category_id_idx`.
  * Restricción única en `images.file_name`.
  * Coordenadas absolutas de bounding box almacenadas como números reales (`double`): `x`, `y`, `width`, `height`, `area`, junto con `is_crowd` (`tinyint`).

### Ficha 2: Migraciones Versionadas y Reconstrucción Limpia
* **ID:** `REQ-DATA-002`
* **Regla de Negocio:** Cualquier miembro del equipo o evaluador debe poder levantar el esquema relacional en una base de datos limpia sin intervención manual.
* **Especificación Técnica:**
  * Script `npm run db:migrate` implementado en `src/db/migrate.ts` utilizando Drizzle Kit y `mysql2`.
  * Migración versionada generada en `drizzle/0000_sad_satana.sql`.
  * Configuración centralizada en `drizzle.config.ts` vinculada al esquema en `src/db/schema.ts`.

### Ficha 3: Seeder Idempotente de Categorías e Imágenes
* **ID:** `REQ-DATA-003`
* **Regla de Negocio:** El sistema debe inicializarse con categorías base e imágenes de prueba válidas. Ejecutar el comando múltiples veces consecutivas debe producir el mismo estado final sin duplicar registros.
* **Especificación Técnica:**
  * Script ejecutable con `npm run db:seed`.
  * Categorías precargadas: `car` (#EF4444), `person` (#3B82F6), `dog` (#10B981), `cat` (#F59E0B), `bicycle` (#8B5CF6).
  * 8 imágenes con metadatos exactos de resolución sincronizadas con MinIO.
  * Estrategia de idempotencia: Verificación de existencia previa por `name` en categorías y `file_name` en imágenes antes de insertar. Cache local transitorio en `data/dataset-src` ignorado por Git.

### Ficha 4: Integración y Aislamiento de MinIO
* **ID:** `REQ-DATA-004`
* **Regla de Negocio:** El sistema de archivos debe abstraerse mediante S3/MinIO; el almacenamiento debe crearse automáticamente y contar con verificación aislada.
* **Especificación Técnica:**
  * Cliente oficial configurado en `src/storage/minio.ts`.
  * Función `ensureBucket()` para inicialización desatendida del bucket configurado.
  * Script de prueba en `src/storage/test-minio.ts` (`npm run storage:test`) que valida el ciclo completo de subida y recuperación de buffers en memoria.
