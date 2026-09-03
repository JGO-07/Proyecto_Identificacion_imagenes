import { Hono } from 'hono';
import * as service from '../../services/dashboard.service.js';

export const dashboardRoutes = new Hono();

/** RN-04: métricas del dashboard, todas agregadas desde la base de datos. */
dashboardRoutes.get('/metrics', async (c) => {
  const data = await service.getDashboardMetrics();
  return c.json({ data });
});
