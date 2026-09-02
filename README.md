# Proyecto_Identificacion_imagenes

Monolito para etiquetado y anotación de imágenes con soporte de exportación en formato COCO.

Arquitectura: aplicación monolítica en TypeScript (strict) + Drizzle ORM sobre MariaDB
para metadatos relacionales, y MinIO (S3-compatible) para los archivos binarios de imagen.

## Requisitos previos

- Node.js v20 o superior
- npm v10 o superior
- Docker y Docker Compose (v2)

## Configuración del entorno

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/JGO-07/Proyecto_Identificacion_imagenes.git
   cd Proyecto_Identificacion_imagenes
   ```

2. Crear el archivo de variables de entorno a partir de la plantilla:

   ```bash
   cp .env.example .env
   ```

   `.env.example` contiene **solo valores de ejemplo**. Ajusta credenciales y puertos
   según tu entorno; no se versiona ningún `.env` real.

3. Instalar dependencias:

   ```bash
   npm install
   ```

4. Levantar la infraestructura (MariaDB + MinIO):

   ```bash
   docker compose up -d
   ```

   Esto expone:

   | Servicio          | Puerto local (por defecto) |
   | ----------------- | -------------------------- |
   | MariaDB           | `3306`                     |
   | MinIO (API S3)    | `9000`                     |
   | MinIO (consola)   | `9001`                     |

## Puertos de la aplicación

| Entorno       | Variable    | Puerto |
| ------------- | ----------- | ------ |
| Desarrollo    | `PORT`      | `3000` |
| Producción    | `PROD_PORT` | `3100` |

## Cómo levantar el proyecto

La Fase 0 del frontend usa Vite en `http://localhost:5173` y redirige las rutas
`/api` al servidor Hono en `http://localhost:3000`.

```bash
npm run dev              # levanta API (:3000) y frontend (:5173)
npm run dev:api          # levanta solo la API
npm run dev:web          # levanta solo el frontend con datos simulados
npm run typecheck        # verifica servidor y frontend con TypeScript
npm run build            # compila servidor y genera dist/client
npm run db:migrate       # (Fase 1) aplica las migraciones versionadas de Drizzle
npm run db:seed          # (Fase 1) carga categorías e imágenes de ejemplo (idempotente)
```

> En Fase 0 las pantallas y el canvas usan datos simulados identificados en la UI.
> La carga multipart y la persistencia de anotaciones se conectan en Fase 1.

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
│   └── annotation-canvas.feature # escenarios del canvas del Rol 3
├── src/
│   ├── client/            # aplicación React y prototipo de anotación
│   ├── db/
│   │   ├── index.ts       # cliente Drizzle → MariaDB (Fase 1)
│   │   ├── schema.ts      # esquema Drizzle (borrador Sync 1)
│   │   └── seed.ts        # seeder idempotente (Fase 1)
│   └── storage/
│       └── minio.ts       # cliente MinIO
├── tsconfig.json          # TypeScript strict del servidor
└── tsconfig.client.json   # TypeScript strict del frontend
```

## Convenciones

Las convenciones de nomenclatura de tablas, columnas, claves foráneas y buckets
están documentadas en [`docs/data-model.md`](docs/data-model.md).
