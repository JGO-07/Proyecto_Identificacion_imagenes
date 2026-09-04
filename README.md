# Proyecto_Identificacion_imagenes

Monolito para etiquetado y anotación de imágenes con soporte de exportación en formato COCO.

Arquitectura: aplicación monolítica en TypeScript (strict) + Drizzle ORM sobre MariaDB
para metadatos relacionales, y MinIO (S3-compatible) para los archivos binarios de imagen.

## Requisitos previos

- Node.js v20 o superior
- npm v10 o superior
- Docker y Docker Compose (v2)

## Puesta en marcha desde cero

El siguiente flujo replica exactamente lo que hace un evaluador desde un clon
limpio. No hay pasos implícitos ni comandos omitidos: cada una de las etapas es
obligatoria y en ese orden.

1. Clonar el repositorio y entrar a la carpeta:

   ```bash
   git clone https://github.com/JGO-07/Proyecto_Identificacion_imagenes.git
   cd Proyecto_Identificacion_imagenes
   ```

2. Crear el archivo de variables de entorno a partir de la plantilla:

   ```bash
   cp .env.example .env
   ```

   Los valores por defecto de `.env.example` funcionan para el entorno local;
   no se versiona ningún `.env` real ni se requiere ajustar credenciales.

3. Instalar dependencias:

   ```bash
   npm install
   ```

4. Levantar y preparar todo con un solo comando:

   ```bash
   npm run setup
   ```

   `npm run setup` es el punto único de arranque: levanta los contenedores
   (MariaDB + MinIO) con healthcheck, **espera** a que MariaDB reporte estado
   `healthy` (`docker compose up -d --wait`), aplica las migraciones
   versionadas de Drizzle (`db:migrate`) y ejecuta el seeder idempotente
   (`db:seed`).
   > La primera ejecución requiere conexión a internet para descargar las
   > imágenes de Docker y el dataset a MinIO; en ejecuciones posteriores el
   > seeder lee el cache local y no re-descarga.

5. Arrancar la aplicación:

   ```bash
   npm run dev
   ```

   La API de Hono queda escuchando en `http://localhost:3000` y el frontend de
   Vite en `http://localhost:5173`. Para levantar solo la API usa
   `npm run dev:api`; para solo el frontend, `npm run dev:web`.

## Puertos de la aplicación

| Entorno       | Variable    | Puerto |
| ------------- | ----------- | ------ |
| Desarrollo    | `PORT`      | `3000` |
| Producción    | `PROD_PORT` | `3100` |

## Verificación rápida

| Comando       | Qué verifica                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| `npm run typecheck` | Compila servidor y frontend en modo estricto (TypeScript, 0 errores).   |
| `npm run lint` | Ejecuta Biome sobre todo el repo (0 errores y 0 advertencias).               |
| `npm test`     | Corre la suite de Vitest (unidades, servicios, esquemas y API).              |
| `npm run setup` | Valida arranque de contenedores + migraciones + seeder idempotente.        |
| `GET /api/coco/export` | Descarga el dataset en formato COCO con `Content-Disposition: attachment; filename="dataset-coco.json"`. |

## Cómo levantar el proyecto

El frontend usa Vite en `http://localhost:5173` y redirige las rutas
`/api` al servidor Hono en `http://localhost:3000`.

```bash
npm run dev              # levanta API (:3000) y frontend (:5173)
npm run dev:api          # levanta solo la API
npm run dev:web          # levanta solo Vite; bandeja, carga y anotación requieren la API
npm run typecheck        # verifica servidor y frontend con TypeScript
npm run build            # compila servidor y genera dist/client
npm run db:migrate       # (Fase 1) aplica las migraciones versionadas de Drizzle
npm run db:seed          # (Fase 1) carga categorías e imágenes de ejemplo (idempotente)
```

> La bandeja, la carga, el canvas y el dashboard consumen la API real. El dashboard
> obtiene sus agregados desde `GET /api/dashboard/metrics`.

### Avance de Fase 1 — Rol 3

La rama de Fase 1 incluye carga multipart con feedback, bandeja paginada, categorías
reales y creación, movimiento y redimensionamiento persistentes. El canvas muestra el
binario mediante `GET /api/images/:id/file`; nunca usa directamente la llave interna
de MinIO. Las respuestas externas se validan con Zod antes de llegar a la UI.

Consulta [`docs/frontend-phase-1-status.md`](docs/frontend-phase-1-status.md) para
ver la evidencia, las pruebas y los puntos de integración pendientes.

### Avance de Fase 2 — Rol 3

La rama de Fase 2 agrega finalizar y avanzar, zoom, borrado y deshacer persistentes,
búsqueda/filtros de servidor y dashboard con métricas reales. Consulta
[`docs/frontend-phase-2-status.md`](docs/frontend-phase-2-status.md) para conocer la
verificación integrada con MariaDB y los endpoints del Rol 2.

## Estructura del proyecto

```
.
├── docker-compose.yml     # MariaDB + MinIO
├── .env.example           # plantilla de variables de entorno (sin secretos reales)
├── docs/
│   ├── data-model.md      # modelo de datos acordado por el equipo (Sync 1)
│   ├── frontend-flow.md   # flujo, wireframes y estados de las pantallas
│   └── frontend-api-contract.md # contrato consumido por el frontend
├── features/
│   └── annotation-canvas.feature # escenarios persistentes del canvas del Rol 3
├── src/
│   ├── client/            # aplicación React y portal de anotación
│   ├── db/
│   │   ├── index.ts       # cliente Drizzle → MariaDB (Fase 1)
│   │   ├── schema.ts      # esquema Drizzle final
│   │   └── seed.ts        # seeder idempotente (Fase 1)
│   └── storage/
│       └── minio.ts       # cliente MinIO
├── tsconfig.json          # TypeScript strict del servidor
└── tsconfig.client.json   # TypeScript strict del frontend
```

## Convenciones

Las convenciones de nomenclatura de tablas, columnas, claves foráneas y buckets
están documentadas en [`docs/data-model.md`](docs/data-model.md).
