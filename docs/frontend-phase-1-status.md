# Estado del frontend — Rol 3, Fase 1

**Rama:** `feat/phase-1-rol3`

**Base:** `main` después del PR #7 del Rol 2 (`12882bf`)

**Estado:** integración funcional y verificación real terminadas; recorrido manual de
gestos y responsive pendiente antes del PR.

## Implementado

| Entregable | Evidencia | Estado |
| :--------- | :-------- | :----- |
| Validación de JPEG, PNG y WebP de hasta 10 MB | `src/client/lib/file-validation.ts` | Terminado |
| Carga multipart en el campo `file` | `src/client/lib/api-client.ts` | Terminado y probado |
| Feedback de selección, carga, éxito y error | `src/client/pages/UploadPage.tsx` | Terminado |
| Bandeja y paginación con datos reales | `src/client/pages/ImagesPage.tsx` | Terminado |
| Miniaturas mediante `/api/images/:id/file` | `src/client/pages/ImagesPage.tsx` | Terminado |
| Imagen real como fondo de Konva | `src/client/components/AnnotationCanvas.tsx` | Terminado |
| Categorías y cajas obtenidas de la API | `src/client/pages/AnnotationPage.tsx` | Terminado |
| Creación persistente de bounding boxes | `src/client/pages/AnnotationPage.tsx` | Terminado |
| Movimiento y redimensionamiento persistentes | `src/client/pages/AnnotationPage.tsx` | Terminado |
| Reversión visual cuando una actualización falla | `src/client/pages/AnnotationPage.tsx` | Terminado |
| Límites y coordenadas en píxeles originales | `src/client/lib/canvas-geometry.ts` | Terminado |
| Cambio `pending → in_progress` después de la primera caja | API del Rol 2 y recarga de imagen en el cliente | Terminado |
| `pagination.total` obligatorio | `src/client/schemas/api.ts` | Terminado y probado |
| Validación Zod de respuestas externas | `src/client/schemas/api.ts` | Terminado y probado |

El dashboard continúa con datos simulados y una etiqueta visible. Sus métricas reales
pertenecen a Fase 2 y no forman parte del cierre de Fase 1.

## Decisiones de integración

### Acceso a imágenes

El cliente usa `GET /api/images/:id/file`. No utiliza `storagePath` ni conoce el host,
puerto, bucket o credenciales de MinIO. Esto mantiene la separación UI / lógica /
datos y permite que la infraestructura cambie sin modificar el frontend.

### Persistencia automática

Crear, mover o redimensionar envía la operación al terminar el gesto. Durante la
petición se bloquea una segunda transformación. En una actualización, la caja se
muestra primero en su posición nueva; si la API falla, regresa al valor anterior y se
muestra el mensaje correspondiente.

### Schemas del navegador

Los contratos ejecutables del cliente viven en `src/client/schemas/api.ts` y no
importan Drizzle. El servidor conserva sus schemas derivados de Drizzle. La separación
evita que dependencias de persistencia entren al bundle web.

## Evidencia TDD

El historial actual, después del segundo rebase, conserva estos ciclos:

```text
7dceafa test(frontend): definir reglas de archivos y coordenadas             (Red)
6c4f8fa test(frontend): definir validacion del cliente HTTP                  (Red)
c62d081 feat(frontend): validar archivos coordenadas y respuestas API        (Green)
58de857 test(frontend): definir creacion de cajas en memoria                 (Red)
efd39bd feat(frontend): crear y clasificar cajas en memoria                  (Green)
aa6f467 test(frontend): definir integración real de imágenes [red]           (Red)
ee4a127 feat(frontend): integrar contrato de archivos y paginación [green]    (Green)
2490120 feat(frontend): conectar portal de anotación con la API [green]        (Green)
```

La prueba Red más reciente falló por tres razones esperadas: `total` era opcional,
`images.upload` no existía y `images.fileUrl` no existía. Después del commit Green,
las seis pruebas del cliente HTTP pasaron.

## Verificación automatizada

```text
npm test           65/65 pruebas aprobadas en 9 archivos
npm run typecheck  servidor y frontend sin errores
npm run lint       65 archivos, cero errores y cero advertencias
npm run build      servidor y cliente generados correctamente
```

Build del cliente después de la integración:

```text
index-Cf7uioto.js       107.60 kB (13.73 kB gzip)
validation-Dkz007Fi.js   83.65 kB (23.37 kB gzip)
react-C_SGv67W.js       429.24 kB (130.49 kB gzip)
canvas-BlF8mkTs.js      434.64 kB (129.06 kB gzip)
```

Durante la comprobación, el chunk principal llegó a `547.30 kB` porque la
configuración anterior solo nombraba los puntos de entrada de React y no agrupaba
subrutas como `react/jsx-runtime` y `react-dom/client`. `manualChunks` ahora clasifica
los módulos por su ruta real y separa React, Konva y Zod. El resultado elimina el
aviso de chunks mayores a 500 kB y deja el código propio en `107.60 kB`.

Los avisos restantes corresponden a comentarios internos de Zod que Rollup elimina;
no impiden generar los artefactos ni indican un error del proyecto.

## Verificación con infraestructura real

Se levantaron MariaDB 11.4 y MinIO mediante Docker Compose.

| Prueba | Resultado |
| :----- | :-------- |
| Migraciones versionadas | Aplicadas correctamente en el volumen nuevo |
| MinIO aislado | Objeto de 30 bytes subido y recuperado sin diferencias |
| Seeder, primera ejecución | 5 categorías y 8 imágenes creadas |
| Seeder, segunda ejecución | 8 imágenes omitidas, sin duplicados |
| Proxy Vite `/health` | 200 |
| Listado de imágenes | `total: 8` antes de la carga manual |
| Listado de categorías | `total: 5` |
| Carga multipart | Imagen `id: 9`, 335,825 bytes, estado `pending` |
| Lectura `/api/images/9/file` | 200, `image/jpeg`, 335,825 bytes |
| Crear caja | Anotación `id: 1`, área 38,400 |
| Regla de estado | Imagen 9 cambió a `in_progress` |
| Modificar caja | `x: 200`, `y: 100`, `300 × 180`, área 54,000 |
| Consulta posterior | Devolvió los valores modificados y `total: 1` |

El primer intento manual con `curl.exe` produjo `INVALID_JSON` por el escape de
comillas de PowerShell. Se repitió generando el JSON con `ConvertTo-Json` y la API
respondió correctamente. Este fue un problema del comando de prueba, no del endpoint.

## Verificación visual

Se renderizaron las rutas con Edge en modo headless, esperando seis segundos para que
terminaran las peticiones reales:

| Pantalla | Evidencia observada |
| :------- | :------------------ |
| Bandeja | 9 imágenes reales, miniaturas visibles y conteos por estado |
| Canvas de imagen 9 | Imagen real, 5 categorías y caja persistida de `300 × 180` |
| Carga | formatos, límite de 10 MB, campo multipart y estado inicial visibles |

Las capturas se conservaron fuera del repositorio porque son evidencia personal y no
artefactos requeridos por la aplicación.

## Antes del pull request

Falta realizar un recorrido manual con puntero y selector de archivos:

1. seleccionar y cargar un archivo desde `UploadPage`;
2. abrir el resultado en el canvas;
3. crear, mover y redimensionar una caja con el puntero;
4. recargar con F5 y comprobar que permanece;
5. revisar el comportamiento responsive y los mensajes de error.

No se debe mezclar esta rama mientras ese recorrido no haya sido revisado por una
persona, aunque las pruebas automatizadas y de API estén en verde.
