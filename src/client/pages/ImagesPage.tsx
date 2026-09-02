import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DemoBadge } from '../components/DemoBadge.js';
import { MockScene } from '../components/MockScene.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { useAnnotationStore } from '../store/annotation-store.js';
import type { ImageStatus } from '../types/api.js';

type StatusFilter = 'all' | ImageStatus;

const filters: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completadas', value: 'completed' },
];

function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function ImagesPage() {
  const images = useAnnotationStore((state) => state.images);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const visibleImages = useMemo(
    () => images.filter((image) => filter === 'all' || image.status === filter),
    [filter, images],
  );

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Biblioteca del proyecto</span>
          <h1>Tus imágenes</h1>
          <p>Selecciona una imagen para comenzar o continuar con sus anotaciones.</p>
        </div>
        <div className="heading-actions">
          <DemoBadge />
          <Link className="button button-primary" to="/upload">
            <span aria-hidden="true">＋</span>
            Cargar imágenes
          </Link>
        </div>
      </section>

      <section aria-label="Resumen de imágenes" className="summary-strip">
        <div>
          <strong>{images.length}</strong>
          <span>Total</span>
        </div>
        <div>
          <strong>{images.filter((image) => image.status === 'pending').length}</strong>
          <span>Pendientes</span>
        </div>
        <div>
          <strong>{images.filter((image) => image.status === 'in_progress').length}</strong>
          <span>En progreso</span>
        </div>
        <div>
          <strong>{images.filter((image) => image.status === 'completed').length}</strong>
          <span>Completadas</span>
        </div>
      </section>

      <div className="filter-row">
        <fieldset className="segmented-control">
          <legend className="visually-hidden">Filtrar imágenes por estado</legend>
          {filters.map((item) => (
            <button
              className={filter === item.value ? 'selected' : undefined}
              key={item.value}
              onClick={() => setFilter(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </fieldset>
        <span className="result-count">
          {visibleImages.length} {visibleImages.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {visibleImages.length > 0 ? (
        <section aria-label="Imágenes disponibles" className="image-grid">
          {visibleImages.map((image) => (
            <article className="image-card" key={image.id}>
              <div className="image-preview">
                <MockScene compact scene={image.scene} />
                <StatusBadge status={image.status} />
              </div>
              <div className="image-card-body">
                <div>
                  <h2>{image.originalName}</h2>
                  <p>
                    {image.width} × {image.height} px · {formatMegabytes(image.sizeBytes)}
                  </p>
                </div>
                <div className="card-meta">
                  <span>
                    <strong>{image.annotationCount}</strong>{' '}
                    {image.annotationCount === 1 ? 'anotación' : 'anotaciones'}
                  </span>
                  <Link className="button button-secondary" to={`/annotate/${image.id}`}>
                    {image.status === 'pending' ? 'Anotar' : 'Abrir'}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <span aria-hidden="true" className="empty-icon">
            ◫
          </span>
          <h2>No hay imágenes con este estado</h2>
          <p>Prueba otro filtro o carga una imagen nueva para comenzar.</p>
          <button
            className="button button-secondary"
            onClick={() => setFilter('all')}
            type="button"
          >
            Mostrar todas
          </button>
        </section>
      )}
    </div>
  );
}
