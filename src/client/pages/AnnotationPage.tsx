import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AnnotationCanvas,
  type AnnotationGeometryChanges,
  type CanvasTool,
} from '../components/AnnotationCanvas.js';
import { IntegrationBadge } from '../components/IntegrationBadge.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ApiClientError, apiClient } from '../lib/api-client.js';
import type { BoundingBox } from '../lib/canvas-geometry.js';
import type { ApiAnnotation, ApiCategory, ApiImage } from '../types/api.js';

interface Workspace {
  image: ApiImage;
  images: ApiImage[];
  imageTotal: number;
  categories: ApiCategory[];
  annotations: ApiAnnotation[];
  annotationTotal: number;
}

type UndoAction =
  | { kind: 'create'; annotation: ApiAnnotation }
  | { kind: 'update'; annotation: ApiAnnotation }
  | { kind: 'delete'; annotation: ApiAnnotation };

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof ApiClientError ? cause.message : fallback;
}

export function AnnotationPage() {
  const { imageId } = useParams();
  const navigate = useNavigate();
  const numericImageId = Number(imageId);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [zoom, setZoom] = useState(1);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(
    'Selecciona “Nueva caja” y arrastra sobre la imagen para crear una anotación.',
  );

  const loadWorkspace = useCallback(async () => {
    if (!Number.isInteger(numericImageId) || numericImageId <= 0) {
      setWorkspace(null);
      setError('El identificador de la imagen no es válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [imageResponse, imagesResponse, categoriesResponse, annotationsResponse] =
        await Promise.all([
          apiClient.images.get(numericImageId),
          apiClient.images.list({ limit: 100, offset: 0 }),
          apiClient.categories.list({ limit: 100, offset: 0 }),
          apiClient.annotations.list({ imageId: numericImageId, limit: 100, offset: 0 }),
        ]);
      const navigationImages = imagesResponse.data.some((image) => image.id === numericImageId)
        ? imagesResponse.data
        : [...imagesResponse.data, imageResponse.data].sort((a, b) => a.id - b.id);

      setWorkspace({
        image: imageResponse.data,
        images: navigationImages,
        imageTotal: imagesResponse.pagination.total,
        categories: categoriesResponse.data,
        annotations: annotationsResponse.data,
        annotationTotal: annotationsResponse.pagination.total,
      });
      setSelectedAnnotationId(annotationsResponse.data[0]?.id ?? null);
      setSelectedCategoryId((current) =>
        categoriesResponse.data.some((category) => category.id === current)
          ? current
          : (categoriesResponse.data[0]?.id ?? null),
      );
      setActiveTool('select');
      setZoom(1);
      setUndoStack([]);
      setFeedback('Datos cargados desde la API. Cada cambio se guarda automáticamente.');
    } catch (cause) {
      setWorkspace(null);
      setError(
        errorMessage(
          cause,
          'No se pudo cargar el espacio de anotación. Comprueba la API e inténtalo de nuevo.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [numericImageId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const handleCreate = async (box: BoundingBox) => {
    if (!workspace) {
      return;
    }
    const category = workspace.categories.find((item) => item.id === selectedCategoryId);
    if (!category) {
      setFeedback('Selecciona una categoría antes de dibujar.');
      return;
    }

    setSaving(true);
    setFeedback(`Guardando una caja de “${category.name}”…`);
    try {
      const created = await apiClient.annotations.create({
        imageId: workspace.image.id,
        categoryId: category.id,
        ...box,
      });
      const refreshedImage = await apiClient.images.get(workspace.image.id);
      setWorkspace((current) =>
        current
          ? {
              ...current,
              image: refreshedImage.data,
              images: current.images.map((image) =>
                image.id === refreshedImage.data.id ? refreshedImage.data : image,
              ),
              annotations: [...current.annotations, created.data],
              annotationTotal: current.annotationTotal + 1,
            }
          : current,
      );
      setSelectedAnnotationId(created.data.id);
      setUndoStack((current) => [...current, { kind: 'create', annotation: created.data }]);
      setActiveTool('select');
      setFeedback(`Caja de “${category.name}” guardada en la base de datos.`);
    } catch (cause) {
      setFeedback(errorMessage(cause, 'No se pudo guardar la caja. Inténtalo de nuevo.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number, changes: AnnotationGeometryChanges) => {
    if (!workspace) {
      return;
    }
    const previous = workspace.annotations.find((annotation) => annotation.id === id);
    if (!previous) {
      return;
    }
    const optimistic: ApiAnnotation = {
      ...previous,
      ...changes,
      area: (changes.width ?? previous.width) * (changes.height ?? previous.height),
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    setFeedback('Guardando la nueva posición y tamaño…');
    setWorkspace((current) =>
      current
        ? {
            ...current,
            annotations: current.annotations.map((annotation) =>
              annotation.id === id ? optimistic : annotation,
            ),
          }
        : current,
    );

    try {
      const updated = await apiClient.annotations.update(id, changes);
      setWorkspace((current) =>
        current
          ? {
              ...current,
              annotations: current.annotations.map((annotation) =>
                annotation.id === id ? updated.data : annotation,
              ),
            }
          : current,
      );
      setFeedback('Cambios guardados en la base de datos.');
      setUndoStack((current) => [...current, { kind: 'update', annotation: previous }]);
    } catch (cause) {
      setWorkspace((current) =>
        current
          ? {
              ...current,
              annotations: current.annotations.map((annotation) =>
                annotation.id === id ? previous : annotation,
              ),
            }
          : current,
      );
      setFeedback(
        errorMessage(cause, 'No se pudo guardar el cambio; la caja volvió a su posición anterior.'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (annotation: ApiAnnotation) => {
    if (!workspace) {
      return;
    }

    setSaving(true);
    setFeedback('Eliminando la caja…');
    try {
      await apiClient.annotations.remove(annotation.id);
      setWorkspace((current) =>
        current
          ? {
              ...current,
              annotations: current.annotations.filter((item) => item.id !== annotation.id),
              annotationTotal: Math.max(0, current.annotationTotal - 1),
            }
          : current,
      );
      setSelectedAnnotationId((current) => (current === annotation.id ? null : current));
      setUndoStack((current) => [...current, { kind: 'delete', annotation }]);
      setFeedback('Caja eliminada. Puedes deshacer esta acción.');
    } catch (cause) {
      setFeedback(errorMessage(cause, 'No se pudo eliminar la caja.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    const action = undoStack.at(-1);
    if (!workspace || !action) {
      return;
    }

    setSaving(true);
    setFeedback('Deshaciendo el último cambio…');
    try {
      if (action.kind === 'create') {
        await apiClient.annotations.remove(action.annotation.id);
        setWorkspace((current) =>
          current
            ? {
                ...current,
                annotations: current.annotations.filter(
                  (annotation) => annotation.id !== action.annotation.id,
                ),
                annotationTotal: Math.max(0, current.annotationTotal - 1),
              }
            : current,
        );
      } else if (action.kind === 'update') {
        const restored = await apiClient.annotations.update(action.annotation.id, {
          categoryId: action.annotation.categoryId,
          x: action.annotation.x,
          y: action.annotation.y,
          width: action.annotation.width,
          height: action.annotation.height,
          isCrowd: action.annotation.isCrowd,
        });
        setWorkspace((current) =>
          current
            ? {
                ...current,
                annotations: current.annotations.map((annotation) =>
                  annotation.id === restored.data.id ? restored.data : annotation,
                ),
              }
            : current,
        );
      } else {
        const restored = await apiClient.annotations.create({
          imageId: action.annotation.imageId,
          categoryId: action.annotation.categoryId,
          x: action.annotation.x,
          y: action.annotation.y,
          width: action.annotation.width,
          height: action.annotation.height,
          isCrowd: action.annotation.isCrowd,
        });
        setWorkspace((current) =>
          current
            ? {
                ...current,
                annotations: [...current.annotations, restored.data],
                annotationTotal: current.annotationTotal + 1,
              }
            : current,
        );
        setSelectedAnnotationId(restored.data.id);
      }

      setUndoStack((current) => current.slice(0, -1));
      setFeedback('Último cambio deshecho y sincronizado con la API.');
    } catch (cause) {
      setFeedback(errorMessage(cause, 'No se pudo deshacer el último cambio.'));
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (nextImageId?: number) => {
    if (!workspace || workspace.image.status !== 'in_progress') {
      return;
    }

    setSaving(true);
    setFeedback('Marcando la imagen como completada…');
    try {
      const updated = await apiClient.images.updateStatus(workspace.image.id, 'completed');
      setWorkspace((current) =>
        current
          ? {
              ...current,
              image: updated.data,
              images: current.images.map((image) =>
                image.id === updated.data.id ? updated.data : image,
              ),
            }
          : current,
      );

      if (nextImageId) {
        navigate(`/annotate/${nextImageId}`);
        return;
      }

      setFeedback('Imagen completada. Ya puedes volver a la bandeja.');
    } catch (cause) {
      setFeedback(
        errorMessage(cause, 'No se pudo finalizar la imagen. Los cambios permanecen guardados.'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <section aria-live="polite" className="async-state">
          <span aria-hidden="true" className="loading-spinner" />
          <h1>Cargando espacio de anotación…</h1>
          <p>Consultando la imagen, las categorías y sus bounding boxes.</p>
        </section>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="page-wrap">
        <section className="async-state async-state-error" role="alert">
          <span aria-hidden="true">!</span>
          <h1>No se pudo abrir la imagen</h1>
          <p>{error ?? 'La imagen solicitada no existe.'}</p>
          <div className="async-actions">
            <Link className="button button-ghost" to="/images">
              Volver a imágenes
            </Link>
            <button
              className="button button-primary"
              onClick={() => void loadWorkspace()}
              type="button"
            >
              Reintentar
            </button>
          </div>
        </section>
      </div>
    );
  }

  const { image, images, categories, annotations, annotationTotal, imageTotal } = workspace;
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const currentIndex = images.findIndex((item) => item.id === image.id);
  const previousImage = currentIndex > 0 ? images[currentIndex - 1] : undefined;
  const nextImage =
    currentIndex >= 0 && currentIndex < images.length - 1 ? images[currentIndex + 1] : undefined;

  return (
    <div className="annotation-page">
      <header className="annotation-header">
        <div className="annotation-title">
          <Link aria-label="Volver a imágenes" className="back-link" to="/images">
            ←
          </Link>
          <div>
            <span className="eyebrow">Portal de anotación</span>
            <h1>{image.originalName}</h1>
            <p>
              {image.width} × {image.height} px · {annotationTotal}{' '}
              {annotationTotal === 1 ? 'caja persistida' : 'cajas persistidas'}
            </p>
          </div>
        </div>
        <div className="annotation-header-actions">
          <IntegrationBadge />
          <StatusBadge status={image.status} />
        </div>
      </header>

      <div className="workspace-grid">
        <aside className="tool-panel category-panel">
          <div className="tool-panel-heading">
            <span className="eyebrow">Paso 1</span>
            <h2>Categoría</h2>
            <p>Selecciona la clase antes de dibujar una caja.</p>
          </div>
          {categories.length > 0 ? (
            <div className="category-list">
              {categories.map((category, index) => (
                <button
                  className={
                    category.id === selectedCategoryId
                      ? 'category-option active'
                      : 'category-option'
                  }
                  key={category.id}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setFeedback(`Categoría “${category.name}” seleccionada.`);
                  }}
                  type="button"
                >
                  <span className="category-color" style={{ backgroundColor: category.color }} />
                  <span>{category.name}</span>
                  <kbd>{index + 1}</kbd>
                </button>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <span aria-hidden="true">!</span>
              <p>No hay categorías. Solicita al equipo cargar el catálogo antes de anotar.</p>
            </div>
          )}
          <div className="tool-tip">
            <span aria-hidden="true">i</span>
            <p>Crear, mover y redimensionar guarda los cambios inmediatamente en la API.</p>
          </div>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div className="toolbar-group">
              <button
                className={`tool-button${activeTool === 'select' ? ' active' : ''}`}
                disabled={saving}
                onClick={() => setActiveTool('select')}
                type="button"
              >
                <span aria-hidden="true">↖</span>
                Seleccionar
              </button>
              <button
                className={`tool-button${activeTool === 'draw' ? ' active' : ''}`}
                disabled={!selectedCategory || saving}
                onClick={() => {
                  setActiveTool('draw');
                  setFeedback(
                    `Dibuja una caja para la categoría “${selectedCategory?.name ?? ''}”.`,
                  );
                }}
                type="button"
              >
                <span aria-hidden="true">□</span>
                Nueva caja
              </button>
            </div>
            <div className="toolbar-group">
              <button
                className="tool-button"
                disabled={undoStack.length === 0 || saving}
                onClick={() => void handleUndo()}
                type="button"
              >
                ↶ Deshacer
              </button>
              <button
                aria-label="Alejar"
                className="icon-button"
                disabled={zoom <= 0.5 || saving}
                onClick={() => setZoom((current) => Math.max(0.5, current - 0.25))}
                type="button"
              >
                −
              </button>
              <button
                className="zoom-indicator zoom-reset"
                disabled={saving}
                onClick={() => setZoom(1)}
                title="Ajustar al ancho"
                type="button"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                aria-label="Acercar"
                className="icon-button"
                disabled={zoom >= 2 || saving}
                onClick={() => setZoom((current) => Math.min(2, current + 0.25))}
                type="button"
              >
                +
              </button>
              <button
                aria-label="Recargar datos persistidos"
                className="icon-button"
                disabled={saving}
                onClick={() => void loadWorkspace()}
                title="Recargar desde la API"
                type="button"
              >
                ↻
              </button>
            </div>
          </div>
          <AnnotationCanvas
            annotations={annotations}
            categories={categories}
            draftCategory={selectedCategory}
            imageHeight={image.height}
            imageUrl={apiClient.images.fileUrl(image.id)}
            imageWidth={image.width}
            isBusy={saving}
            mode={activeTool}
            onChange={(id, changes) => void handleUpdate(id, changes)}
            onCreate={(box) => void handleCreate(box)}
            onSelect={setSelectedAnnotationId}
            selectedId={selectedAnnotationId}
            zoom={zoom}
          />
          <div className="canvas-caption">
            <span>
              <i className="caption-dot" /> Coordenadas en píxeles absolutos
            </span>
            <span aria-live="polite">{feedback}</span>
          </div>
        </section>

        <aside className="tool-panel annotations-panel">
          <div className="tool-panel-heading row-heading">
            <div>
              <span className="eyebrow">Objetos</span>
              <h2>Anotaciones</h2>
            </div>
            <span className="count-pill">{annotationTotal}</span>
          </div>
          {annotations.length > 0 ? (
            <div className="annotation-list">
              {annotations.map((annotation) => {
                const category = categories.find((item) => item.id === annotation.categoryId);
                const isSelected = annotation.id === selectedAnnotationId;
                return (
                  <div
                    className={`annotation-item${isSelected ? ' active' : ''}`}
                    key={annotation.id}
                  >
                    <button
                      className="annotation-select"
                      onClick={() => setSelectedAnnotationId(annotation.id)}
                      type="button"
                    >
                      <span className="annotation-index">#{annotation.id}</span>
                      <span className="annotation-copy">
                        <strong>
                          <i style={{ background: category?.color }} />
                          {category?.name ?? 'Categoría no disponible'}
                        </strong>
                        <small>
                          {Math.round(annotation.width)} × {Math.round(annotation.height)} px
                        </small>
                      </span>
                    </button>
                    <button
                      aria-label={`Eliminar anotación ${annotation.id}`}
                      className="annotation-delete"
                      disabled={saving}
                      onClick={() => void handleDelete(annotation)}
                      title="Eliminar caja"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel-empty">
              <span aria-hidden="true">□</span>
              <p>Esta imagen todavía no tiene cajas.</p>
            </div>
          )}
        </aside>
      </div>

      <footer className="annotation-footer">
        <div className="image-navigation">
          {previousImage ? (
            <Link className="button button-ghost" to={`/annotate/${previousImage.id}`}>
              ← Anterior
            </Link>
          ) : (
            <button className="button button-ghost" disabled type="button">
              ← Anterior
            </button>
          )}
          <span>
            Imagen {currentIndex + 1} de {imageTotal}
          </span>
          {nextImage && !saving ? (
            <Link className="button button-ghost" to={`/annotate/${nextImage.id}`}>
              Siguiente →
            </Link>
          ) : (
            <button className="button button-ghost" disabled type="button">
              Siguiente →
            </button>
          )}
        </div>
        <div className="save-actions">
          <span aria-live="polite" className="save-status">
            <span aria-hidden="true" className="save-status-dot" />
            {saving ? 'Guardando…' : 'Cambios guardados automáticamente'}
          </span>
          {image.status === 'completed' && nextImage && !saving ? (
            <Link className="button button-primary" to={`/annotate/${nextImage.id}`}>
              Siguiente imagen
              <span aria-hidden="true">→</span>
            </Link>
          ) : image.status === 'completed' ? (
            <button className="button button-primary" disabled type="button">
              Imagen completada
              <span aria-hidden="true">✓</span>
            </button>
          ) : (
            <button
              className="button button-primary"
              disabled={image.status !== 'in_progress' || saving}
              onClick={() => void handleComplete(nextImage?.id)}
              title={
                image.status === 'pending'
                  ? 'Agrega al menos una caja antes de finalizar la imagen'
                  : undefined
              }
              type="button"
            >
              {nextImage ? 'Finalizar y siguiente' : 'Finalizar imagen'}
              <span aria-hidden="true">{nextImage ? '→' : '✓'}</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
