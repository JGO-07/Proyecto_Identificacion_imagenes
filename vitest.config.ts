import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    // Las pruebas de integración (`*.integration.spec.ts`) necesitan MariaDB y
    // se corren aparte con `npm run test:db`. Aquí se excluyen para que
    // `npm test` sea rápido y sin dependencias externas.
    exclude: [...configDefaults.exclude, '**/*.integration.spec.ts'],
    environment: 'node',
    // Valores ficticios para que `src/lib/env.ts` valide sin abortar durante los
    // tests unitarios. Las pruebas de integración usan el `.env` real.
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
