# Estado del frontend — Rol 3, Fase 2

**Rama:** `feat/phase-2-rol3`

**Base:** merge de Fase 1 en `main` (`0b6688f`)

## Implementado

- finalización persistente y “Finalizar y siguiente”;
- zoom de 50 % a 200 %;
- borrado y deshacer persistentes;
- búsqueda booleana paginada con `AND` y `OR`;
- filtros de servidor por estado, categoría y fechas;
- dashboard con progreso, estados, anotaciones y objetos por categoría;
- estados de carga, error, reintento y resultados vacíos.

El historial de deshacer contiene operaciones confirmadas por la API. Deshacer ejecuta
la operación inversa en el servidor, no solo en la vista. El dashboard consume una
respuesta agregada y no calcula métricas descargando páginas parciales.

## Verificación

```text
npm test           68/68 pruebas aprobadas
npm run typecheck  sin errores
npm run lint       65 archivos sin errores
npm run build      aprobado; ningún chunk supera 500 kB
```

## Dependencia pendiente

`/api/search`, `/api/dashboard/metrics` y los filtros de `/api/images` están en
`origin/feat/phase-2-rol2`, todavía sin mezclar en `main`. El frontend se implementó
según ese contrato y se probó con respuestas HTTP simuladas. La prueba integrada real
requiere el merge del Rol 2 y después rebasar esta rama sobre el nuevo `main`.

La prueba manual de finalización no concluyó porque Docker Desktop se cerró. El log
mostró `ECONNREFUSED` de MariaDB, no un rechazo del contrato HTTP.
