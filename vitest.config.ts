import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    // Valores ficticios para que `src/lib/env.ts` valide sin abortar durante los
    // tests. Las pruebas de integración mockean la capa de servicios, así que no
    // se abre ninguna conexión real.
    env: {
      DB_HOST: 'localhost',
      DB_NAME: 'test',
      DB_USER: 'test',
      DB_PASSWORD: 'test',
      MINIO_ENDPOINT: 'localhost',
      MINIO_ROOT_USER: 'test',
      MINIO_ROOT_PASSWORD: 'test',
    },
  },
});
