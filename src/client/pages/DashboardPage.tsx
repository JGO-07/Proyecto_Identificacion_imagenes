import { useCallback, useEffect, useState } from 'react';
import { IntegrationBadge } from '../components/IntegrationBadge.js';
import { ApiClientError, apiClient } from '../lib/api-client.js';

type DashboardMetrics = Awaited<ReturnType<typeof apiClient.dashboard.metrics>>['data'];

function errorMessage(cause: unknown) {
  return cause instanceof ApiClientError
    ? cause.message
    : 'No se pudieron consultar las métricas del proyecto.';
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.dashboard.metrics();
      setMetrics(response.data);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <section className="async-state">
        <span className="loading-spinner" />
        <h1>Cargando métricas…</h1>
      </section>
    );
  }

  if (error || !metrics) {
    return (
      <section className="async-state async-state-error" role="alert">
        <span>!</span>
        <h1>Dashboard no disponible</h1>
        <p>{error}</p>
        <button
          className="button button-secondary"
          onClick={() => void loadMetrics()}
          type="button"
        >
          Reintentar
        </button>
      </section>
    );
  }

  const maximumCategoryCount = Math.max(1, ...metrics.objectsByCategory.map((item) => item.count));
  const statusRows = [
    { label: 'Pendientes', count: metrics.images.byStatus.pending, className: 'status-pending' },
    {
      label: 'En progreso',
      count: metrics.images.byStatus.in_progress,
      className: 'status-progress',
    },
    {
      label: 'Completadas',
      count: metrics.images.byStatus.completed,
      className: 'status-completed',
    },
  ];

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Resumen del proyecto</span>
          <h1>Dashboard</h1>
          <p>Métricas calculadas desde la base de datos.</p>
        </div>
        <IntegrationBadge />
      </section>
      <section aria-label="Indicadores principales" className="metrics-grid">
        <article className="metric-card metric-featured">
          <span>Progreso general</span>
          <strong>{metrics.images.progressPct}%</strong>
          <div
            aria-label={`${metrics.images.progressPct}% completado`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={metrics.images.progressPct}
            className="progress-track"
            role="progressbar"
            tabIndex={0}
          >
            <span style={{ width: `${metrics.images.progressPct}%` }} />
          </div>
          <small>
            {metrics.images.byStatus.completed} de {metrics.images.total} imágenes completadas
          </small>
        </article>
        <article className="metric-card">
          <span>Imágenes</span>
          <strong>{metrics.images.total}</strong>
          <small>en el proyecto</small>
        </article>
        <article className="metric-card">
          <span>Anotaciones</span>
          <strong>{metrics.annotations.total}</strong>
          <small>bounding boxes registradas</small>
        </article>
        <article className="metric-card">
          <span>En progreso</span>
          <strong>{metrics.images.byStatus.in_progress}</strong>
          <small>{metrics.images.byStatus.pending} pendientes</small>
        </article>
      </section>
      <section className="dashboard-panels">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Distribución</span>
              <h2>Objetos por clase</h2>
            </div>
            <span className="panel-note">Datos reales</span>
          </div>
          <div className="category-bars">
            {metrics.objectsByCategory.map((category) => (
              <div className="category-bar-row" key={category.categoryId}>
                <span className="legend-dot" style={{ background: category.color }} />
                <span>{category.name}</span>
                <div className="bar-track">
                  <span
                    style={{
                      background: category.color,
                      width: `${(category.count / maximumCategoryCount) * 100}%`,
                    }}
                  />
                </div>
                <strong>{category.count}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Estados</span>
              <h2>Flujo de anotación</h2>
            </div>
          </div>
          <div className="category-bars">
            {statusRows.map((status) => (
              <div className="category-bar-row" key={status.label}>
                <span className={`legend-dot ${status.className}`} />
                <span>{status.label}</span>
                <div className="bar-track">
                  <span
                    className={status.className}
                    style={{
                      width: `${metrics.images.total ? (status.count / metrics.images.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <strong>{status.count}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
