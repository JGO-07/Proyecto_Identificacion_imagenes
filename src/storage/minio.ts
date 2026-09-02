import { Client } from 'minio';
import { env } from '../lib/env.js';

/**
 * Cliente oficial de MinIO. Los datos de conexión provienen de `.env`
 * centralizados en `env` (igual que la conexión a MariaDB).
 */
export const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ROOT_USER,
  secretKey: env.MINIO_ROOT_PASSWORD,
});

export const BUCKET_NAME = env.MINIO_BUCKET_NAME;

/**
 * Garantiza que el bucket exista. Si no, lo crea. Pensado para ejecutarse
 * al arrancar (o en el seeder) para que la app nunca asuma un bucket ya creado.
 */
export async function ensureBucket(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME);
    console.log(`Bucket "${BUCKET_NAME}" creado.`);
  }
}
