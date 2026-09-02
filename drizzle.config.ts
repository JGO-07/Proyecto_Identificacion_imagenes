import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Configuración de Drizzle para MariaDB (dialect mysql).
 * Los datos de conexión se leen del entorno (.env) por lo que el mismo
 * config funciona en desarrollo y CI sin cambios.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '3306', 10),
    user: process.env.DB_USER ?? 'app_user',
    password: process.env.DB_PASSWORD ?? 'app_secure_password',
    database: process.env.DB_NAME ?? 'image_annotation_db',
  },
});
