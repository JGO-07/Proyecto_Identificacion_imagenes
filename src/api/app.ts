import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { ZodError } from 'zod';
import { AppError } from './errors.js';
import { annotationsRoutes } from './routes/annotations.js';
import { categoriesRoutes } from './routes/categories.js';
import { cocoRoutes } from './routes/coco.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { healthRoutes } from './routes/health.js';
import { imagesRoutes } from './routes/images.js';
import { searchRoutes } from './routes/search.js';

/**
 * Esqueleto de la API. Solo ensambla capas HTTP (routing + formato de
 * error/respuesta). La lógica de negocio vive en `src/services` y el acceso a
 * datos en `src/db`; este archivo no importa nada de `drizzle` ni de `minio`.
 */
export const app = new Hono();

app.route('/health', healthRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/images', imagesRoutes);
app.route('/api/annotations', annotationsRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/coco', cocoRoutes);

/**
 * Frontend compilado (producción). `npm start` sirve `dist/client` además de la
 * API en el mismo puerto. Todo lo que no empiece por `/api` o `/health` se
 * resuelve como archivo estático y, si no existe, como `index.html` para que
 * funcione el enrutado del SPA en el cliente. En desarrollo esa carpeta no
 * existe y estas rutas simplemente caen al 404 (Vite sirve el frontend aparte).
 */
const FRONTEND_DIR = './dist/client';
const isApiPath = (path: string): boolean =>
  path === '/health' || path.startsWith('/health/') || path.startsWith('/api');

app.use('*', (c, next) =>
  isApiPath(c.req.path) ? next() : serveStatic({ root: FRONTEND_DIR })(c, next),
);
app.get('*', (c, next) =>
  isApiPath(c.req.path) ? next() : serveStatic({ path: `${FRONTEND_DIR}/index.html` })(c, next),
);

app.notFound((c) =>
  c.json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } }, 404),
);

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.status,
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos',
          details: err.issues,
        },
      },
      400,
    );
  }

  console.error('Error no controlado:', err);
  return c.json({ error: { code: 'INTERNAL', message: 'Error interno del servidor' } }, 500);
});
