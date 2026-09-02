import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
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
        manualChunks: {
          canvas: ['konva', 'react-konva'],
          react: ['react', 'react-dom', 'react-router-dom', 'zustand'],
        },
      },
    },
  },
});
