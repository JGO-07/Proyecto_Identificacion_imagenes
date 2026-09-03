import { defineConfig } from 'vitest/config';

/**
 * Pruebas de integración contra MariaDB real. Usan el `.env` del proyecto
 * (cargado por `src/lib/env.ts`). Requieren `docker compose up -d`.
 * Ejecutar con: `npm run test:db`.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.integration.spec.ts'],
    environment: 'node',
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
