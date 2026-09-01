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

> Los pasos de migración, seeder y arranque del servidor se implementan en la Fase 1.
> Esta sección deja los comandos previstos como referencia (placeholders).

```bash
npm run typecheck        # verifica el proyecto con tsc --noEmit
npm run db:migrate       # (Fase 1) aplica las migraciones versionadas de Drizzle
npm run db:seed          # (Fase 1) carga categorías e imágenes de ejemplo (idempotente)
npm run dev              # (Fase 1) arranca la app en http://localhost:3000
```

## Estructura del proyecto

```
.
├── docker-compose.yml     # MariaDB + MinIO
├── .env.example           # plantilla de variables de entorno (sin secretos reales)
├── docs/
│   └── data-model.md      # modelo de datos acordado por el equipo (Sync 1)
├── src/
│   ├── db/
│   │   ├── index.ts       # cliente Drizzle → MariaDB (Fase 1)
│   │   ├── schema.ts      # esquema Drizzle (borrador Sync 1)
│   │   └── seed.ts        # seeder idempotente (Fase 1)
│   └── storage/
│       └── minio.ts       # cliente MinIO
└── tsconfig.json          # TypeScript en modo strict
```

## Convenciones

Las convenciones de nomenclatura de tablas, columnas, claves foráneas y buckets
están documentadas en [`docs/data-model.md`](docs/data-model.md).
