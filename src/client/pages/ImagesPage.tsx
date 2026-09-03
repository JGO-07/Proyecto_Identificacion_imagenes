import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IntegrationBadge } from '../components/IntegrationBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ApiClientError, apiClient } from '../lib/api-client.js';
import type { ApiImage, ImageStatus, Pagination } from '../types/api.js';

type StatusFilter = 'all' | ImageStatus;

const PAGE_SIZE = 12;
const filters: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'En progreso', value: 'in_progress' },
  { label: 'Completadas', value: 'completed' },
];

function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function errorMessage(cause: unknown) {
  return cause instanceof ApiClientError
    ? cause.message
    : 'No se pudo consultar la bandeja. Comprueba que la API esté disponible.';
}

function ImagePreview({ image }: { image: ApiImage }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="image-preview">
      {failed ? (
        <div className="image-preview-error" role="img" aria-label="Vista previa no disponible">
          <span aria-hidden="true">!</span>
          Vista previa no disponible
        </div>
      ) : (
        <img
          alt={`Vista previa de ${image.originalName}`}
          loading="lazy"
          onError={() => setFailed(true)}
          src={apiClient.images.fileUrl(image.id)}
        />
      )}
      <StatusBadge status={image.status} />
    </div>
  );
}

export function ImagesPage() {
  const [images, setImages] = useState<ApiImage[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    limit: PAGE_SIZE,
    offset: 0,
    total: 0,
  });
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.images.list({ limit: PAGE_SIZE, offset });
      setImages(response.data);
      setPagination(response.pagination);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const visibleImages = useMemo(
    () => images.filter((image) => filter === 'all' || image.status === filter),
    [filter, images],
  );
  const hasPrevious = pagination.offset > 0;
  const hasNext = pagination.offset + pagination.limit < pagination.total;

  return (
    <div className="page-wrap">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Biblioteca del proyecto</span>
          <h1>Tus imágenes</h1>
          <p>Selecciona una imagen para comenzar o continuar con sus anotaciones.</p>
        </div>
        <div className="heading-actions">
          <IntegrationBadge />
          <Link className="button button-primary" to="/upload">
            <span aria-hidden="true">＋</span>
            Cargar imágenes
          </Link>
        </div>
      </section>

      <section aria-label="Resumen de imágenes" className="summary-strip">
        <div>
          <strong>{pagination.total}</strong>
          <span>Total en el proyecto</span>
        </div>
        <div>
          <strong>{images.filter((image) => image.status === 'pending').length}</strong>
          <span>Pendientes en esta página</span>
        </div>
        <div>
          <strong>{images.filter((image) => image.status === 'in_progress').length}</strong>
          <span>En progreso en esta página</span>
        </div>
        <div>
          <strong>{images.filter((image) => image.status === 'completed').length}</strong>
          <span>Completadas en esta página</span>
        </div>
      </section>

      <div className="filter-row">
        <fieldset className="segmented-control">
          <legend className="visually-hidden">Filtrar imágenes por estado en esta página</legend>
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
          {visibleImages.length} {visibleImages.length === 1 ? 'resultado' : 'resultados'} en esta
          página
        </span>
      </div>

      {error ? (
        <section className="async-state async-state-error" role="alert">
          <span aria-hidden="true">!</span>
          <h2>No se pudieron cargar las imágenes</h2>
          <p>{error}</p>
          <button
            className="button button-secondary"
            onClick={() => void loadImages()}
            type="button"
          >
            Reintentar
          </button>
        </section>
      ) : loading ? (
        <section aria-live="polite" className="async-state">
          <span aria-hidden="true" className="loading-spinner" />
          <h2>Cargando imágenes…</h2>
          <p>Consultando la información persistida en el servidor.</p>
        </section>
      ) : visibleImages.length > 0 ? (
        <>
          <section aria-label="Imágenes disponibles" className="image-grid">
            {visibleImages.map((image) => (
              <article className="image-card" key={image.id}>
                <ImagePreview image={image} />
                <div className="image-card-body">
                  <div>
                    <h2>{image.originalName}</h2>
                    <p>
                      {image.width} × {image.height} px · {formatMegabytes(image.sizeBytes)}
                    </p>
                  </div>
                  <div className="card-meta">
                    <span>Registro #{image.id}</span>
                    <Link className="button button-secondary" to={`/annotate/${image.id}`}>
                      {image.status === 'pending' ? 'Anotar' : 'Abrir'}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
          <nav aria-label="Paginación de imágenes" className="pagination-row">
            <button
              className="button button-ghost"
              disabled={!hasPrevious}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              type="button"
            >
              ← Anterior
            </button>
            <span>
              {pagination.total === 0 ? 0 : pagination.offset + 1}–
              {Math.min(pagination.offset + images.length, pagination.total)} de {pagination.total}
            </span>
            <button
              className="button button-ghost"
              disabled={!hasNext}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              type="button"
            >
              Siguiente →
            </button>
          </nav>
        </>
      ) : (
        <section className="empty-state">
          <span aria-hidden="true" className="empty-icon">
            ◫
          </span>
          <h2>
            {images.length === 0 ? 'Todavía no hay imágenes' : 'No hay imágenes con este estado'}
          </h2>
          <p>
            {images.length === 0
              ? 'Carga la primera imagen para comenzar a anotar.'
              : 'Prueba otro filtro dentro de esta página.'}
          </p>
          {images.length === 0 ? (
            <Link className="button button-primary" to="/upload">
              Cargar una imagen
            </Link>
          ) : (
            <button
              className="button button-secondary"
              onClick={() => setFilter('all')}
              type="button"
            >
              Mostrar todas
            </button>
          )}
        </section>
      )}
    </div>
  );
}
