# Estado del frontend — Rol 3, Fase 1

**Rama:** `feat/phase-1-rol3`  
**Base:** commit de cierre de Fase 0 `01eb129`  
**Estado:** desarrollo local independiente terminado; integración con almacenamiento pendiente.

## Implementado

| Entregable | Evidencia | Estado |
| :--------- | :-------- | :----- |
| Validación de JPEG, PNG y WebP de hasta 10 MB | `src/client/lib/file-validation.ts` | Terminado |
| Feedback visible para archivo válido o inválido | `src/client/pages/UploadPage.tsx` | Terminado local |
| Selección de categoría antes de dibujar | `src/client/pages/AnnotationPage.tsx` | Terminado local |
| Creación de bounding boxes | `src/client/components/AnnotationCanvas.tsx` | Terminado en memoria |
| Movimiento y redimensionamiento | `src/client/components/AnnotationCanvas.tsx` | Terminado en memoria |
| Límites y coordenadas en píxeles originales | `src/client/lib/canvas-geometry.ts` | Terminado |
| Área y cambio `pending → in_progress` | `src/client/store/annotation-store.ts` | Terminado en memoria |
| Cliente para imágenes, categorías y anotaciones | `src/client/lib/api-client.ts` | Implementado y probado |
| Validación Zod de respuestas externas | `src/client/schemas/api.ts` | Implementado y probado |

## Integración pendiente

El cliente HTTP existe, pero las pantallas permanecen en modo local para no presentar
como persistentes operaciones que el backend todavía no puede completar de extremo a
extremo.

Rol 2 y Rol 3 deben cerrar estos puntos antes de activar el modo API:

1. endpoint multipart definitivo para subir el archivo binario;
2. nombre del campo multipart y forma de la respuesta;
3. endpoint o URL autorizada para visualizar objetos almacenados en MinIO;
4. campo `total` de las respuestas paginadas;
5. prueba con MariaDB y MinIO desde una instalación limpia.

Después de resolverlos se reemplazará la fuente local por `apiClient`, se mostrarán
estados de carga/error por petición y se verificará la persistencia con una recarga
completa del navegador.

## Evidencia TDD

El historial conserva pruebas antes de la implementación:

```text
c044904 test(frontend): definir reglas de archivos y coordenadas       (Red)
8fed129 test(frontend): definir validacion del cliente HTTP            (Red)
a20ee1a feat(frontend): validar archivos coordenadas y respuestas API  (Green)
92dc488 test(frontend): definir creacion de cajas en memoria           (Red)
6133f28 feat(frontend): crear y clasificar cajas en memoria            (Green)
```

## Verificación local

```bash
npm test           # 27 pruebas
npm run typecheck  # servidor y frontend
npm run lint       # Biome sobre todo el repositorio
npm run build      # servidor + cliente Vite
npm run dev:web    # http://localhost:5173
```

Vite guarda su caché descartable en el directorio temporal del sistema. Esto evita
que OneDrive bloquee `node_modules/.vite`; no cambia el contenido generado ni el
comportamiento del proyecto.
