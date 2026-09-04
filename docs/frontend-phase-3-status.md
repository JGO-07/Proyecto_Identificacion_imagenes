# Estado del frontend — Rol 3, Fase 3

**Rama:** `feat/phase-3-rol3`

**Base:** cierre de Fase 3 del Rol 1 y Rol 2 en `main` (`947505c`)

## Trabajo del Rol 3 completado

- se revisaron nombres, capas y estructura de carpetas de todo el repositorio;
- se retiraron componentes, datos, pruebas y estilos del prototipo simulado que ninguna
  ruta de producción utilizaba;
- se eliminó Zustand porque solo sostenía ese prototipo y ya no era una dependencia
  real de la aplicación;
- se corrigió la trazabilidad de `annotation-canvas.feature` para indicar que cubre las
  Fases 1 y 2;
- se revisó y aprobó `frontend-dashboard-search.feature`, que documenta las
  interacciones de dashboard, búsqueda, filtros, deshacer y zoom de Fase 2;
- se amplió `.gitignore` para impedir que se versionen binarios de imagen.
- se corrigió `npm start` para Windows, macOS y Linux mediante `cross-env`, de modo
  que el modo producción seleccione `NODE_ENV=production` de forma consistente.

La organización que permanece es coherente con el tipo de archivo: componentes y
páginas React usan `PascalCase`; utilidades, schemas y servicios usan nombres en
minúsculas con guiones; las pruebas están junto al módulo que verifican; documentos y
fichas Gherkin viven fuera de `src`.

## Verificación

```text
npm test           107/107 pruebas aprobadas
npm run typecheck  sin errores
npm run lint       75 archivos, cero errores y cero advertencias
npm run build      aprobado
npm run test:db    2/2 pruebas contra MariaDB aprobadas
git diff --check   sin errores de espacios
```

`git ls-files` no devuelve `node_modules`, `dist`, `.env` ni archivos con extensiones
de imagen. `.env`, `dist/`, `node_modules/` y `data/dataset-src/` aparecen como
ignorados. El historial tampoco contiene un archivo `.env` real.

El build en modo `production` escucha correctamente en `3100`; `/health`, `/` y la
ruta SPA `/images` devuelven `200`. El servidor Hono sirve `dist/client` y el
frontend y la API comparten el mismo proceso de producción.

La exportación `GET /api/coco/export` devolvió un adjunto JSON con 9 imágenes, 10
anotaciones y 5 categorías. Se verificó que todas las referencias cruzadas existen,
que cada `bbox` tiene cuatro valores, que `area` coincide con ancho × alto y que
`iscrowd` es válido.

## Integración de los bloqueos transversales

1. **Rol 1 — COCO:** integrado con endpoint descargable, migración, seeder, Gherkin y
   seis pruebas específicas, incluidas pruebas de mutación.
2. **Rol 2 — Monolito de producción:** integrado; `npm start` sirve API y SPA en
   `3100`.
3. **Rol 1 / equipo — README:** integrado `npm run setup`, que espera Docker, aplica
   migraciones y ejecuta el seeder en orden.

## Prueba desde clon limpio

Se creó un clon temporal sin `.env`, dependencias ni volúmenes previos. Se siguieron
literalmente los pasos del README: copiar `.env.example`, `npm install`, `npm run
setup` y `npm run dev`. El setup creó volúmenes nuevos, esperó los healthchecks,
aplicó las migraciones y sembró el dataset sin pasos manuales. La API respondió
`200` en `:3000`, el portal HTML respondió `200` en `:5173`, `npm run test:db` pasó
2/2 y `GET /api/coco/export` devolvió el adjunto esperado (8 imágenes, 3 anotaciones
y 5 categorías de un dataset recién sembrado).

**Conclusión:** el punto de convergencia final y la Fase 3 están completos para el
Rol 3. El clon, sus contenedores, volúmenes y logs temporales se eliminaron; MariaDB y
MinIO del entorno de trabajo original se restauraron conservando sus volúmenes.
