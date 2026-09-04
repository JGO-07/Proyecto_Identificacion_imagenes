import { tmpdir } from 'node:os';
import { join } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Evita bloqueos de OneDrive sobre node_modules/.vite durante la optimización.
  cacheDir: join(tmpdir(), 'proyecto-identificacion-imagenes-vite'),
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/konva/') || id.includes('/node_modules/react-konva/')) {
            return 'canvas';
          }

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router')
          ) {
            return 'react';
          }

          if (id.includes('/node_modules/zod/')) {
            return 'validation';
          }
        },
      },
    },
  },
});
