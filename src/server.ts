import { serve } from '@hono/node-server';
import { app } from './api/app.js';
import { env } from './lib/env.js';

const port = env.NODE_ENV === 'production' ? env.PROD_PORT : env.PORT;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`API de anotación escuchando en http://localhost:${info.port} (${env.NODE_ENV})`);
});
