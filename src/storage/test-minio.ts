import { BUCKET_NAME, ensureBucket, minioClient } from './minio.js';

/**
 * Script aislado para validar el flujo de almacenamiento con MinIO:
 * garantiza el bucket, sube un buffer dummy y luego lo recupera y compara.
 * Uso: npm run storage:test
 */
async function runTest(): Promise<void> {
  const objectName = 'storage-test/dummy.txt';
  const payload = Buffer.from('contenido de prueba para minio', 'utf8');

  await ensureBucket();
  console.log(`Subiendo objeto "s3://${BUCKET_NAME}/${objectName}"...`);
  await minioClient.putObject(BUCKET_NAME, objectName, payload, payload.length);

  console.log('Recuperando objeto...');
  const stream = await minioClient.getObject(BUCKET_NAME, objectName);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  const recovered = Buffer.concat(chunks);

  const stat = await minioClient.statObject(BUCKET_NAME, objectName);
  console.log(`Tamaño esperado: ${payload.length} bytes`);
  console.log(`Tamaño real (statObject): ${stat.size} bytes`);
  console.log(`Contenido recuperado: ${recovered.toString('utf8')}`);

  if (stat.size !== payload.length) {
    throw new Error(`Tamaño inesperado: ${stat.size} != ${payload.length}`);
  }
  if (!recovered.equals(payload)) {
    throw new Error('El contenido recuperado no coincide con el subido.');
  }

  console.log('Almacenamiento OK: el objeto se subió y recuperó correctamente.');
}

void runTest().catch((error) => {
  console.error('Error en la prueba de almacenamiento:');
  console.error(error);
  process.exit(1);
});
