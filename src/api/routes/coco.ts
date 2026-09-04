import type { Context } from 'hono';
import { Hono } from 'hono';
import { buildCocoDataset } from '../../services/coco-export.service.js';

export const cocoRoutes = new Hono();

const CONTENT_DISPOSITION = 'attachment; filename="dataset-coco.json"';

async function exportHandler(c: Context): Promise<Response> {
  const dataset = await buildCocoDataset();
  return c.json(dataset, 200, { 'Content-Disposition': CONTENT_DISPOSITION });
}

/** Ruta principal de descarga del dataset COCO. */
cocoRoutes.get('/export', exportHandler);

/** Alias de conveniencia para el mismo JSON de descarga. */
cocoRoutes.get('/dataset.json', exportHandler);
