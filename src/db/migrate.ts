import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db, pool } from './index.js';

/**
 * Aplica las migraciones versionadas de `drizzle/` a la base de datos.
 * Es idempotente: Drizzle registra cada migración aplicada y solo ejecuta
 * las pendientes, por lo que puede correrse en una BD limpia o una ya migrada.
 * Es la única forma de inicializar el esquema (sin intervención manual).
 */
async function runMigrations(): Promise<void> {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migraciones aplicadas correctamente.');
  } catch (error) {
    console.error('Error al aplicar las migraciones:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void runMigrations();
