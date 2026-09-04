import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IntegrationBadge } from '../components/IntegrationBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ApiClientError, apiClient } from '../lib/api-client.js';
import type { ApiCategory, ApiImage, ImageStatus, Pagination } from '../types/api.js';

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
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = appliedQuery
        ? await apiClient.search.list(appliedQuery, { limit: PAGE_SIZE, offset })
        : await apiClient.images.list({
            limit: PAGE_SIZE,
            offset,
            status: filter === 'all' ? undefined : filter,
            categoryId: categoryId ? Number(categoryId) : undefined,
            from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
            to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
          });
      setImages(response.data);
      setPagination(response.pagination);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [appliedQuery, categoryId, filter, from, offset, to]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  useEffect(() => {
    void apiClient.categories
      .list({ limit: 100 })
      .then((response) => setCategories(response.data))
      .catch(() => setCategories([]));
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOffset(0);
    setAppliedQuery(query.trim());
  };

  const clearSearch = () => {
    setQuery('');
    setAppliedQuery('');
    setOffset(0);
  };
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

      <form className="search-filter-panel" onSubmit={handleSearch}>
        <label className="search-field">
          <span>Buscar por clases</span>
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="car AND person"
            type="search"
            value={query}
          />
        </label>
        <button className="button button-primary" type="submit">
          Buscar
        </button>
        {appliedQuery && (
          <button className="button button-ghost" onClick={clearSearch} type="button">
            Limpiar búsqueda
          </button>
        )}
        <label>
          <span>Categoría</span>
          <select
            disabled={Boolean(appliedQuery)}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setOffset(0);
            }}
            value={categoryId}
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Desde</span>
          <input
            disabled={Boolean(appliedQuery)}
            onChange={(event) => {
              setFrom(event.target.value);
              setOffset(0);
            }}
            type="date"
            value={from}
          />
        </label>
        <label>
          <span>Hasta</span>
          <input
            disabled={Boolean(appliedQuery)}
            onChange={(event) => {
              setTo(event.target.value);
              setOffset(0);
            }}
            type="date"
            value={to}
          />
        </label>
      </form>

      <div className="filter-row">
        <fieldset className="segmented-control">
          <legend className="visually-hidden">Filtrar imágenes por estado en el servidor</legend>
          {filters.map((item) => (
            <button
              className={filter === item.value ? 'selected' : undefined}
              key={item.value}
              disabled={Boolean(appliedQuery)}
              onClick={() => {
                setFilter(item.value);
                setOffset(0);
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </fieldset>
        <span className="result-count">
          {pagination.total} {pagination.total === 1 ? 'resultado' : 'resultados'}
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
      ) : images.length > 0 ? (
        <>
          <section aria-label="Imágenes disponibles" className="image-grid">
            {images.map((image) => (
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
            {appliedQuery
              ? 'La búsqueda no produjo resultados'
              : 'No hay imágenes con estos filtros'}
          </h2>
          <p>Ajusta la expresión, el estado, la categoría o el intervalo de fechas.</p>
          <button
            className="button button-secondary"
            onClick={() => {
              clearSearch();
              setFilter('all');
              setCategoryId('');
              setFrom('');
              setTo('');
            }}
            type="button"
          >
            Limpiar filtros
          </button>
        </section>
      )}
    </div>
  );
}
