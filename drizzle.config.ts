import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Lee una variable de entorno obligatoria. Si falta, aborta con un error
 * claro en lugar de silenciar la conexión con un valor quemado.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa tu archivo .env`);
  }
  return value;
}

/**
 * Configuración de Drizzle para MariaDB (dialect mysql).
 * Los datos de conexión se leen del entorno (.env) — sin valores por defecto
 * hardcodeados — por lo que el mismo config funciona en dev y CI.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: required('DB_HOST'),
    port: Number.parseInt(required('DB_PORT'), 10),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    database: required('DB_NAME'),
  },
});
