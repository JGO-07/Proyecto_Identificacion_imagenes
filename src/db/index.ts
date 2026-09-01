import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { env } from '../lib/env.js';
import * as schema from './schema.js';

/**
 * Cliente Drizzle -> MariaDB. Es la única puerta de acceso a la base de datos;
 * la capa de servicios lo consume y la capa HTTP nunca lo toca directamente.
 */
export const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  connectionLimit: 10,
  namedPlaceholders: true,
});

export const db = drizzle(pool, { schema, mode: 'default' });

export type Database = typeof db;
