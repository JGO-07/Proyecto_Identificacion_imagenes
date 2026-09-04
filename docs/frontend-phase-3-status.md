# Estado del frontend — Rol 3, Fase 3

**Rama:** `feat/phase-3-rol3`

**Base:** merge de Fase 2 del Rol 3 en `main` (`068e5e9`)

## Trabajo del Rol 3 completado

- se revisaron nombres, capas y estructura de carpetas de todo el repositorio;
- se retiraron componentes, datos, pruebas y estilos del prototipo simulado que ninguna
  ruta de producción utilizaba;
- se eliminó Zustand porque solo sostenía ese prototipo y ya no era una dependencia
  real de la aplicación;
- se corrigió la trazabilidad de `annotation-canvas.feature` para indicar que cubre las
  Fases 1 y 2;
- se amplió `.gitignore` para impedir que se versionen binarios de imagen.

La organización que permanece es coherente con el tipo de archivo: componentes y
páginas React usan `PascalCase`; utilidades, schemas y servicios usan nombres en
minúsculas con guiones; las pruebas están junto al módulo que verifican; documentos y
fichas Gherkin viven fuera de `src`.

## Verificación

```text
npm test           95/95 pruebas aprobadas
npm run typecheck  sin errores
npm run lint       72 archivos, cero errores y cero advertencias
npm run build      aprobado
npm run test:db    2/2 pruebas contra MariaDB aprobadas
git diff --check   sin errores de espacios
```

`git ls-files` no devuelve `node_modules`, `dist`, `.env` ni archivos con extensiones
de imagen. `.env`, `dist/`, `node_modules/` y `data/dataset-src/` aparecen como
ignorados. El historial tampoco contiene un archivo `.env` real.

El build en modo `production` escucha correctamente en `3100` y `/health` devuelve
estado `ok`. Esta prueba también reveló que la ruta `/` responde `404`; el servidor
Hono no sirve todavía el contenido generado en `dist/client`.

## Bloqueos transversales para cerrar la Fase 3 del equipo

1. **Rol 1 — Exportación COCO:** `main` no contiene `/api/export/coco`, generador,
   descarga ni pruebas COCO. Sin ese merge no pueden ejecutarse las pruebas finales de
   ids, `bbox`, `area` e `iscrowd`.
2. **Rol 2 — Monolito de producción:** `npm start` levanta la API en `3100`, pero no
   entrega el frontend de `dist/client`; `/` devuelve `404 NOT_FOUND`.
3. **Rol 1 / equipo — README y clon limpio:** las instrucciones levantan Docker pero
   no incluyen migraciones ni seeder dentro del recorrido de arranque. Deben corregirse
   y luego repetirse literalmente desde un clon y volúmenes nuevos.

Por estas dependencias, la parte técnica del Rol 3 está lista, pero el punto de
convergencia final de la Fase 3 no debe marcarse como terminado todavía.
