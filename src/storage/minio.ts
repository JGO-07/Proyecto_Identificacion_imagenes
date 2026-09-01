import dotenv from 'dotenv';
import { Client } from 'minio';

dotenv.config();

export const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: Number.parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minio_admin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minio_secure_password',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'annotation-images';
