import { DemoBadge } from '../components/DemoBadge.js';
import { useAnnotationStore } from '../store/annotation-store.js';

export function DashboardPage() {
  const images = useAnnotationStore((state) => state.images);
  const categories = useAnnotationStore((state) => state.categories);
  const annotations = useAnnotationStore((state) => state.annotations);
  const completed = images.filter((image) => image.status === 'completed').length;
  const progress = images.length === 0 ? 0 : Math.round((completed / images.length) * 100);

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Resumen del proyecto</span>
          <h1>Dashboard</h1>
          <p>Estructura preliminar de las métricas que se conectarán en Fase 2.</p>
        </div>
        <DemoBadge />
      </section>

      <section aria-label="Indicadores principales" className="metrics-grid">
        <article className="metric-card metric-featured">
          <span>Progreso general</span>
          <strong>{progress}%</strong>
          <div
            aria-label={`${progress}% completado`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="progress-track"
            role="progressbar"
            tabIndex={0}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <small>
            {completed} de {images.length} imágenes completadas
          </small>
        </article>
        <article className="metric-card">
          <span>Imágenes</span>
          <strong>{images.length}</strong>
          <small>en el conjunto actual</small>
        </article>
        <article className="metric-card">
          <span>Anotaciones</span>
          <strong>{annotations.length}</strong>
          <small>bounding boxes registradas</small>
        </article>
        <article className="metric-card">
          <span>Categorías</span>
          <strong>{categories.length}</strong>
          <small>clases disponibles</small>
        </article>
      </section>

      <section className="dashboard-panels">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Distribución</span>
              <h2>Objetos por clase</h2>
            </div>
            <span className="panel-note">Vista preliminar</span>
          </div>
          <div className="category-bars">
            {categories.map((category) => {
              const count = annotations.filter(
                (annotation) => annotation.categoryId === category.id,
              ).length;
              const width = annotations.length === 0 ? 0 : (count / annotations.length) * 100;
              return (
                <div className="category-bar-row" key={category.id}>
                  <span className="legend-dot" style={{ background: category.color }} />
                  <span>{category.name}</span>
                  <div className="bar-track">
                    <span style={{ background: category.color, width: `${width}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel next-steps-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Integración</span>
              <h2>Próximos pasos</h2>
            </div>
          </div>
          <ol className="steps-list">
            <li className="done">
              <span>1</span>
              <div>
                <strong>Estructura visual</strong>
                <small>Componentes y navegación de Fase 0</small>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Conectar métricas</strong>
                <small>Esperando `/api/dashboard/metrics`</small>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Agregar búsqueda</strong>
                <small>Filtros y operadores SQL en Fase 2</small>
              </div>
            </li>
          </ol>
        </article>
      </section>
    </div>
  );
}
